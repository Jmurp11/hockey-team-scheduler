import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Identity resolved from a verified Supabase JWT and attached to the request
 * by {@link SupabaseAuthGuard}.
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Injects the authenticated Supabase user id (UUID) into a route handler.
 * Always derived from the verified Bearer token — never from the request body.
 *
 * @example
 *   cancelAccount(@CurrentAuthUser() authUserId: string) { ... }
 */
export const CurrentAuthUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUserId;
  },
);

/**
 * Injects the full authenticated Supabase user ({ id, email }).
 */
export const CurrentAuthUserFull = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.authUser;
  },
);
