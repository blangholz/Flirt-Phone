'use client';

import { useActionState } from 'react';
import { runSetupInterview, type GenerateQuestionsState } from './actions';

const initial: GenerateQuestionsState = { status: 'idle' };

export function SetupForm({
  communitySlug,
  communityName,
}: {
  communitySlug: string;
  communityName: string;
}) {
  const [state, action, pending] = useActionState(runSetupInterview, initial);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="communitySlug" value={communitySlug} />

      <Question
        name="what"
        label={`What is ${communityName}?`}
        placeholder="A weekly evening yoga class in Brooklyn that draws regulars from the neighborhood…"
        required
      />
      <Question
        name="who"
        label="Who comes here? Who's a typical member?"
        placeholder="Mostly 25-40, mix of professionals and creatives, lots of solo practitioners…"
        required
      />
      <Question
        name="vibe"
        label="What's the atmosphere or culture?"
        placeholder="Quiet, warm, no chitchat in the studio, but people linger after class for tea…"
        required
      />
      <Question
        name="topics"
        label="Topics to lean into or avoid? (optional)"
        placeholder="Lean into: creative practice, embodiment. Avoid: career talk, hustle culture."
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-stone-900 px-4 py-2 text-amber-50 hover:bg-stone-700 disabled:opacity-50"
      >
        {pending ? 'Generating questions…' : 'Generate question pool'}
      </button>

      {state.status === 'error' ? (
        <p className="text-sm text-red-700">{state.message}</p>
      ) : null}
    </form>
  );
}

function Question({
  name,
  label,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <textarea
        name={name}
        rows={4}
        required={required}
        placeholder={placeholder}
        className="mt-1 block w-full border border-stone-400 bg-white px-3 py-2 focus:border-stone-600 focus:outline-none"
      />
    </label>
  );
}
