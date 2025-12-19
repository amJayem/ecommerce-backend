// Extending Passport's JWT strategy for NestJS
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
// Tell Nest to use this strategy for 'jwt'
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req?.cookies as { [key: string]: string } | undefined;
          return cookies?.['access_token'] ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // Use the JWT secret from environment variables via ConfigService. Fallback to 'your_jwt_secret' for development/testing.
      secretOrKey: config.get<string>('JWT_SECRET') || 'your_jwt_secret',
    });
  }

  async validate(payload: { sub: number; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return null; // or throw Unauthorized
    }

    // Return the full user object (stripped of password if needed, but req.user usually acts as internal context)
    // We can strip sensitive fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, refreshToken, ...userContext } = user;
    return userContext;
  }
}
