import { createClient } from '@supabase/supabase-js';
import { env } from 'node:process';

const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';

/**
 * Service role key for admin operations (e.g., creating users).
 * Falls back to anon key if service role is not available.
 */
const supabaseServiceRoleKey = env.PUBLIC_SUPABASE_SERVICE_ROLE || '';
const supabaseAnonKey = env.PUBLIC_SUPABASE_API_KEY || '';

// Use service role key for admin operations, fall back to anon key
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseServiceRoleKey) {
  console.warn(
    '[Supabase] PUBLIC_SUPABASE_SERVICE_ROLE not set. Admin operations (like creating users) will not work.',
  );
}

/**
 * Supabase client configured with service role key (preferred) or anon key (fallback).
 * Service role key is required for admin operations like supabase.auth.admin.createUser().
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
