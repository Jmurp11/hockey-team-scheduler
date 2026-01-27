import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import Stripe from 'stripe';

import { UserService } from './user.service';
import { UserAccessService } from './user-access.service';

// ============ DTOs ============

class RegisterUserDto {
  email: string;
  name?: string;
  association?: number;
  subscriptionId?: string;
}

class RegisterInvitedUserDto {
  email: string;
  name?: string;
  association: string;
  team: string;
  password: string;
  invitationToken: string;
}

class CreateInvitationDto {
  subscriptionId: string;
  associationId: string;
  email: string;
  role?: 'ADMIN' | 'MANAGER';
  inviter_user_id?: string;
}

class UpdateMemberRoleDto {
  role: 'ADMIN' | 'MANAGER';
}

class ValidateInvitationDto {
  token: string;
}

class AcceptInvitationDto {
  token: string;
}

class CreateAssociationDto {
  name: string;
  subscriptionId?: string;
}

/**
 * DTO for completing user registration after subscription/invite.
 * This is the primary registration completion workflow.
 */
class CompleteRegistrationDto {
  userId: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  associationId: number;
  teamId: number;
  age?: string;
}

@ApiTags('Users')
@Controller('v1/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userAccessService: UserAccessService,
  ) {}

  // ============ STRIPE WEBHOOK ============

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  async handleStripeWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    const stripe = this.userService.getStripeInstance();

    let event: Stripe.Event;

    const rawBody = req['rawBody'] || req.body;

    try {
      const webhookSecret = process.env.STRIPE_ENDPOINT_SECRET || '';
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

      await this.userService.stripeHandler(event);

      (res as any).status(200).json({ received: true });
    } catch (err: any) {
      console.error('⚠️  Webhook signature verification failed.', err.message);
      (res as any).status(400).json({ error: err.message });
    }
  }

  // ============ USER REGISTRATION ============

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user account. Can optionally create an association if associationName is provided.',
  })
  @ApiBody({ type: RegisterUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async register(@Body() body: RegisterUserDto, @Res() res: Response) {
    try {
      const result = await this.userService.registerUser({
        email: body.email,
        name: body.name,
        association: body.association,
        subscriptionId: body.subscriptionId,
      });

      (res as any).status(201).json({
        message: 'User registered successfully',
        userId: result.userId,
      });
    } catch (error: any) {
      console.error('Error registering user:', error);
      (res as any).status(500).json({
        message: 'Error registering user',
        error: error.message,
      });
    }
  }

  @Post('register/invited')
  @ApiOperation({
    summary: 'Register an invited user',
    description:
      'Creates a new user account for someone who was invited to an association. No payment required.',
  })
  @ApiBody({ type: RegisterInvitedUserDto })
  @ApiResponse({
    status: 201,
    description: 'Invited user registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async registerInvitedUser(
    @Body() body: RegisterInvitedUserDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.registerInvitedUser({
        email: body.email,
        name: body.name,
        invitationToken: body.invitationToken,
      });

      (res as any).status(201).json({
        message: 'User registered successfully',
        userId: result.userId,
      });
    } catch (error: any) {
      console.error('Error registering invited user:', error);

      if (error.message === 'Invalid or expired invitation') {
        (res as any).status(400).json({
          message: error.message,
        });
        return;
      }

      (res as any).status(500).json({
        message: 'Error registering user',
        error: error.message,
      });
    }
  }

  // ============ COMPLETE REGISTRATION ============

  @Post('complete-registration')
  @ApiOperation({
    summary: 'Complete user registration',
    description: `
      Completes user registration after subscription or invitation.
      This is the primary workflow called after the user fills out the registration form.

      Creates/updates:
      1. Updates app_users with profile data (name, phone, association, team)
      2. Updates auth user with password
      3. Creates manager record (idempotent - prevents duplicates)
      4. Creates association_members record if subscription has > 1 seat (idempotent)

      For multi-seat subscriptions:
      - User is assigned ADMIN role in association_members
      - Subscription is linked to the selected association

      All operations are idempotent and safe to retry.
    `,
  })
  @ApiBody({ type: CompleteRegistrationDto })
  @ApiResponse({
    status: 200,
    description: 'Registration completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        isMultiSeat: { type: 'boolean', description: 'Whether the subscription has multiple seats' },
        appUser: { type: 'object', description: 'Updated app_users record' },
        manager: { type: 'object', description: 'Manager record' },
        associationMember: { type: 'object', nullable: true, description: 'Association member record (if multi-seat)' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request or validation error' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async completeRegistration(
    @Body() body: CompleteRegistrationDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.completeRegistration({
        userId: body.userId,
        email: body.email,
        password: body.password,
        name: body.name,
        phone: body.phone,
        associationId: body.associationId,
        teamId: body.teamId,
        age: body.age,
      });

      (res as any).status(200).json({
        success: true,
        message: 'Registration completed successfully',
        isMultiSeat: result.isMultiSeat,
        appUser: result.appUser,
        manager: result.manager,
        associationMember: result.associationMember,
      });
    } catch (error: any) {
      console.error('Error completing registration:', error);

      // Handle specific error types
      if (error.message === 'User not found. Please contact support.') {
        (res as any).status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message === 'Invalid association selected' ||
        error.message === 'Invalid team selected'
      ) {
        (res as any).status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      (res as any).status(500).json({
        success: false,
        message: 'Error completing registration',
        error: error.message,
      });
    }
  }

  // ============ INVITATIONS ============

  @Post('invitations')
  @ApiOperation({
    summary: 'Create an invitation',
    description:
      'Creates an invitation for a user to join an association. Reserves a seat.',
  })
  @ApiBody({ type: CreateInvitationDto })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 400, description: 'No seats available' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async createInvitation(
    @Body() body: CreateInvitationDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.createInvitation(
        body.subscriptionId,
        body.associationId,
        body.email,
        body.role || 'MANAGER',
        body.inviter_user_id, // This is the created_by_user_id
      );

      (res as any).status(201).json({
        message: 'Invitation created successfully',
        invitationId: result.invitation.id,
        emailSent: result.emailSent,
      });
    } catch (error: any) {
      console.error('Error creating invitation:', error);

      if (error.message === 'No seats available for invitation') {
        (res as any).status(400).json({
          message: error.message,
        });
        return;
      }

      (res as any).status(500).json({
        message: 'Error creating invitation',
        error: error.message,
      });
    }
  }

  @Post('invitations/validate')
  @ApiOperation({
    summary: 'Validate an invitation token',
    description: 'Checks if an invitation token is valid and not expired.',
  })
  @ApiBody({ type: ValidateInvitationDto })
  @ApiResponse({ status: 200, description: 'Invitation is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  async validateInvitation(
    @Body() body: ValidateInvitationDto,
    @Res() res: Response,
  ) {
    try {
      const invitation = await this.userService.validateInvitation(body.token);

      if (!invitation) {
        (res as any).status(400).json({
          valid: false,
          message: 'Invalid or expired invitation',
        });
        return;
      }

      (res as any).status(200).json({
        valid: true,
        email: invitation.email,
        role: invitation.role,
        associationId: invitation.association_id,
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error validating invitation',
        error: error.message,
      });
    }
  }

  @Post('invitations/accept')
  @ApiOperation({
    summary: 'Accept an invitation',
    description:
      'Accepts an invitation, creates association membership, and returns email for magic link request. The authUser and appUser were already created when the invitation was sent.',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted - redirect user to magic link page',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  async acceptInvitation(
    @Body() body: AcceptInvitationDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.userService.acceptInvitationByToken(
        body.token,
      );

      if (!result) {
        (res as any).status(400).json({
          success: false,
          message: 'Invalid or expired invitation',
        });
        return;
      }

      (res as any).status(200).json({
        success: true,
        email: result.email,
        associationId: result.associationId,
        associationName: result.associationName,
        message:
          'Invitation accepted. Please request a magic link to complete your profile.',
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error accepting invitation',
        error: error.message,
      });
    }
  }

  @Post('invitations/:id/cancel')
  @ApiOperation({
    summary: 'Cancel an invitation',
    description: 'Cancels a pending invitation and releases the reserved seat.',
  })
  @ApiResponse({ status: 200, description: 'Invitation cancelled' })
  async cancelInvitation(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.userService.cancelInvitation(id);

      (res as any).status(200).json({
        message: 'Invitation cancelled successfully',
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error cancelling invitation',
        error: error.message,
      });
    }
  }

  @Post('invitations/:id/resend')
  @ApiOperation({
    summary: 'Resend an invitation',
    description: 'Resends an invitation email for expired or pending invitations.',
  })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async resendInvitation(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.userService.resendInvitation(id);

      (res as any).status(200).json({
        success: result.success,
        message: result.success
          ? 'Invitation resent successfully'
          : 'Failed to resend invitation',
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error resending invitation',
        error: error.message,
      });
    }
  }

  // ============ MEMBER MANAGEMENT ============

  @Delete('members/:id')
  @ApiOperation({
    summary: 'Remove a member',
    description: 'Removes a member from an association and releases their seat.',
  })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async removeMember(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.userService.removeMember(id);

      (res as any).status(200).json({
        message: 'Member removed successfully',
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error removing member',
        error: error.message,
      });
    }
  }

  @Patch('members/:id/role')
  @ApiOperation({
    summary: 'Update member role',
    description: 'Updates the role of a member in an association (ADMIN or MANAGER).',
  })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  async updateMemberRole(
    @Param('id') id: string,
    @Body() body: UpdateMemberRoleDto,
    @Res() res: Response,
  ) {
    try {
      const updatedMember = await this.userService.updateMemberRole(id, body.role);

      (res as any).status(200).json({
        message: 'Member role updated successfully',
        member: updatedMember,
      });
    } catch (error: any) {
      const statusCode = error.message === 'Member not found' ? 404 : 500;
      (res as any).status(statusCode).json({
        message: 'Error updating member role',
        error: error.message,
      });
    }
  }

  // ============ ACCESS CHECK ============

  @Get('access/:userId')
  @ApiOperation({
    summary: 'Check user access',
    description:
      'Checks if a user has access based on subscription or association membership.',
  })
  @ApiResponse({ status: 200, description: 'Access check result' })
  async checkAccess(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const hasAccess = await this.userService.userHasAccess(userId);

      (res as any).status(200).json({
        hasAccess,
      });
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error checking access',
        error: error.message,
      });
    }
  }

  // ============ SUBSCRIPTIONS ============

  @Get('subscriptions/user/:userId')
  @ApiOperation({
    summary: 'Get user subscription',
    description: 'Gets the active subscription owned by a user.',
  })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  async getUserSubscription(
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    try {
      const subscription = await this.userService.getSubscriptionByUser(userId);

      if (!subscription) {
        (res as any).status(404).json({
          message: 'No active subscription found',
        });
        return;
      }

      (res as any).status(200).json(subscription);
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error fetching subscription',
        error: error.message,
      });
    }
  }

  @Get('subscriptions/association/:associationId')
  @ApiOperation({
    summary: 'Get association subscription',
    description: 'Gets the active subscription for an association.',
  })
  @ApiResponse({ status: 200, description: 'Subscription details' })
  @ApiResponse({ status: 404, description: 'No subscription found' })
  async getAssociationSubscription(
    @Param('associationId') associationId: string,
    @Res() res: Response,
  ) {
    try {
      const subscription =
        await this.userService.getSubscriptionByAssociation(associationId);

      if (!subscription) {
        (res as any).status(404).json({
          message: 'No active subscription found',
        });
        return;
      }

      (res as any).status(200).json(subscription);
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error fetching subscription',
        error: error.message,
      });
    }
  }

  // ============ SUBSCRIPTION CHECKOUT ============

  @Post('subscriptions/checkout')
  @ApiOperation({
    summary: 'Create subscription checkout session',
    description:
      'Creates a Stripe Checkout Session for a subscription plan and returns the URL for redirect.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        seats: { type: 'number', minimum: 1 },
        email: { type: 'string', format: 'email' },
        successUrl: { type: 'string' },
        cancelUrl: { type: 'string' },
      },
      required: ['seats', 'email', 'successUrl', 'cancelUrl'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created successfully',
    schema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid seats or missing parameters' })
  @ApiResponse({ status: 500, description: 'Server error' })
  async createSubscriptionCheckout(
    @Body()
    body: {
      seats: number;
      email: string;
      successUrl: string;
      cancelUrl: string;
    },
    @Res() res: Response,
  ) {
    try {
      const { seats, email, successUrl, cancelUrl } = body;

      if (!seats || !email || !successUrl || !cancelUrl) {
        (res as any).status(400).json({
          message: 'Missing required parameters: seats, email, successUrl, cancelUrl',
        });
        return;
      }

      if (seats < 1) {
        (res as any).status(400).json({
          message: 'At least 1 seat is required',
        });
        return;
      }

      const result = await this.userService.createSubscriptionCheckoutSession(
        seats,
        email,
        successUrl,
        cancelUrl,
      );

      (res as any).status(201).json(result);
    } catch (error: any) {
      console.error('Error creating subscription checkout:', error);
      (res as any).status(500).json({
        message: 'Error creating checkout session',
        error: error.message,
      });
    }
  }

  @Get('subscriptions/checkout/:sessionId')
  @ApiOperation({
    summary: 'Get checkout session status',
    description: 'Retrieves the status of a Stripe Checkout Session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Session status retrieved',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        customerEmail: { type: 'string' },
        plan: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getCheckoutSessionStatus(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    try {
      const session =
        await this.userService.getSubscriptionCheckoutSession(sessionId);

      if (!session) {
        (res as any).status(404).json({
          message: 'Session not found',
        });
        return;
      }

      (res as any).status(200).json(session);
    } catch (error: any) {
      (res as any).status(500).json({
        message: 'Error retrieving session status',
        error: error.message,
      });
    }
  }

  // ============ USER ACCESS (Unified Auth) ============

  @Get('me/access')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user access info',
    description: `
      Returns comprehensive access information for the authenticated user.
      Used for post-login routing and determining UI state.

      User types:
      - app_only: User has app access only (redirect to /app)
      - api_only: User has developer portal access only (redirect to /developer)
      - both: User has both app and developer access (redirect to /app, show developer in sidenav)
      - none: User exists in auth but has no access (redirect to login or onboarding)

      Requires a valid Supabase Auth JWT in the Authorization header.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'User access information',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        access: {
          type: 'object',
          properties: {
            authUserId: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            isAppUser: { type: 'boolean' },
            isApiUser: { type: 'boolean' },
            userType: { type: 'string', enum: ['app_only', 'api_only', 'both', 'none'] },
            defaultRedirect: { type: 'string' },
            appUserId: { type: 'number', nullable: true },
            apiUserId: { type: 'number', nullable: true },
            isAppProfileComplete: { type: 'boolean', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or missing auth token' })
  async getCurrentUserAccess(
    @Headers('authorization') authHeader: string,
    @Res() res: Response,
  ) {
    try {
      // Extract token from Authorization header
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        (res as any).status(401).json({
          success: false,
          message: 'Missing authorization token',
        });
        return;
      }

      // Validate token and get user ID
      const authUserId = await this.userAccessService.validateSupabaseToken(token);

      if (!authUserId) {
        (res as any).status(401).json({
          success: false,
          message: 'Invalid or expired token',
        });
        return;
      }

      // Get user access info
      const access = await this.userAccessService.getUserAccess(authUserId);

      (res as any).status(200).json({
        success: true,
        access,
      });
    } catch (error: any) {
      console.error('Error getting user access:', error);
      (res as any).status(500).json({
        success: false,
        message: 'Error retrieving user access',
        error: error.message,
      });
    }
  }

  @Get('user-access/:authUserId')
  @ApiOperation({
    summary: 'Get user access info by auth user ID',
    description: 'Returns access information for a specific user. Requires service role access.',
  })
  @ApiResponse({
    status: 200,
    description: 'User access information',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserAccessById(
    @Param('authUserId') authUserId: string,
    @Res() res: Response,
  ) {
    try {
      const access = await this.userAccessService.getUserAccess(authUserId);

      (res as any).status(200).json({
        success: true,
        access,
      });
    } catch (error: any) {
      console.error('Error getting user access:', error);

      if (error.message === 'User not found') {
        (res as any).status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      (res as any).status(500).json({
        success: false,
        message: 'Error retrieving user access',
        error: error.message,
      });
    }
  }
}
