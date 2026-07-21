import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { supabase } from '../supabase';
import { DeveloperPortalService } from '../developer-portal/developer-portal.service';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * Composite access guard for the shared "data" API surface (teams, tournaments,
 * leagues, rinks). Grants access to EITHER audience:
 *
 *  1. First-party app users — authenticated by a Supabase JWT
 *     (`Authorization: Bearer <token>`). Identity is attached as
 *     `request.authUserId` / `request.authUser`.
 *
 *  2. External metered API customers — authenticated by a developer API key
 *     (`x-api-key`), validated against the hashed key store, gated on an active
 *     Stripe subscription, and recorded for metered billing. The resolved
 *     account is attached as `request.apiUser`.
 *
 * A first-party JWT takes precedence when both are present. `@Public()` routes
 * bypass the guard entirely.
 *
 * This replaces the retired shared-static-key `ApiKeyGuard` so the frontend no
 * longer needs to embed an API key, while preserving metered key access for
 * api-only customers.
 */
@Injectable()
export class ApiAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly developerPortalService: DeveloperPortalService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    // 1. First-party Supabase JWT takes precedence.
    const token = this.extractBearer(request);
    if (token) {
      const user = await this.validateSupabaseToken(token);
      if (user) {
        (request as any).authUserId = user.id;
        (request as any).authUser = user;
        return true;
      }
    }

    // 2. Fall back to a metered developer API key.
    const apiKey = request.headers['x-api-key'] as string | undefined;
    if (apiKey) {
      return this.authorizeApiKey(request, apiKey);
    }

    throw new UnauthorizedException(
      'Authentication required. Provide a Supabase session token (Authorization: Bearer) or an API key (x-api-key).',
    );
  }

  /**
   * Validates a metered developer API key: existence, active flag, live Stripe
   * subscription, then records the request for billing. Mirrors DeveloperApiGuard.
   */
  private async authorizeApiKey(
    request: Request,
    apiKey: string,
  ): Promise<boolean> {
    const apiUser = await this.developerPortalService.validateApiKey(apiKey);
    if (!apiUser) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Invalid API key. Please check your credentials.',
        code: 'INVALID_API_KEY',
      });
    }

    if (!apiUser.is_active) {
      throw new ForbiddenException({
        error: 'forbidden',
        message:
          'Your subscription is inactive. Please update your payment method or resubscribe.',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }

    const subscriptionStatus =
      await this.developerPortalService.getSubscriptionStatus(apiUser.id);
    if (subscriptionStatus !== 'active') {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Your subscription is not active.',
        code: 'SUBSCRIPTION_' + String(subscriptionStatus).toUpperCase(),
      });
    }

    // Record usage for metered billing (fire-and-forget).
    this.developerPortalService.recordApiRequest(apiUser.id).catch((error) => {
      console.error('Error recording API request:', error);
    });

    (request as any).apiUser = apiUser;
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

  private extractBearer(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
