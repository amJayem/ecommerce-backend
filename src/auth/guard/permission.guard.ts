import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../permission/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      'permission',
      [context.getHandler(), context.getClass()],
    );

    // If no permission required, allow access
    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN bypass - full access to everything
    if (user.role === 'super_admin') {
      return true;
    }

    // Check if user has the required permission
    const hasPermission = await this.permissionService.userHasPermission(
      user.id,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permission denied. Required permission: ${requiredPermission}`,
      );
    }

    return true;
  }
}
