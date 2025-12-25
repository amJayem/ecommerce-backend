import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from './audit.service';
import { AccountLockoutService } from './account-lockout.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
    private lockoutService: AccountLockoutService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Hash the password
    const hashed = await bcrypt.hash(dto.password, 10);

    // 1. Determine status
    const status =
      !dto.role || dto.role === 'customer' ? 'APPROVED' : 'PENDING';

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
        status, // Set status
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
    // 0. Check if account is locked
    if (this.lockoutService.isAccountLocked(dto.email)) {
      const remainingTime = this.lockoutService.getLockoutTimeRemaining(
        dto.email,
      );
      const minutes = Math.ceil(remainingTime / 60000);
      throw new ForbiddenException(
        `Account locked. Try again in ${minutes} minutes.`,
      );
    }

    // 1. Find the user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      this.lockoutService.recordFailedAttempt(dto.email);
      this.auditService.logLoginFailed(dto.email, 'User not found');
      throw new ForbiddenException('User not found');
    }

    // 2. Check password
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) {
      this.lockoutService.recordFailedAttempt(dto.email);
      this.auditService.logLoginFailed(dto.email, 'Invalid password');
      throw new ForbiddenException('Invalid credentials');
    }

    // 2.5 Check User Status (Approval)
    // Exception: Admin (or specific privileged roles) might bypass?
    // User requested: "for super_admin will get all access".
    // We assume 'admin' role bypasses or is always APPROVED anyway.
    // Logic: If PENDING, block.
    // 2.5 Check User Status (Approval)
    // - PENDING: Allowed to login (restricted access via Guards)
    // - SUSPENDED/REJECTED: Blocked
    if (user.status === 'SUSPENDED') {
      throw new ForbiddenException('Your account has been suspended.');
    }
    if (user.status === 'REJECTED') {
      throw new ForbiddenException('Your account request was rejected.');
    }

    // 3. Generate tokens
    const tokens = await this.getTokens(user.id, user.email, user.role);

    // 4. Store refresh token in DB
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    // 5. Log successful login and clear lockout
    this.lockoutService.recordSuccessfulLogin(user.email);
    this.auditService.logLoginSuccess(user.id, user.email);

    // 6. Return both tokens to frontend
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, refreshToken: __, ...userData } = user;
    return {
      ...tokens,
      ...userData,
      permissions: user.permissions,
    };
  }

  async logout(email: string) {
    const user = await this.prisma.user.update({
      where: { email },
      data: { refreshToken: null }, // 🧨 Invalidate token
    });
    return { ...user, message: 'User logout successfully' };
  }

  async loginAdmin(dto: LoginDto) {
    const result = await this.login(dto);

    // 1. Super admin always allowed
    if (result.role === 'super_admin') {
      return result;
    }

    // 2. For all others (admin, moderator, etc.), check status
    // User must be explicitly APPROVED to access admin dashboard
    if (result.status !== 'APPROVED') {
      this.auditService.logLoginFailed(
        dto.email,
        `Unapproved user (${result.status}) attempted admin login`,
      );
      throw new ForbiddenException(
        `Access denied. Your account status is ${result.status}. Please wait for admin approval.`,
      );
    }

    // 3. Prevent regular customers from entering the admin dashboard
    if (result.role === 'customer') {
      this.auditService.logLoginFailed(
        dto.email,
        'Non-admin user attempted admin login',
      );
      throw new ForbiddenException(
        'Access denied. Administrator privileges required.',
      );
    }

    return result;
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
    // 1. Find user with this refresh token (temporarily revert to original)
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

  /**
   * Get user by ID (for /me endpoint)
   */
  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Remove sensitive fields (same as login response)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userData } = user;
    return {
      ...userData,
      permissions: user.permissions,
    };
  }
}
