'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const slugRegex = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/;

const inputSchema = z
  .object({
    name: z.string().min(2).max(100),
    slug: z.string().regex(slugRegex, 'lowercase letters, digits, and hyphens'),
    type: z.enum(['ongoing', 'temporary']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })
  .refine(
    (v) => v.type !== 'temporary' || (v.start_date && v.end_date),
    { message: 'Temporary communities require start and end dates', path: ['start_date'] },
  );

export type CreateCommunityState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'ok' };

export async function createCommunity(
  _prev: CreateCommunityState,
  formData: FormData,
): Promise<CreateCommunityState> {
  const parsed = inputSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    type: formData.get('type'),
    start_date: formData.get('start_date') || undefined,
    end_date: formData.get('end_date') || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'Not signed in' };

  const { error } = await supabase.from('communities').insert({
    name: parsed.data.name,
    slug: parsed.data.slug,
    type: parsed.data.type,
    start_date: parsed.data.start_date ?? null,
    end_date: parsed.data.end_date ?? null,
    owner_admin_id: user.id,
  });
  if (error) {
    return { status: 'error', message: error.message };
  }

  redirect(`/admin/communities/${parsed.data.slug}/setup`);
}
