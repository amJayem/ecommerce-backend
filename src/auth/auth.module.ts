import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuditService } from './audit.service';
import { AccountLockoutService } from './account-lockout.service';
import { JwtStrategy } from './jwt/jwt.strategy';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        // Load JWT secret from environment variable JWT_SECRET using ConfigService
        secret: config.get<string>('JWT_SECRET'), // use JWT_SECRET everywhere
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuditService,
    AccountLockoutService,
    PrismaService,
    JwtStrategy,
  ],
})
export class AuthModule {}
