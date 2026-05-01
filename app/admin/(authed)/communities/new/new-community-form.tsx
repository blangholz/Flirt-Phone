'use client';

import { useActionState, useState } from 'react';
import { createCommunity, type CreateCommunityState } from './actions';

const initial: CreateCommunityState = { status: 'idle' };

export function NewCommunityForm() {
  const [state, action, pending] = useActionState(createCommunity, initial);
  const [type, setType] = useState<'ongoing' | 'temporary'>('ongoing');

  return (
    <form action={action} className="space-y-5">
      <Field label="Community name" name="name" required placeholder="Brooklyn Yoga Studio" />
      <Field
        label="Slug (URL)"
        name="slug"
        required
        placeholder="brooklyn-yoga"
        hint="lowercase letters, digits, hyphens. Used as /rolodex/{slug}"
      />

      <fieldset className="space-y-2">
        <legend className="text-sm">Type</legend>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="ongoing"
            checked={type === 'ongoing'}
            onChange={() => setType('ongoing')}
          />
          <span>Ongoing (open-ended)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="type"
            value="temporary"
            checked={type === 'temporary'}
            onChange={() => setType('temporary')}
          />
          <span>Temporary (event with end date)</span>
        </label>
      </fieldset>

      {type === 'temporary' ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date" name="start_date" type="date" required />
          <Field label="End date" name="end_date" type="date" required />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-stone-900 px-4 py-2 text-amber-50 hover:bg-stone-700 disabled:opacity-50"
      >
        {pending ? 'Creating…' : 'Create community'}
      </button>

      {state.status === 'error' ? (
        <p className="text-sm text-red-700">{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input
        {...props}
        className="mt-1 block w-full border border-stone-400 bg-white px-3 py-2 focus:border-stone-600 focus:outline-none"
      />
      {hint ? <span className="mt-1 block text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}
