import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export const metadata = { title: 'FlirtPhone admin sign-in' };

// Reads the session cookie to redirect already-signed-in admins.
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/admin');

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-24">
        <h1 className="text-3xl font-bold tracking-tight">Admin sign-in</h1>
        <p className="mt-2 text-sm text-stone-600">
          We&rsquo;ll email you a single-use link.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
