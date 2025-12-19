import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      'permission',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Admin bypass
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return true;
    }

    // TODO: Implement proper permission checking later
    // For now, allow access to prevent breaking the app
    // The user will implement a proper permission system later
    return true;
  }
}
