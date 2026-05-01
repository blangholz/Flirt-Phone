'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  generateQuestions,
  interviewAnswersSchema,
} from '@/lib/admin/generate-questions';

const inputSchema = z.object({
  communitySlug: z.string().min(1),
  answers: interviewAnswersSchema,
});

export type GenerateQuestionsState =
  | { status: 'idle' }
  | { status: 'error'; message: string };

export async function runSetupInterview(
  _prev: GenerateQuestionsState,
  formData: FormData,
): Promise<GenerateQuestionsState> {
  const parsed = inputSchema.safeParse({
    communitySlug: formData.get('communitySlug'),
    answers: {
      what: formData.get('what'),
      who: formData.get('who'),
      vibe: formData.get('vibe'),
      topics: formData.get('topics') || undefined,
    },
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Not signed in' };

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, type, owner_admin_id')
    .eq('slug', parsed.data.communitySlug)
    .maybeSingle();
  if (!community || community.owner_admin_id !== user.id) {
    return { status: 'error', message: 'Community not found' };
  }

  let questions;
  try {
    questions = await generateQuestions(
      { name: community.name, type: community.type },
      parsed.data.answers,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return { status: 'error', message };
  }

  // Replace any existing question pool with the new candidate set.
  // The admin reviews/edits/approves on the next screen.
  await supabase.from('questions').delete().eq('community_id', community.id);
  const { error: insertError } = await supabase.from('questions').insert(
    questions.map((q) => ({
      community_id: community.id,
      question_text: q.text,
      source: 'admin_approved' as const,
    })),
  );
  if (insertError) {
    return { status: 'error', message: insertError.message };
  }

  redirect(`/admin/communities/${parsed.data.communitySlug}/questions`);
}
