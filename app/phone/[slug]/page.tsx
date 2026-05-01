import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `${slug} · FlirtPhone` };
}

export default async function PhonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: community } = await supabase
    .from('communities')
    .select('name, slug, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!community) notFound();

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-widest text-stone-500">
          {community.name}
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">FlirtPhone</h1>
        <p className="mt-6 text-stone-600">
          The website phone is coming. For now, browse the Rolodex and remember
          who you&rsquo;d like to leave a message for.
        </p>

        <div className="mt-12 flex flex-col items-center gap-4">
          <button
            type="button"
            disabled
            className="w-48 h-48 rounded-full border-4 border-stone-400 bg-stone-100 text-stone-400 disabled:cursor-not-allowed"
            title="Coming in Milestone 6"
          >
            ☎ <br />
            Pick up
          </button>
          <p className="text-xs text-stone-500">
            Phone state machine is wired ({/* developer note */}see{' '}
            <code className="bg-stone-100 px-1">phone/state-machine.ts</code>),
            audio + dial implementations in progress.
          </p>
        </div>

        <p className="mt-12 text-sm">
          <Link
            href={`/rolodex/${slug}`}
            className="underline hover:text-stone-900"
          >
            ← Back to Rolodex
          </Link>
        </p>
      </div>
    </main>
  );
}
