import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtUserPayload {
  id: number;
  email: string;
  role: string;
  status: string;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtUserPayload }>();
    return request.user as JwtUserPayload;
  },
);
