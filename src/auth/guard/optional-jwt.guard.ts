import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest(err: any, user: any, info: any) {
    // If error (invalid token) or no user, return null -> treated as Guest
    // If user found, return user -> treated as Authenticated
    if (err || !user) {
      return null;
    }
    return user;
  }
}
