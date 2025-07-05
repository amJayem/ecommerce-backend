import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const userExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (userExists) throw new BadRequestException('Email already in use');

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashed,
        role: dto.role || 'customer', // Default if not sent
      },
    });

    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new BadRequestException('Invalid credentials');
    const { access_token } = this.signToken(user.id, user.email, user.role);
    return { access_token, ...user }; // Return user info along with token
  }

  private signToken(
    userId: number,
    email: string,
    role: string,
  ): { access_token: string } {
    const payload = { sub: userId, email, role };
    const token = this.jwt.sign(payload);
    return { access_token: token };
  }
}
