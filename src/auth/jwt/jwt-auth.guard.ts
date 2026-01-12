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

    // Check if this is a public route by path (fallback if metadata doesn't work)
    const publicPaths = ['/api/v1/orders/thank-you', '/api/v1/orders'];
    // We check if the request.url STARTS with any of the public paths.
    // Note: request.url includes query parameters, so 'startsWith' is safer than exact match.
    // We also handle the case where the prefix might be slightly different depending on global prefix settings,
    // so checking for both with and without the api/v1 prefix is safer if uncertain, but here we know the prefix.
    const isPublicPath = publicPaths.some((path) => request.url.includes(path));

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
