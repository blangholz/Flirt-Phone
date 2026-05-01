// Generate the question pool via Anthropic API.
//
// POST body: { communitySlug: string, answers: InterviewAnswers }
// Response: { questions: { text: string }[] }
//
// Auth: caller must be the admin who owns `communitySlug`.
// Spec refs: PDK §11.2, Architect §5.5.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  generateQuestions,
  interviewAnswersSchema,
} from '@/lib/admin/generate-questions';

const bodySchema = z.object({
  communitySlug: z.string().min(1),
  answers: interviewAnswersSchema,
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify the caller owns the community.
  const { data: community, error } = await supabase
    .from('communities')
    .select('id, name, type, owner_admin_id')
    .eq('slug', parsed.data.communitySlug)
    .maybeSingle();
  if (error || !community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 });
  }
  if (community.owner_admin_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const questions = await generateQuestions(
      { name: community.name, type: community.type },
      parsed.data.answers,
    );
    return NextResponse.json({ questions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
