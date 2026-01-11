import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DeveloperPortalService } from './developer-portal.service';

/**
 * Developer Auth Guard
 *
 * Protects developer portal routes by validating JWT session tokens.
 * This is used for the developer dashboard and account management endpoints.
 *
 * The guard extracts the Bearer token from the Authorization header
 * and validates it against the developer session system.
 *
 * NOTE: This is separate from the API key guard which is used for
 * actual API request authentication.
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

    const apiUser = await this.developerPortalService.validateSessionToken(token);

    if (!apiUser) {
      throw new UnauthorizedException('Invalid or expired session token');
    }

    // Attach user to request for use in controllers
    (request as any).developerUser = apiUser;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
