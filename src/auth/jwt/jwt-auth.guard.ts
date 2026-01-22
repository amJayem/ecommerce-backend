import { AuthGuard } from '@nestjs/passport';
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Check if this is a public route by path
    // Use exact match or specific startsWith to avoid false positives
    // For example, /orders/my-orders should NOT match /orders (POST create)
    const url = request.url.split('?')[0]; // Remove query params
    const isPublicPath =
      url === '/api/v1/orders' || // POST create order
      url.startsWith('/api/v1/orders/thank-you') || // Thank you page
      url.startsWith('/api/v1/orders/guest-lookup') || // Guest lookup
      url.startsWith('/api/v1/orders/guest/'); // Guest order view

    // Try multiple ways to get the metadata
    const isPublicHandler = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );
    const isPublicClass = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getClass(),
    );
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || isPublicHandler || isPublicClass || isPublicPath) {
      return true;
    }

    return super.canActivate(context);
  }
}
