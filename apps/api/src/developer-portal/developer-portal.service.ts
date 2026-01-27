import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
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
 * - API key generation, rotation, and validation
 * - Usage tracking and billing enforcement
 *
 * AUTHENTICATION:
 * Uses Supabase Auth for all user authentication.
 * Users log in via the unified login flow and are linked to api_users
 * records for developer access.
 *
 * BILLING MODEL:
 * Pay-per-request at $0.05 per API call. Usage is tracked in the database
 * and can be reported to Stripe for metered billing.
 *
 * Security considerations:
 * - API keys are hashed for storage (prefix stored for display)
 * - All sensitive operations require active subscription
 * - Supabase JWT tokens handle session expiry
 */
@Injectable()
export class DeveloperPortalService {
  private stripe: Stripe;
  private readonly PRICE_PER_REQUEST = 0.05; // $0.05 per request

  // Stripe Product ID for Developer API access
  private readonly STRIPE_PRODUCT_ID = 'prod_TlJK71isy9QShT';

  constructor(private readonly emailService: EmailService) {
    this.stripe = this.initStripe();
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

  // ============ SUPABASE AUTH INTEGRATION ============

  /**
   * Gets an API user by Supabase Auth user ID.
   * Used for unified auth where users log in via Supabase.
   *
   * First checks by auth_user_id, then falls back to email lookup
   * for legacy api_users that haven't been linked yet.
   *
   * @param authUserId - The Supabase Auth user ID (UUID)
   * @param email - The user's email (used for fallback lookup)
   */
  async getApiUserByAuthId(authUserId: string, email: string): Promise<ApiUser | null> {
    // First try by auth_user_id
    const { data: byAuthId, error: authIdError } = await supabase
      .from('api_users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .single();

    if (byAuthId && !authIdError) {
      return byAuthId as ApiUser;
    }

    // Fallback: Check by email for unlinked api_users
    if (email) {
      const { data: byEmail, error: emailError } = await supabase
        .from('api_users')
        .select('*')
        .eq('email', email)
        .is('auth_user_id', null)
        .eq('is_active', true)
        .single();

      if (byEmail && !emailError) {
        // Link this api_user to the Supabase auth user
        await supabase
          .from('api_users')
          .update({ auth_user_id: authUserId })
          .eq('id', byEmail.id);

        console.log(`[DeveloperPortal] Linked api_user ${byEmail.id} to auth_user ${authUserId}`);

        return { ...byEmail, auth_user_id: authUserId } as ApiUser;
      }
    }

    return null;
  }

  /**
   * Creates an API user for an existing Supabase Auth user.
   * Used when an app user signs up for developer API access.
   *
   * @param authUserId - The Supabase Auth user ID
   * @param email - The user's email
   */
  async createApiUserForAuthUser(
    authUserId: string,
    email: string,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string,
  ): Promise<ApiUser> {
    // Check if already exists
    const existing = await this.getApiUserByAuthId(authUserId, email);
    if (existing) {
      return existing;
    }

    // Generate API key
    const apiKey = await this.generateApiKey();
    const hashedKey = this.hashApiKey(apiKey);

    // Create api_user linked to auth user
    const { data, error } = await supabase
      .from('api_users')
      .insert({
        auth_user_id: authUserId,
        email,
        api_key: hashedKey,
        api_key_prefix: this.getApiKeyPrefix(apiKey),
        stripe_customer_id: stripeCustomerId || null,
        stripe_subscription_id: stripeSubscriptionId || null,
        is_active: true,
        request_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[DeveloperPortal] Error creating api_user:', error);
      throw new Error('Failed to create API user');
    }

    // Send welcome email with API key
    await this.sendWelcomeEmail(email, apiKey);

    return data as ApiUser;
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
}
