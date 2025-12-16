import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>('permission', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Admin bypass
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }

    if (!user || !user.roleRel || !user.roleRel.permissions) {
      return false;
    }

    return user.roleRel.permissions.some((p) => p.action === requiredPermission);
  }
}
