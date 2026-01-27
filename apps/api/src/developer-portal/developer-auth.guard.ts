import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DeveloperPortalService } from './developer-portal.service';
import { supabase } from '../supabase';

/**
 * Developer Auth Guard
 *
 * Protects developer portal routes by validating Supabase authentication tokens.
 * Users must:
 * 1. Have a valid Supabase Auth session
 * 2. Have an active api_users record (developer subscription)
 *
 * This guard is used for all developer portal UI routes.
 * External API access uses DeveloperApiGuard with x-api-key header instead.
 */
@Injectable()
export class DeveloperAuthGuard implements CanActivate {
  constructor(private readonly developerPortalService: DeveloperPortalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    // Validate Supabase Auth token
    const supabaseUser = await this.validateSupabaseToken(token);
    if (!supabaseUser) {
      throw new UnauthorizedException(
        'Invalid or expired session. Please log in again.',
      );
    }

    // Get api_user linked to this Supabase auth user
    const apiUser = await this.developerPortalService.getApiUserByAuthId(
      supabaseUser.id,
      supabaseUser.email || '',
    );

    if (!apiUser) {
      throw new UnauthorizedException(
        'No developer access. Please subscribe to the developer portal.',
      );
    }

    // Attach user to request for use in controllers
    (request as any).developerUser = apiUser;
    (request as any).authUserId = supabaseUser.id;
    return true;
  }

  /**
   * Validates a Supabase Auth JWT token and returns the user.
   */
  private async validateSupabaseToken(token: string): Promise<{ id: string; email?: string } | null> {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        return null;
      }

      return {
        id: data.user.id,
        email: data.user.email,
      };
    } catch {
      return null;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
