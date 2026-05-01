// Magic-link callback. Receives ?token_hash=...&type=...&next=...
// Exchanges the token_hash for a session via verifyOtp, then redirects.
//
// Why token_hash and not the implicit access_token in the URL fragment:
// email scanners (Gmail, Outlook Safe Links) prefetch URLs to check for
// malware. With token_hash, the verifyOtp() exchange happens server-side
// here when the real user clicks — scanners can't burn the token.

import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const ALLOWED_TYPES: ReadonlyArray<EmailOtpType> = [
  'magiclink',
  'email',
  'recovery',
  'invite',
  'email_change',
];

function isEmailOtpType(value: string): value is EmailOtpType {
  return (ALLOWED_TYPES as ReadonlyArray<string>).includes(value);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const next = searchParams.get('next') ?? '/admin';

  if (token_hash && typeParam && isEmailOtpType(typeParam)) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type: typeParam, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }
  return NextResponse.redirect(new URL('/admin/login?error=auth_failed', request.url));
}
