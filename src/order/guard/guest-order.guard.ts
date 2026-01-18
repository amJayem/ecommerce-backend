import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface GuestTokenPayload {
  type: string;
  sub: number;
  email: string;
}

@Injectable()
export class GuestOrderGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { guest?: any }>();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing guest access token');
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      const payload = this.jwtService.verify(
        token,
      ) as unknown as GuestTokenPayload;

      if (payload.type !== 'guest_order_access') {
        throw new ForbiddenException('Invalid token type');
      }

      // Ensure the token is scoped to the specific order being requested
      const requestedId = parseInt(request.params.id, 10);
      if (payload.sub !== requestedId) {
        throw new ForbiddenException('This token is not valid for this order');
      }

      // Attach guest info to request if needed
      request.guest = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Guest token expired or invalid');
    }
  }
}
