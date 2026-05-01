'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/auth/callback?next=/admin`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <div className="rounded border border-stone-300 bg-stone-100 px-4 py-3 text-sm">
        Check <strong>{email}</strong>. The link signs you in.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-sm">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full border border-stone-400 bg-white px-3 py-2 text-stone-900 focus:border-stone-600 focus:outline-none"
          autoComplete="email"
          autoFocus
        />
      </label>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full bg-stone-900 px-4 py-2 text-amber-50 hover:bg-stone-700 disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
      </button>
      {errorMessage ? (
        <p className="text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </form>
  );
}
