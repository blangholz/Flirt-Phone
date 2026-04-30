import { createClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/lib/env';
import type { Database } from '@/lib/db/types';

// Service-role client. BYPASSES RLS. Server-only.
// Use for member-driven flows (registration, message send/receive, matching)
// where members authenticate via Twilio SMS OTP, not Supabase Auth.
// NEVER import this from a Client Component or expose the key to the browser.
export function createSupabaseAdminClient() {
  const env = getServerEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
