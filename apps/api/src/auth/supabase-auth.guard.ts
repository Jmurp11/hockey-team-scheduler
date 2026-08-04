import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { supabase } from '../supabase';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Supabase JWT Auth Guard
 *
 * Authenticates a request against a verified Supabase Auth session and attaches
 * the resolved identity to the request:
 *   - `request.authUserId` — the Supabase Auth user id (UUID)
 *   - `request.authUser`   — `{ id, email }`
 *
 * Controllers MUST read user identity from these values (or the
 * `@CurrentAuthUser()` decorator) rather than trusting a client-supplied
 * `userId`/`teamId` in the request body.
 *
 * Routes/controllers marked with `@Public()` bypass this guard.
 *
 * Mirrors the working pattern in developer-portal/developer-auth.guard.ts, but
 * is dependency-free so it can live in the @Global AuthModule and be reused
 * anywhere without module coupling.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const user = await this.validateSupabaseToken(token);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid or expired session. Please log in again.',
      );
    }

    (request as any).authUserId = user.id;
    (request as any).authUser = user;
    return true;
  }

  private async validateSupabaseToken(
    token: string,
  ): Promise<{ id: string; email: string } | null> {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) {
        return null;
      }
      return { id: data.user.id, email: data.user.email || '' };
    } catch {
      return null;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
