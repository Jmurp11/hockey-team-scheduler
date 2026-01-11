import { Module } from '@nestjs/common';
import { DeveloperPortalController } from './developer-portal.controller';
import { DeveloperPortalService } from './developer-portal.service';
import { DeveloperAuthGuard } from './developer-auth.guard';
import { DeveloperApiGuard } from './developer-api.guard';
import { EmailModule } from '../email/email.module';

/**
 * Developer Portal Module
 *
 * Provides functionality for external API developers to:
 * - Sign up and pay via Stripe
 * - Manage their API keys
 * - View usage statistics
 * - Cancel their subscription
 *
 * IMPORTANT: This module uses a custom authentication system,
 * NOT Supabase Auth. API users are stored in the api_users table
 * and authenticate via magic link emails.
 */
@Module({
  imports: [EmailModule],
  controllers: [DeveloperPortalController],
  providers: [DeveloperPortalService, DeveloperAuthGuard, DeveloperApiGuard],
  exports: [DeveloperPortalService, DeveloperAuthGuard, DeveloperApiGuard],
})
export class DeveloperPortalModule {}
