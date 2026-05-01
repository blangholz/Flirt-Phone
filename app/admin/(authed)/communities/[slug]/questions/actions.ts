'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function authedCommunity(slug: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data: community } = await supabase
    .from('communities')
    .select('id, slug, owner_admin_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!community || community.owner_admin_id !== user.id) {
    throw new Error('Community not found');
  }
  return { supabase, community };
}

const addSchema = z.object({
  communitySlug: z.string().min(1),
  text: z.string().min(5).max(500),
});

export async function addQuestion(formData: FormData): Promise<void> {
  const parsed = addSchema.parse({
    communitySlug: formData.get('communitySlug'),
    text: formData.get('text'),
  });
  const { supabase, community } = await authedCommunity(parsed.communitySlug);
  await supabase.from('questions').insert({
    community_id: community.id,
    question_text: parsed.text,
    source: 'admin_added',
  });
  revalidatePath(`/admin/communities/${parsed.communitySlug}/questions`);
}

const updateSchema = z.object({
  communitySlug: z.string().min(1),
  questionId: z.string().uuid(),
  text: z.string().min(5).max(500),
});

export async function updateQuestion(formData: FormData): Promise<void> {
  const parsed = updateSchema.parse({
    communitySlug: formData.get('communitySlug'),
    questionId: formData.get('questionId'),
    text: formData.get('text'),
  });
  const { supabase, community } = await authedCommunity(parsed.communitySlug);
  await supabase
    .from('questions')
    .update({ question_text: parsed.text })
    .eq('id', parsed.questionId)
    .eq('community_id', community.id);
  revalidatePath(`/admin/communities/${parsed.communitySlug}/questions`);
}

const deleteSchema = z.object({
  communitySlug: z.string().min(1),
  questionId: z.string().uuid(),
});

export async function deleteQuestion(formData: FormData): Promise<void> {
  const parsed = deleteSchema.parse({
    communitySlug: formData.get('communitySlug'),
    questionId: formData.get('questionId'),
  });
  const { supabase, community } = await authedCommunity(parsed.communitySlug);
  await supabase
    .from('questions')
    .delete()
    .eq('id', parsed.questionId)
    .eq('community_id', community.id);
  revalidatePath(`/admin/communities/${parsed.communitySlug}/questions`);
}
