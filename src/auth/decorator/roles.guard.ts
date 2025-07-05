import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
// This guard will run whenever it's attached using @UseGuards(RolesGuard)
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from the @Roles() decorator (if set on this route)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(), // method-level
      context.getClass(), // controller-level
    ]);

    // 2. If no roles required, allow access
    if (!requiredRoles) return true;

    // 3. Get the request object and extract the logged-in user's role
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role: string } }>();
    const user = request.user;

    // 4. Return true if user's role matches any allowed role
    return requiredRoles.includes(user?.role as string);
  }
}
