import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { supabase } from '../supabase';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';

interface SignUpInfo {
  email: string;
  password: string;
  name: string;
  association?: string;
  team?: string;
}

interface CreateSubscriptionParams {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  billingEmail: string;
  totalSeats: number;
  ownerUserId?: string;
  associationId?: string;
}

interface RegisterUserParams {
  email: string;
  name?: string;
  association?: number;
  subscriptionId?: string;
}

interface InvitedUserParams {
  email: string;
  name?: string;
  invitationToken: string;
}

type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED';
type MemberRole = 'ADMIN' | 'MANAGER';
type MemberStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REMOVED';

@Injectable()
export class UserService {
  stripe: Stripe;

  constructor(private readonly emailService: EmailService) {
    this.stripe = this.setStripeInstance();
  }

  // ============ STRIPE SETUP ============

  setStripeInstance(): Stripe {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not set in environment variables');
    }
    return new Stripe(stripeSecretKey);
  }

  getStripeInstance(): Stripe {
    if (!this.stripe) {
      this.stripe = this.setStripeInstance();
    }
    return this.stripe;
  }

  async stripeHandler(event) {
    switch (event.type) {
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeCustomerId = subscription.customer as string;
    const stripeSubscriptionId = subscription.id;
    const totalSeats = subscription.items.data[0]?.quantity || 1;

    console.log(
      `[Webhook] Processing subscription.created for customer: ${stripeCustomerId}`,
    );

    // Get customer email from Stripe
    const customer = (await this.stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    const email = customer.email ?? '';

    if (!email) {
      console.error(
        `[Webhook] No email found for Stripe customer: ${stripeCustomerId}`,
      );
      return;
    }

    console.log(`[Webhook] Creating user for email: ${email}`);

    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      console.error(`[Webhook] Failed to create auth user for email: ${email}`);
      return;
    }

    console.log(`[Webhook] Auth user created with ID: ${authUser.id}`);

    const appUser = await this.createAppUser(email, authUser.id);

    if (!appUser) {
      console.error(
        `[Webhook] Failed to create app user for auth user: ${authUser.id}`,
      );
      return;
    }

    console.log(`[Webhook] App user created with ID: ${appUser.id}`);

    const subscriptionRecord = await this.createSubscription({
      stripeCustomerId,
      stripeSubscriptionId,
      billingEmail: email,
      ownerUserId: authUser.id,
      totalSeats,
    });

    if (!subscriptionRecord) {
      console.error(
        `[Webhook] Failed to create subscription record for user: ${authUser.id}`,
      );
      return;
    }

    console.log(
      `[Webhook] Subscription record created with ID: ${subscriptionRecord.id}`,
    );

    await this.incrementSeatsInUse(subscriptionRecord.id);

    console.log(
      `[Webhook] Successfully completed subscription setup for: ${email}`,
    );
  }

  async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscription.id;
    const newTotalSeats = subscription.items.data[0]?.quantity || 1;
    const status = this.mapStripeStatus(subscription.status);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        total_seats: newTotalSeats,
        status,
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  }

  async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling subscription:', error);
    }
  }

  private mapStripeStatus(stripeStatus: string): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'past_due':
        return 'EXPIRED';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      default:
        return 'PENDING';
    }
  }

  // ============ SUBSCRIPTION CHECKOUT ============

  /**
   * Price per seat in cents ($30/seat/year)
   */
  private readonly PRICE_PER_SEAT_CENTS = 3000;

  /**
   * Creates a Stripe Checkout Session for a seat-based subscription.
   * Returns the checkout URL for redirecting the user to Stripe.
   */
  async createSubscriptionCheckoutSession(
    seats: number,
    email: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    if (seats < 1) {
      throw new Error('At least 1 seat is required');
    }

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RinkLink Subscription',
              description: `${seats} seat${seats > 1 ? 's' : ''} - Team scheduling, tournament discovery, and more`,
            },
            unit_amount: this.PRICE_PER_SEAT_CENTS,
            recurring: {
              interval: 'year',
            },
          },
          quantity: seats,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        seats: seats.toString(),
        type: 'subscription',
      },
      customer_email: email,
      subscription_data: {
        metadata: {
          seats: seats.toString(),
        },
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Retrieves a Stripe Checkout Session by ID and creates user if payment successful.
   * Used to verify payment status after redirect.
   * Also ensures user is created (fallback if webhook failed/delayed).
   */
  async getSubscriptionCheckoutSession(sessionId: string): Promise<{
    status: string;
    customerEmail: string | null;
    seats: number | null;
  } | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      });

      const email = session.customer_email;
      const seats = session.metadata?.seats
        ? parseInt(session.metadata.seats, 10)
        : null;

      // If payment successful, ensure user exists (fallback for webhook)
      if (session.payment_status === 'paid' && email) {
        await this.ensureUserExists(email, session);
      }

      return {
        status: session.payment_status,
        customerEmail: email,
        seats,
      };
    } catch (err) {
      console.error('Error retrieving checkout session:', err);
      return null;
    }
  }

  /**
   * Ensures a user exists for the given email after successful payment.
   * Creates auth user, app user, and subscription if they don't exist.
   * This serves as a fallback in case the Stripe webhook failed or was delayed.
   * All operations are idempotent and safe to call multiple times.
   */
  private async ensureUserExists(
    email: string,
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    console.log(`[EnsureUser] Ensuring user setup complete for: ${email}`);

    // Step 1: Ensure auth user exists (idempotent)
    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      console.error(`[EnsureUser] Failed to get/create auth user for: ${email}`);
      return;
    }
    console.log(`[EnsureUser] Auth user ready: ${authUser.id}`);

    // Step 2: Ensure app user exists (idempotent)
    const appUser = await this.createAppUser(email, authUser.id);
    if (!appUser) {
      console.error(`[EnsureUser] Failed to get/create app user for: ${authUser.id}`);
      return;
    }
    console.log(`[EnsureUser] App user ready: ${appUser.id}`);

    // Step 3: Ensure subscription exists (idempotent)
    const subscription = session.subscription as Stripe.Subscription | null;
    const stripeCustomerId = session.customer as string;
    const seats = session.metadata?.seats
      ? parseInt(session.metadata.seats, 10)
      : 1;

    if (subscription && stripeCustomerId) {
      // Check if subscription already exists and has seats counted
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id, seats_in_use')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (existingSub) {
        console.log(`[EnsureUser] Subscription already exists: ${existingSub.id}, seats_in_use: ${existingSub.seats_in_use}`);
        // Subscription exists, user setup is complete
      } else {
        // Create subscription (idempotent, will return existing if race condition)
        const subscriptionRecord = await this.createSubscription({
          stripeCustomerId,
          stripeSubscriptionId: subscription.id,
          billingEmail: email,
          ownerUserId: authUser.id,
          totalSeats: seats,
        });

        if (subscriptionRecord) {
          console.log(`[EnsureUser] Subscription ready: ${subscriptionRecord.id}`);
          // Only increment seats if we just created the subscription (seats_in_use would be 0)
          const { data: subCheck } = await supabase
            .from('subscriptions')
            .select('seats_in_use')
            .eq('id', subscriptionRecord.id)
            .single();

          if (subCheck && subCheck.seats_in_use === 0) {
            await this.incrementSeatsInUse(subscriptionRecord.id);
            console.log(`[EnsureUser] Incremented seats for owner`);
          }
        }
      }
    }

    console.log(`[EnsureUser] User setup complete for: ${email}`);
  }

  // ============ SUBSCRIPTION METHODS ============

  /**
   * Creates or retrieves a subscription by Stripe subscription ID.
   * If the subscription already exists, returns the existing subscription (idempotent).
   * @param params - The subscription parameters
   * @returns The subscription ID or null if creation/retrieval failed
   */
  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<{ id: string } | null> {
    // First check if subscription already exists
    const { data: existingSub, error: checkError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', params.stripeSubscriptionId)
      .single();

    if (existingSub && !checkError) {
      console.log(`[Subscription] Subscription already exists: ${existingSub.id}`);
      return existingSub;
    }

    // Create new subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        stripe_customer_id: params.stripeCustomerId,
        stripe_subscription_id: params.stripeSubscriptionId,
        billing_email: params.billingEmail,
        total_seats: params.totalSeats,
        seats_in_use: 0,
        status: 'ACTIVE',
        owner_user_id: params.ownerUserId || null,
        association: params.associationId || null,
      })
      .select('id')
      .single();

    if (error) {
      // Handle race condition
      if (error.code === '23505') {
        console.log(`[Subscription] Subscription was created by another process`);
        const { data: createdSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', params.stripeSubscriptionId)
          .single();
        if (createdSub) {
          return createdSub;
        }
      }

      console.error('Error creating subscription:', error);
      return null;
    }

    return data;
  }

  async linkSubscriptionToUser(subscriptionId: string, userId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ owner_user_id: userId })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error linking subscription to user:', error);
    }
  }

  async linkSubscriptionToAssociation(
    subscriptionId: string,
    associationId: string,
  ) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ association: associationId })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error linking subscription to association:', error);
    }
  }

  async incrementSeatsInUse(subscriptionId: string): Promise<boolean> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('seats_in_use, total_seats')
      .eq('id', subscriptionId)
      .single();

    if (
      !subscription ||
      subscription.seats_in_use >= subscription.total_seats
    ) {
      console.error('No seats available');
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ seats_in_use: subscription.seats_in_use + 1 })
      .eq('id', subscriptionId)
      .eq('seats_in_use', subscription.seats_in_use); // Optimistic lock

    return !error;
  }

  async decrementSeatsInUse(subscriptionId: string): Promise<boolean> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('seats_in_use')
      .eq('id', subscriptionId)
      .single();

    if (!subscription || subscription.seats_in_use <= 0) {
      return false;
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({ seats_in_use: subscription.seats_in_use - 1 })
      .eq('id', subscriptionId);

    return !error;
  }

  async getSubscriptionByUser(userId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('owner_user_id', userId)
      .eq('status', 'ACTIVE')
      .single();

    if (error) return null;
    return data;
  }

  async getSubscriptionByAssociation(associationId: string) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('association', associationId)
      .eq('status', 'ACTIVE')
      .single();

    if (error) return null;
    return data;
  }

  // ============ USER METHODS ============

  /**
   * Creates or retrieves an auth user by email.
   * If the user already exists, returns the existing user (idempotent).
   * @param email - The user's email address
   * @returns The auth user or null if creation/retrieval failed
   */
  async createAuthUser(email: string) {
    // First, check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(u => u.email === email);
      if (existingUser) {
        console.log(`[Auth] User already exists for email: ${email}, id: ${existingUser.id}`);
        return existingUser;
      }
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
    });

    if (error) {
      // Handle race condition - user might have been created between check and create
      if (error.message?.includes('already been registered') || error.code === 'email_exists') {
        console.log(`[Auth] User was created by another process for email: ${email}`);
        // Retry fetching the user
        const { data: retryUsers } = await supabase.auth.admin.listUsers();
        const createdUser = retryUsers?.users?.find(u => u.email === email);
        if (createdUser) {
          return createdUser;
        }
      }

      console.error('Error creating auth user:', {
        message: error.message,
        status: error.status,
        code: error.code,
        email,
      });
      return null;
    }

    return data.user;
  }

  /**
   * Creates or retrieves an app user by email/userId.
   * If the user already exists, returns the existing user (idempotent).
   * @param email - The user's email address
   * @param userId - The auth user ID
   * @param name - Optional user name
   * @returns The app user or null if creation/retrieval failed
   */
  async createAppUser(email: string, userId: string, name?: string) {
    // First check if app user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingUser && !checkError) {
      console.log(`[AppUser] User already exists for userId: ${userId}`);
      return existingUser;
    }

    // Also check by email in case user_id mismatch (edge case)
    if (checkError?.code === 'PGRST116') {
      const { data: existingByEmail } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingByEmail) {
        console.log(`[AppUser] User already exists for email: ${email}`);
        return existingByEmail;
      }
    }

    // Create new app user
    const { data, error } = await supabase
      .from('app_users')
      .insert({
        user_id: userId,
        email,
        name: name || null,
      })
      .select()
      .single();

    if (error) {
      // Handle race condition - app user might have been created between check and create
      if (error.code === '23505') {
        // Unique constraint violation
        console.log(`[AppUser] User was created by another process for email: ${email}`);
        const { data: createdUser } = await supabase
          .from('app_users')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (createdUser) {
          return createdUser;
        }
      }

      console.error('Error creating app user:', error);
      return null;
    }

    return data;
  }

  /**
   * Register a new user (org-first or user-first flow)
   * Called after successful Stripe payment
   */
  async registerUser(params: RegisterUserParams) {
    const { email, name, association, subscriptionId } = params;

    // 1. Create auth user
    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      throw new Error('Failed to create auth user');
    }

    // 2. Create app user
    const appUser = await this.createAppUser(email, authUser.id, name);
    if (!appUser) {
      throw new Error('Failed to create app user');
    }

    // 3. If subscription provided, link to user
    if (subscriptionId) {
      await this.linkSubscriptionToUser(subscriptionId, authUser.id);
      await this.incrementSeatsInUse(subscriptionId);
    }

    return { userId: authUser.id, appUser };
  }

  /**
   * Register an invited user (no payment required)
   */
  async registerInvitedUser(params: InvitedUserParams) {
    const { email, name, invitationToken } = params;

    // 1. Validate invitation
    const invitation = await this.validateInvitation(invitationToken);
    if (!invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // 2. Create auth user
    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      throw new Error('Failed to create auth user');
    }

    // 3. Create app user
    const appUser = await this.createAppUser(email, authUser.id, name);
    if (!appUser) {
      throw new Error('Failed to create app user');
    }

    // 4. Create association membership
    if (invitation.association) {
      await this.createAssociationMember(
        authUser.id,
        invitation.association,
        invitation.role || 'MANAGER',
        'ACTIVE',
      );
    }

    // 5. Mark invitation as accepted
    await this.acceptInvitation(invitation.id);

    return { userId: authUser.id, appUser };
  }

  // ============ ASSOCIATION METHODS ============

  async createAssociationMember(
    userId: string,
    associationId: string,
    role: MemberRole,
    status: MemberStatus,
  ) {
    const { data, error } = await supabase
      .from('association_members')
      .insert({
        user_id: userId,
        association: associationId,
        role,
        status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating association member:', error);
      return null;
    }

    return data;
  }

  // ============ INVITATION METHODS ============

  async createInvitation(
    subscriptionId: string,
    associationId: string,
    email: string,
    role: MemberRole = 'MANAGER',
    createdByUserId?: string,
    inviterName?: string,
  ) {
    // Check seat availability
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('seats_in_use, total_seats')
      .eq('id', subscriptionId)
      .single();

    if (
      !subscription ||
      subscription.seats_in_use >= subscription.total_seats
    ) {
      throw new Error('No seats available for invitation');
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const tokenHash = await this.hashToken(token);

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        subscription_id: subscriptionId,
        association: associationId,
        invited_email: email,
        token_hash: tokenHash,
        role,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        created_by_user_id: createdByUserId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      throw new Error('Failed to create invitation');
    }

    // Reserve seat
    await this.incrementSeatsInUse(subscriptionId);

    // Get association name for the email
    const { data: association } = await supabase
      .from('associations')
      .select('id, name')
      .eq('id', associationId)
      .single();

    // 2. Create auth user
    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      throw new Error('Failed to create auth user');
    }

    // 3. Create app user
    const appUser = await this.createAppUser(
      email,
      authUser.id,
      association?.id,
    );
    if (!appUser) {
      throw new Error('Failed to create app user');
    }

    // Send invitation email
    const emailSent = await this.emailService.sendInvitationEmail({
      to: email,
      invitationToken: token,
      associationName: association?.name || 'your organization',
      inviterName,
      role,
    });

    return { invitation: data, emailSent };
  }

  async validateInvitation(token: string) {
    const tokenHash = await this.hashToken(token);

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  async acceptInvitation(invitationId: string) {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'ACCEPTED' })
      .eq('id', invitationId);

    if (error) {
      console.error('Error accepting invitation:', error);
    }
  }

  /**
   * Accept an invitation by token - called when user clicks invite link
   * Creates association membership and returns email for magic link redirect
   */
  async acceptInvitationByToken(token: string) {
    // 1. Validate the invitation
    const invitation = await this.validateInvitation(token);
    if (!invitation) {
      return null;
    }

    console.log({invitation});
    // 2. Get the user that was created during invitation
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, email, user_id')
      .eq('email', invitation.invited_email)
      .single();

    if (!appUser) {
      console.error(
        'App user not found for invitation email:',
        invitation.invited_email,
      );
      return null;
    }

    // 3. Create association membership (if not already exists)
    const { data: existingMembership } = await supabase
      .from('association_members')
      .select('id')
      .eq('user_id', appUser.user_id)
      .eq('association', invitation.association)
      .single();

    if (!existingMembership) {
      await this.createAssociationMember(
        appUser.user_id,
        invitation.association,
        invitation.role || 'MANAGER',
        'ACTIVE',
      );
    }

    // 4. Mark invitation as accepted
    await this.acceptInvitation(invitation.id);

    // 5. Get association name for the response
    const { data: association } = await supabase
      .from('associations')
      .select('id, name')
      .eq('id', invitation.association)
      .single();

    return {
      email: invitation.email,
      associationId: invitation.association,
      associationName: association?.name || null,
    };
  }

  async cancelInvitation(invitationId: string) {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('subscription_id, status')
      .eq('id', invitationId)
      .single();

    if (!invitation || invitation.status !== 'pending') {
      return;
    }

    // Release the reserved seat
    await this.decrementSeatsInUse(invitation.subscription_id);

    await supabase
      .from('invitations')
      .update({ status: 'canceled' })
      .eq('id', invitationId);
  }

  async resendInvitation(invitationId: string) {
    // Get the invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      throw new Error('Invitation not found');
    }

    // Generate new token and extend expiration
    const token = randomBytes(32).toString('hex');
    const tokenHash = await this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update invitation with new token and expiration
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .eq('id', invitationId);

    if (updateError) {
      throw new Error('Failed to update invitation');
    }

    // Get association name for the email
    const { data: association } = await supabase
      .from('associations')
      .select('name')
      .eq('id', invitation.association)
      .single();

    // Send new invitation email
    const emailSent = await this.emailService.sendInvitationEmail({
      to: invitation.email,
      invitationToken: token,
      associationName: association?.name || 'your organization',
      role: invitation.role,
    });

    return { success: emailSent };
  }

  async removeMember(memberId: string) {
    // Get the member to find their subscription
    const { data: member, error } = await supabase
      .from('association_members')
      .select('id, user_id, association, role, status')
      .eq('id', memberId)
      .single();

    if (error || !member) {
      throw new Error('Member not found');
    }

    // Don't allow removing ADMIN users
    if (member.role === 'ADMIN') {
      throw new Error('Cannot remove admin users');
    }

    // Get the subscription for this association to decrement seats
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('association', member.association)
      .eq('status', 'ACTIVE')
      .single();

    // Update member status to REMOVED
    const { error: updateError } = await supabase
      .from('association_members')
      .update({ status: 'REMOVED' })
      .eq('id', memberId);

    if (updateError) {
      throw new Error('Failed to remove member');
    }

    // Decrement seats in use if subscription exists
    if (subscription) {
      await this.decrementSeatsInUse(subscription.id);
    }
  }

  async updateMemberRole(memberId: string, role: 'ADMIN' | 'MANAGER') {
    // Update member role and return the updated record in a single call
    const { data: updatedMember, error } = await supabase
      .from('association_members')
      .update({ role })
      .eq('id', memberId)
      .select('id, user_id, association, role, status')
      .single();

    if (error || !updatedMember) {
      throw new Error(error?.code === 'PGRST116' ? 'Member not found' : 'Failed to update member role');
    }

    return updatedMember;
  }

  private async hashToken(token: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // ============ ACCESS CHECK METHODS ============

  async userHasAccess(userId: string): Promise<boolean | null> {
    // Check 1: User owns an active subscription
    const ownedSub = await this.getSubscriptionByUser(userId);
    if (ownedSub) return true;

    const { data: membershipsWithSubscription } = await supabase
      .from('association_members')
      .select(
        `
        association,
        status,
        subscriptions!inner(status)
      `,
      )
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .eq('subscriptions.status', 'ACTIVE');

    return (
      membershipsWithSubscription && membershipsWithSubscription.length > 0
    );
  }
}
