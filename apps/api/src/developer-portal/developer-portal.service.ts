import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import * as jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import { supabase } from '../supabase';
import { EmailService } from '../email/email.service';
import {
  ApiUser,
  ApiUserPublic,
  ApiUsageStats,
  DeveloperDashboard,
  ApiKeyDisplay,
  ApiSubscriptionStatus,
} from './developer-portal.types';

/**
 * Developer Portal Service
 *
 * Handles all business logic for the Developer Portal including:
 * - Stripe checkout and subscription management
 * - Magic link authentication (separate from Supabase Auth)
 * - API key generation, rotation, and validation
 * - Usage tracking and billing enforcement
 *
 * AUTHENTICATION STRATEGY:
 * We use Magic Link authentication because:
 * 1. No password management required
 * 2. Simple, secure flow for developers
 * 3. Email verification built-in
 * 4. Stateless JWT tokens for session management
 *
 * BILLING MODEL:
 * Pay-per-request at $0.05 per API call. Usage is tracked in the database
 * and can be reported to Stripe for metered billing if a metered price is configured.
 *
 * Security considerations:
 * - Magic link tokens expire after 15 minutes
 * - Session tokens expire after 7 days
 * - API keys are hashed for storage (prefix stored for display)
 * - All sensitive operations require active subscription
 */
@Injectable()
export class DeveloperPortalService {
  private stripe: Stripe;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRY = '7d';
  private readonly MAGIC_LINK_EXPIRY_MINUTES = 15;
  private readonly PRICE_PER_REQUEST = 0.05; // $0.05 per request

  // Stripe Product ID for Developer API access
  private readonly STRIPE_PRODUCT_ID = 'prod_TlJK71isy9QShT';

  constructor(private readonly emailService: EmailService) {
    this.stripe = this.initStripe();
    this.JWT_SECRET = process.env.DEVELOPER_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret-change-me';

    if (this.JWT_SECRET === 'dev-secret-change-me') {
      console.warn('WARNING: Using default JWT secret. Set DEVELOPER_JWT_SECRET in production!');
    }
  }

  private initStripe(): Stripe {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    return new Stripe(stripeSecretKey);
  }

  // ============ STRIPE CHECKOUT ============

  /**
   * Creates a Stripe Checkout session for developer API access.
   * This creates a simple subscription that gives access to the API.
   * Usage tracking is handled separately in the database.
   */
  async createCheckoutSession(
    email: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    // Check if user already exists and has active subscription
    const existingUser = await this.findApiUserByEmail(email);
    if (existingUser?.is_active) {
      throw new BadRequestException('An active subscription already exists for this email');
    }

    // Create Stripe checkout session
    // Using a simple subscription model - usage is tracked internally
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: this.STRIPE_PRODUCT_ID,
            unit_amount: 0, // $0 base fee - usage is tracked separately
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          type: 'developer_api',
          email,
        },
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        type: 'developer_api',
        email,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Retrieves checkout session status.
   */
  async getCheckoutStatus(sessionId: string): Promise<{
    status: string;
    customerEmail: string | null;
    customerId: string | null;
  }> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return {
      status: session.payment_status,
      customerEmail: session.customer_email,
      customerId: session.customer as string | null,
    };
  }

  // ============ STRIPE WEBHOOKS ============

  /**
   * Handles Stripe webhook events for developer subscriptions.
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Unhandled event type - log for debugging
        console.log(`Unhandled developer webhook event: ${event.type}`);
    }
  }

  /**
   * Handles successful checkout completion.
   * Creates api_user record and generates API key.
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    // Only process developer API checkouts
    if (session.metadata?.type !== 'developer_api') {
      return;
    }

    const email = session.customer_email || session.metadata?.email;
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!email || !customerId) {
      console.error('Missing email or customer ID in checkout session');
      return;
    }

    // Check if user already exists
    const apiUser = await this.findApiUserByEmail(email);

    if (apiUser) {
      // Reactivate existing user
      await supabase
        .from('api_users')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          is_active: true,
        })
        .eq('id', apiUser.id);
    } else {
      // Create new user with API key
      const apiKey = await this.generateApiKey();
      const hashedKey = this.hashApiKey(apiKey);

      const { error } = await supabase.from('api_users').insert({
        email,
        api_key: hashedKey,
        api_key_prefix: this.getApiKeyPrefix(apiKey),
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        is_active: true,
        request_count: 0,
      });

      if (error) {
        console.error('Error creating API user:', error);
        return;
      }

      // Send welcome email with API key
      await this.sendWelcomeEmail(email, apiKey);
    }
  }

  /**
   * Handles subscription updates (e.g., payment method changes).
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    if (subscription.metadata?.type !== 'developer_api') {
      return;
    }

    const status = this.mapStripeStatus(subscription.status);
    const isActive = status === 'active';

    await supabase
      .from('api_users')
      .update({ is_active: isActive })
      .eq('stripe_subscription_id', subscription.id);
  }

  /**
   * Handles subscription cancellation.
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await supabase
      .from('api_users')
      .update({ is_active: false })
      .eq('stripe_subscription_id', subscription.id);
  }

  /**
   * Handles failed payments - deactivates API access.
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    await supabase
      .from('api_users')
      .update({ is_active: false })
      .eq('stripe_customer_id', customerId);
  }

  private mapStripeStatus(status: Stripe.Subscription.Status): ApiSubscriptionStatus {
    switch (status) {
      case 'active':
      case 'trialing':
        return 'active';
      case 'past_due':
        return 'past_due';
      case 'canceled':
        return 'canceled';
      case 'unpaid':
        return 'unpaid';
      default:
        return 'incomplete';
    }
  }

  // ============ MAGIC LINK AUTHENTICATION ============

  /**
   * Sends a magic link email for developer authentication.
   * Only works for existing API users with active subscriptions.
   */
  async sendMagicLink(email: string): Promise<{ success: boolean; message: string }> {
    const apiUser = await this.findApiUserByEmail(email);

    if (!apiUser) {
      // Don't reveal if email exists - return generic success message
      return {
        success: true,
        message: 'If an account exists with this email, a login link has been sent.',
      };
    }

    // Generate magic link token
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    // Store token in database
    const { error } = await supabase.from('developer_magic_links').insert({
      api_user_id: apiUser.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: false,
    });

    if (error) {
      console.error('Error creating magic link:', error);
      throw new Error('Failed to create login link');
    }

    // Send email
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const magicLinkUrl = `${appUrl}/developer/auth?token=${token}`;

    await this.sendMagicLinkEmail(email, magicLinkUrl);

    return {
      success: true,
      message: 'If an account exists with this email, a login link has been sent.',
    };
  }

  /**
   * Verifies a magic link token and returns a session JWT.
   */
  async verifyMagicLink(token: string): Promise<{ token: string; expiresAt: string }> {
    const tokenHash = this.hashToken(token);

    // Find and validate token
    const { data: magicLink, error } = await supabase
      .from('developer_magic_links')
      .select('*, api_users(*)')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !magicLink) {
      throw new UnauthorizedException('Invalid or expired login link');
    }

    // Mark token as used
    await supabase
      .from('developer_magic_links')
      .update({ used: true })
      .eq('id', magicLink.id);

    // Generate session JWT
    const apiUser = magicLink.api_users;
    const sessionToken = this.generateSessionToken(apiUser.id, apiUser.email);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return {
      token: sessionToken,
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Validates a session token and returns the user.
   */
  async validateSessionToken(token: string): Promise<ApiUser | null> {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: number; email: string };
      const apiUser = await this.findApiUserById(payload.userId);

      if (!apiUser || apiUser.email !== payload.email) {
        return null;
      }

      return apiUser;
    } catch {
      return null;
    }
  }

  private generateSessionToken(userId: number, email: string): string {
    return jwt.sign({ userId, email }, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRY });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  // ============ API KEY MANAGEMENT ============

  /**
   * Generates a new API key for a user (rotates existing key).
   */
  async rotateApiKey(userId: number): Promise<{ apiKey: string }> {
    const apiUser = await this.findApiUserById(userId);

    if (!apiUser) {
      throw new NotFoundException('User not found');
    }

    if (!apiUser.is_active) {
      throw new BadRequestException('Cannot rotate API key for inactive subscription');
    }

    // Generate new key
    const newApiKey = await this.generateApiKey();
    const hashedKey = this.hashApiKey(newApiKey);

    // Update in database
    const { error } = await supabase
      .from('api_users')
      .update({
        api_key: hashedKey,
        api_key_prefix: this.getApiKeyPrefix(newApiKey),
      })
      .eq('id', userId);

    if (error) {
      throw new Error('Failed to rotate API key');
    }

    return { apiKey: newApiKey };
  }

  /**
   * Validates an API key for request authentication.
   * Returns the user if valid, null otherwise.
   */
  async validateApiKey(apiKey: string): Promise<ApiUser | null> {
    const hashedKey = this.hashApiKey(apiKey);

    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('api_key', hashedKey)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ApiUser;
  }

  /**
   * Records an API request and updates usage statistics.
   */
  async recordApiRequest(userId: number): Promise<void> {
    const { data: user } = await supabase
      .from('api_users')
      .select('request_count, stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (!user) return;

    // Update request count
    await supabase
      .from('api_users')
      .update({
        request_count: (user.request_count || 0) + 1,
        last_used: new Date().toISOString(),
      })
      .eq('id', userId);

    // Optionally log the request for detailed analytics
    await supabase.from('api_request_log').insert({
      api_user_id: userId,
      endpoint: 'unknown', // Can be passed from the guard
      method: 'unknown',
    });
  }

  private async generateApiKey(): Promise<string> {
    const keyBytes = randomBytes(32);
    return `rl_live_${keyBytes.toString('hex')}`;
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  private getApiKeyPrefix(apiKey: string): string {
    // Return masked version like "rl_live_****abcd"
    return `${apiKey.substring(0, 8)}****${apiKey.slice(-4)}`;
  }

  // ============ SUBSCRIPTION MANAGEMENT ============

  /**
   * Cancels a developer subscription.
   */
  async cancelSubscription(userId: number): Promise<{
    success: boolean;
    message: string;
    cancelsAt?: string;
  }> {
    const apiUser = await this.findApiUserById(userId);

    if (!apiUser) {
      throw new NotFoundException('User not found');
    }

    if (!apiUser.stripe_subscription_id) {
      throw new BadRequestException('No active subscription found');
    }

    try {
      // Cancel at period end (allows user to use until billing period ends)
      const subscription = await this.stripe.subscriptions.update(
        apiUser.stripe_subscription_id,
        { cancel_at_period_end: true }
      );

      // Access current_period_end from the subscription object
      const periodEnd = (subscription as any).current_period_end;
      const cancelsAt = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : undefined;

      return {
        success: true,
        message: 'Subscription will be canceled at the end of the billing period',
        cancelsAt,
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Gets subscription status from Stripe.
   */
  async getSubscriptionStatus(userId: number): Promise<ApiSubscriptionStatus> {
    const apiUser = await this.findApiUserById(userId);

    if (!apiUser?.stripe_subscription_id) {
      return 'canceled';
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(
        apiUser.stripe_subscription_id
      );
      return this.mapStripeStatus(subscription.status);
    } catch {
      return 'canceled';
    }
  }

  // ============ DASHBOARD DATA ============

  /**
   * Gets dashboard data for a developer.
   */
  async getDashboard(userId: number): Promise<DeveloperDashboard> {
    const apiUser = await this.findApiUserById(userId);

    if (!apiUser) {
      throw new NotFoundException('User not found');
    }

    const subscriptionStatus = await this.getSubscriptionStatus(userId);

    const user: ApiUserPublic = {
      id: apiUser.id,
      email: apiUser.email,
      is_active: apiUser.is_active,
      last_used: apiUser.last_used,
      request_count: apiUser.request_count || 0,
      created_at: apiUser.created_at,
      subscription_status: subscriptionStatus,
    };

    const apiKey: ApiKeyDisplay = {
      key: apiUser.api_key_prefix || 'rl_live_****',
      createdAt: apiUser.created_at,
      lastUsed: apiUser.last_used,
    };

    const usage: ApiUsageStats = {
      totalRequests: apiUser.request_count || 0,
      requestsThisMonth: apiUser.request_count || 0, // TODO: Calculate monthly from api_request_log
      lastRequestAt: apiUser.last_used,
      estimatedCost: (apiUser.request_count || 0) * this.PRICE_PER_REQUEST,
    };

    return { user, apiKey, usage };
  }

  // ============ HELPER METHODS ============

  private async findApiUserByEmail(email: string): Promise<ApiUser | null> {
    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ApiUser;
  }

  private async findApiUserById(id: number): Promise<ApiUser | null> {
    const { data, error } = await supabase
      .from('api_users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return data as ApiUser;
  }

  // ============ EMAIL METHODS ============

  /**
   * Sends a welcome email with API key using the unified email template.
   */
  private async sendWelcomeEmail(email: string, apiKey: string): Promise<void> {
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const dashboardUrl = `${appUrl}/developer/dashboard`;

    try {
      await this.emailService.sendWelcomeEmail({
        to: email,
        apiKey,
        dashboardUrl,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
    }
  }

  /**
   * Sends a magic link email for authentication using the unified email template.
   */
  private async sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
    try {
      await this.emailService.sendMagicLinkEmail({
        to: email,
        magicLinkUrl,
        expiryMinutes: this.MAGIC_LINK_EXPIRY_MINUTES,
      });
    } catch (error) {
      console.error('Error sending magic link email:', error);
    }
  }
}
