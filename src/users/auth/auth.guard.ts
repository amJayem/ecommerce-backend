import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { jwtConstants } from '../constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('auth is running');
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('no token');
    }

    const payload = this.jwtService.verifyAsync(token, {
      secret: jwtConstants.secret,
    });

    request['user'] = payload;

    return true;
  }

  extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') || [];
    return type === 'Bearer' ? token : null;
  }
}
