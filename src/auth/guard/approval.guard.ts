import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ApprovalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user (public endpoint?), pass. (AuthGuard should run before this)
    if (!user) return true;

    // Admin bypass (optional, but good for safety)
    if (user.role === 'admin' || user.role === 'super_admin') return true;

    if (user.status !== 'APPROVED') {
      if (user.status === 'PENDING')
        throw new ForbiddenException('Account pending approval');
      if (user.status === 'SUSPENDED')
        throw new ForbiddenException('Account suspended');
      if (user.status === 'REJECTED')
        throw new ForbiddenException('Account rejected');
    }
    return true;
  }
}
