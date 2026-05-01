import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function CommunityDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, type, status, start_date, end_date, created_at')
    .eq('slug', slug)
    .maybeSingle();
  if (!community) notFound();

  const [{ count: questionCount }, { count: userCount }] = await Promise.all([
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', community.id),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('community_id', community.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm underline hover:text-stone-900">
          ← Communities
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{community.name}</h1>
        <p className="mt-1 text-sm text-stone-500">
          /{community.slug} · {community.type} · {community.status}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Tile
          href={`/admin/communities/${community.slug}/setup`}
          title="Setup interview"
          subtitle={questionCount && questionCount > 0 ? 'Re-run' : 'Generate questions'}
        />
        <Tile
          href={`/admin/communities/${community.slug}/questions`}
          title="Question pool"
          subtitle={`${questionCount ?? 0} questions`}
        />
        <Tile
          href={`/admin/communities/${community.slug}/members`}
          title="Members"
          subtitle={`${userCount ?? 0} registered`}
        />
      </div>

      <p className="text-sm text-stone-500">
        Public Rolodex:{' '}
        <Link href={`/rolodex/${community.slug}`} className="underline hover:text-stone-900">
          /rolodex/{community.slug}
        </Link>
      </p>
    </div>
  );
}

function Tile({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="block border border-stone-300 px-4 py-6 hover:border-stone-600"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-stone-500">{subtitle}</div>
    </Link>
  );
}
