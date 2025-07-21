// Extending Passport's JWT strategy for NestJS
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
// Tell Nest to use this strategy for 'jwt'
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extract JWT from Authorization: Bearer <token>
      // jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookies = req?.cookies as { [key: string]: string } | undefined;
          return cookies?.['access_token'] ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // fallback to header
      ]),
      ignoreExpiration: false,
      // Secret key used to sign the token (should come from env)
      secretOrKey: process.env.JWT_SECRET || 'your_jwt_secret', // <-- Use env variable
    });
  }

  // This runs after the token is validated
  validate(payload: { sub: number; email: string; role: string }) {
    // Attach decoded token info to `req.user`
    return { userId: payload.sub, email: payload.email, role: payload.role };
    // const user = await this.prisma.user.findUnique({
    //   where: { email: payload.email },
    // });
    // return user;
  }
}
