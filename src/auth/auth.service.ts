import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Hash the password
    const hashed = await bcrypt.hash(dto.password, 10);

    // 2. Create the user in DB
    const user = await this.prisma.user.create({
      data: {
        address: dto.address,
        email: dto.email,
        isVerified: dto.isVerified,
        name: dto.name,
        password: hashed,
        phoneNumber: dto.phoneNumber ?? null,
        role: dto.role || 'customer',
      },
    });

    // 3. Generate tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Store refresh token in DB
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // 5. Return both tokens to frontend
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...sanitizedUser } = user;
    return { ...tokens, user: sanitizedUser };
  }

  async login(dto: LoginDto) {
    // 1. Find the user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('User not found');

    // 2. Check password
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new ForbiddenException('Invalid credentials');

    // 3. Generate tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Store refresh token in DB
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // 5. Return both tokens to frontend
    return { ...tokens, ...user };
  }

  async logout(email: string) {
    const user = await this.prisma.user.update({
      where: { email },
      data: { refreshToken: null }, // 🧨 Invalidate token
    });
    return { ...user, message: 'User logout successfully' };
  }

  /**
   * Generate access + refresh tokens
   */
  async getTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  /**
   * Save hashed refresh token in DB
   */

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  /**
   * Handle refresh token flow
   */

  async refreshTokens(refreshToken: string) {
    // 1. Find user with this refresh token
    const users = await this.prisma.user.findMany({
      where: {},
      select: { id: true, email: true, role: true, refreshToken: true },
    });

    const user = users.find(
      (u) => u.refreshToken && bcrypt.compareSync(refreshToken, u.refreshToken),
    );

    // 2. If not found, reject
    if (!user) throw new ForbiddenException('Access Denied');

    // 3. Generate new tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Save new refresh token to DB
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // 5. Return to frontend
    return tokens;
  }
}
