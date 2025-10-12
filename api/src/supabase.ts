import { createClient } from '@supabase/supabase-js';
import { env } from 'node:process';
const supabaseUrl = env.PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.PUBLIC_SUPABASE_SERVICE_ROLE || '';
export const supabase = createClient(supabaseUrl, supabaseKey);
