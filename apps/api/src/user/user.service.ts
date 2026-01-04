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

    // Get customer email from Stripe
    const customer = (await this.stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    const email = customer.email ?? '';

    const authUser = await this.createAuthUser(email);
    if (!authUser) {
      console.error('Failed to create auth user');
      return;
    }

    const appUser = await this.createAppUser(email, authUser.id);

    if (!appUser) {
      console.error('Failed to create app user');
      return;
    }

    const subscriptionRecord = await this.createSubscription({
      stripeCustomerId,
      stripeSubscriptionId,
      billingEmail: email,
      ownerUserId: authUser.id,
      totalSeats,
    });

    if (!subscriptionRecord) {
      console.error('Failed to create subscription record');
      return;
    }

    await this.incrementSeatsInUse(subscriptionRecord.id);
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

  // ============ SUBSCRIPTION METHODS ============

  async createSubscription(
    params: CreateSubscriptionParams,
  ): Promise<{ id: string } | null> {
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

  async createAuthUser(email: string) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
    });

    if (error) {
      console.error('Error creating auth user:', error);
      return null;
    }

    return data.user;
  }

  async createAppUser(email: string, userId: string, name?: string) {
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
