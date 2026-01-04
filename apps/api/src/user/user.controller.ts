import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import Stripe from 'stripe';

import { UserService } from './user.service';

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

@ApiTags('Users')
@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
}
