import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SetupForm } from './setup-form';

export const metadata = { title: 'Setup interview' };

export default async function SetupInterviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, type')
    .eq('slug', slug)
    .maybeSingle();
  if (!community) notFound();

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href={`/admin/communities/${slug}`}
          className="text-sm underline hover:text-stone-900"
        >
          ← {community.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Setup interview</h1>
        <p className="mt-2 text-sm text-stone-600">
          Tell us about the community. Claude generates ~20 candidate questions for
          your members&rsquo; voice intros. You review them on the next screen.
        </p>
      </div>

      <SetupForm communitySlug={slug} communityName={community.name} />
    </div>
  );
}
