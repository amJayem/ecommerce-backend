import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuspensionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check if user is logged in (from OptionalJwtAuthGuard)
    if (user) {
      if (user.status === 'SUSPENDED') {
        throw new ForbiddenException(
          'Your account has been suspended. You cannot access this resource.',
        );
      }
      // Note: We are allowing 'PENDING' users to view public resources as if they were guests.
      // If needed, we can block them too:
      // if (user.status === 'PENDING') throw ...
    }

    return true; // Guests (no user) and non-suspended users are allowed
  }
}
