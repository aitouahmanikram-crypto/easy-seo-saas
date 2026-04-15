import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rbqhjltewcowzfncsffr.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_cYfCVm1EsuIZ6ncX1nu5pA_0XwE3MPy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations that need to bypass RLS
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bUtsKMhJCB9T1B8Be-WI9A_1gj185AU';
  return createClient(supabaseUrl, serviceRoleKey);
};
