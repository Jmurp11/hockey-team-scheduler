import { Module, Global } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { ApiAccessGuard } from './api-access.guard';
import { DeveloperPortalModule } from '../developer-portal/developer-portal.module';

@Global()
@Module({
  imports: [DeveloperPortalModule],
  providers: [SupabaseAuthGuard, ApiAccessGuard],
  exports: [SupabaseAuthGuard, ApiAccessGuard],
})
export class AuthModule {}
