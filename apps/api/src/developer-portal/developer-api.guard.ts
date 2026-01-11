import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { DeveloperPortalService } from './developer-portal.service';

/**
 * Developer API Guard
 *
 * Validates API requests from external developers by:
 * 1. Extracting the API key from x-api-key header
 * 2. Validating the key exists and is valid
 * 3. Checking that the user has an active subscription
 * 4. Recording the API request for usage tracking
 *
 * SECURITY CONSIDERATIONS:
 * - API keys are hashed in the database
 * - Requests are blocked if subscription is inactive/unpaid
 * - Usage is tracked for metered billing
 * - Errors don't reveal whether key exists
 *
 * USE THIS GUARD: Apply to any API endpoints that should be
 * accessible to external developers (tournaments, teams, etc.)
 */
@Injectable()
export class DeveloperApiGuard implements CanActivate {
  constructor(private readonly developerPortalService: DeveloperPortalService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    // Check for API key presence
    if (!apiKey) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Missing API key. Include your API key in the x-api-key header.',
        code: 'MISSING_API_KEY',
      });
    }

    // Validate API key
    const apiUser = await this.developerPortalService.validateApiKey(apiKey);

    if (!apiUser) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Invalid API key. Please check your credentials.',
        code: 'INVALID_API_KEY',
      });
    }

    // Check if subscription is active
    if (!apiUser.is_active) {
      throw new ForbiddenException({
        error: 'forbidden',
        message: 'Your subscription is inactive. Please update your payment method or resubscribe.',
        code: 'SUBSCRIPTION_INACTIVE',
      });
    }

    // Verify subscription status with Stripe (optional - for extra security)
    const subscriptionStatus = await this.developerPortalService.getSubscriptionStatus(apiUser.id);

    if (subscriptionStatus !== 'active') {
      // Handle specific subscription states
      const errorMessages: Record<string, string> = {
        past_due: 'Your subscription payment is past due. Please update your payment method.',
        canceled: 'Your subscription has been canceled. Please resubscribe to continue using the API.',
        unpaid: 'Your subscription payment failed. Please update your payment method.',
        incomplete: 'Your subscription setup is incomplete. Please complete the payment process.',
      };

      throw new ForbiddenException({
        error: 'forbidden',
        message: errorMessages[subscriptionStatus] || 'Your subscription is not active.',
        code: 'SUBSCRIPTION_' + subscriptionStatus.toUpperCase(),
      });
    }

    // Record the API request for usage tracking and billing
    // Run async without awaiting to not slow down the request
    this.developerPortalService.recordApiRequest(apiUser.id).catch((error) => {
      console.error('Error recording API request:', error);
    });

    // Attach user to request for use in controllers if needed
    (request as any).apiUser = apiUser;

    return true;
  }
}
