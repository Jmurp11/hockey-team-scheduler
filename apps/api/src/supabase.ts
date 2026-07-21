import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { env } from 'node:process';

const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';

/**
 * Server-side SECRET key. Prefer the new Supabase secret key (sb_secret_...);
 * fall back to the legacy service_role JWT (PUBLIC_SUPABASE_SERVICE_ROLE) only
 * during the key-rotation transition. Both authenticate as the `service_role`
 * Postgres role and bypass RLS, which the API relies on for admin operations
 * (e.g. supabase.auth.admin.createUser) and for serving the metered API.
 *
 * SECURITY: this value must exist ONLY on the server. It must never be placed in
 * any env consumed by the web/mobile clients — those use the publishable key.
 */
const supabaseSecretKey =
  env.SUPABASE_SECRET_KEY || env.PUBLIC_SUPABASE_SERVICE_ROLE || '';

if (!supabaseSecretKey) {
  console.warn(
    '[Supabase] No SUPABASE_SECRET_KEY set. Admin operations (like creating users) will not work.',
  );
}

/**
 * Supabase client configured with the server secret key. Required for admin
 * operations and to bypass RLS on server-only tables.
 */
export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
