import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SignOutButton } from './sign-out-button';

// Auth-gated; never prerender. Always evaluate per-request so we can read
// the session cookie and react to env changes.
export const dynamic = 'force-dynamic';

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-300 bg-amber-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-bold tracking-tight">
            FlirtPhone <span className="text-stone-500">admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-stone-600">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-12">{children}</div>
    </div>
  );
}
