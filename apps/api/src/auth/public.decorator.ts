import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as publicly accessible, bypassing
 * {@link SupabaseAuthGuard}. Use for genuinely pre-auth flows such as
 * registration, invitation acceptance, and signature-verified webhooks.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
