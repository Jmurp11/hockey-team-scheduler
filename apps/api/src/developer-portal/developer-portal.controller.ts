import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { DeveloperPortalService } from './developer-portal.service';
import { DeveloperAuthGuard } from './developer-auth.guard';
import { ApiUser } from './developer-portal.types';

// ============ DTOs ============

class CreateCheckoutDto {
  email: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Developer Portal Controller
 *
 * Provides REST endpoints for the Developer Portal:
 * - Public: Checkout
 * - Protected: Dashboard, API key rotation, subscription management
 *
 * AUTHENTICATION:
 * - Public endpoints: No auth required
 * - Protected endpoints: Bearer token (Supabase Auth)
 * - Webhook: Stripe signature verification
 */
@ApiTags('Developer Portal')
@Controller('v1/developers')
export class DeveloperPortalController {
  constructor(private readonly developerPortalService: DeveloperPortalService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Creates a Stripe Checkout session for developer API access.
   */
  @Post('checkout')
  @ApiOperation({
    summary: 'Create checkout session',
    description: 'Creates a Stripe Checkout session for developer API subscription. Usage-based pricing at $0.05 per request.',
  })
  @ApiBody({ type: CreateCheckoutDto })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or existing subscription' })
  async createCheckout(
    @Body() body: CreateCheckoutDto,
    @Res() res: Response,
  ) {
    try {
      const { email, successUrl, cancelUrl } = body;

      if (!email || !successUrl || !cancelUrl) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          error: 'Missing required fields: email, successUrl, cancelUrl',
        });
      }

      const result = await this.developerPortalService.createCheckoutSession(
        email,
        successUrl,
        cancelUrl,
      );

      return res.status(HttpStatus.CREATED).json(result);
    } catch (error: any) {
      console.error('Checkout error:', error);
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: error.message || 'Failed to create checkout session',
      });
    }
  }

  /**
   * Gets the status of a checkout session.
   */
  @Get('checkout/:sessionId')
  @ApiOperation({
    summary: 'Get checkout status',
    description: 'Retrieves the payment status of a Stripe Checkout session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout session status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        customerEmail: { type: 'string' },
        customerId: { type: 'string' },
      },
    },
  })
  async getCheckoutStatus(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      const status = await this.developerPortalService.getCheckoutStatus(sessionId);
      return res.status(HttpStatus.OK).json(status);
    } catch (error: any) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: 'Session not found',
      });
    }
  }

  // ============ STRIPE WEBHOOK ============

  /**
   * Handles Stripe webhook events for developer subscriptions.
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook handler',
    description: 'Handles Stripe webhook events for subscription lifecycle management.',
  })
  @ApiHeader({ name: 'stripe-signature', required: true })
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    const webhookSecret = process.env.DEVELOPER_STRIPE_WEBHOOK_SECRET || process.env.STRIPE_ENDPOINT_SECRET || '';

    let event: Stripe.Event;

    try {
      const rawBody = (req as any).rawBody || req.body;
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(HttpStatus.BAD_REQUEST).json({ error: err.message });
    }

    try {
      await this.developerPortalService.handleStripeWebhook(event);
      return res.status(HttpStatus.OK).json({ received: true });
    } catch (error: any) {
      console.error('Webhook handler error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Webhook processing failed',
      });
    }
  }

  // ============ PROTECTED ENDPOINTS ============

  /**
   * Gets the developer dashboard data.
   */
  @Get('dashboard')
  @UseGuards(DeveloperAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get dashboard',
    description: 'Retrieves developer dashboard data including API key info, usage stats, and subscription status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const apiUser = (req as any).developerUser as ApiUser;
      const dashboard = await this.developerPortalService.getDashboard(apiUser.id);
      return res.status(HttpStatus.OK).json(dashboard);
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Failed to fetch dashboard',
      });
    }
  }

  /**
   * Rotates the API key.
   */
  @Post('api-key/rotate')
  @UseGuards(DeveloperAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Rotate API key',
    description: 'Generates a new API key and invalidates the old one. The new key is shown only once.',
  })
  @ApiResponse({
    status: 200,
    description: 'New API key',
    schema: {
      type: 'object',
      properties: {
        apiKey: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Subscription not active' })
  async rotateApiKey(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const apiUser = (req as any).developerUser as ApiUser;
      const result = await this.developerPortalService.rotateApiKey(apiUser.id);

      return res.status(HttpStatus.OK).json({
        apiKey: result.apiKey,
        message: 'API key rotated successfully. This is the only time the full key will be shown.',
      });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        error: error.message || 'Failed to rotate API key',
      });
    }
  }

  /**
   * Cancels the subscription.
   */
  @Post('subscription/cancel')
  @UseGuards(DeveloperAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel subscription',
    description: 'Cancels the developer subscription at the end of the current billing period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription canceled',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cancelsAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async cancelSubscription(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const apiUser = (req as any).developerUser as ApiUser;
      const result = await this.developerPortalService.cancelSubscription(apiUser.id);
      return res.status(HttpStatus.OK).json(result);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        error: error.message || 'Failed to cancel subscription',
      });
    }
  }

  /**
   * Gets subscription status.
   */
  @Get('subscription/status')
  @UseGuards(DeveloperAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get subscription status',
    description: 'Retrieves the current subscription status from Stripe.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'past_due', 'canceled', 'unpaid', 'incomplete'] },
      },
    },
  })
  async getSubscriptionStatus(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const apiUser = (req as any).developerUser as ApiUser;
      const status = await this.developerPortalService.getSubscriptionStatus(apiUser.id);
      return res.status(HttpStatus.OK).json({ status });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Failed to get subscription status',
      });
    }
  }
}
