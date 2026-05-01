import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface RolodexEntry {
  user_id: string;
  name: string | null;
  photo_url: string | null;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  location: string | null;
  interests: string | null;
  assigned_number: number | null;
  voice_intro_audio_url: string | null;
  voice_intro_question: string | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return { title: `${slug} · FlirtPhone Rolodex` };
}

export default async function RolodexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: community } = await supabase
    .from('communities')
    .select('id, name, slug, status')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!community) notFound();

  const { data: rolodexData, error } = await supabase.rpc('get_rolodex', {
    community_slug: slug,
  });
  const entries = (rolodexData as RolodexEntry[] | null) ?? [];

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight">{community.name}</h1>
          <p className="mt-2 text-stone-600">
            FlirtPhone Rolodex · {entries.length}{' '}
            {entries.length === 1 ? 'member' : 'members'}
          </p>
        </header>

        {error ? (
          <p className="text-sm text-red-700">Could not load Rolodex: {error.message}</p>
        ) : entries.length === 0 ? (
          <div className="rounded border border-dashed border-stone-400 px-6 py-16 text-center">
            <p className="text-stone-600">No members yet.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {entries.map((entry) => (
              <RolodexCard key={entry.user_id} entry={entry} />
            ))}
          </ul>
        )}

        <footer className="mt-16 pt-8 border-t border-stone-300 text-sm text-stone-500">
          <p>
            See someone you want to connect with?{' '}
            <Link
              href={`/phone/${slug}`}
              className="underline hover:text-stone-900"
            >
              Pick up the phone →
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}

function RolodexCard({ entry }: { entry: RolodexEntry }) {
  return (
    <li className="border border-stone-300 bg-white p-5">
      <div className="flex items-start gap-4">
        {entry.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.photo_url}
            alt={entry.name ?? ''}
            className="w-20 h-20 object-cover rounded"
          />
        ) : (
          <div className="w-20 h-20 bg-stone-200 flex items-center justify-center text-stone-400">
            ?
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h2 className="font-semibold truncate">{entry.name}</h2>
            <span className="text-sm text-stone-500">#{entry.assigned_number}</span>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            {[entry.age, entry.gender, entry.orientation, entry.location]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {entry.interests ? (
            <p className="mt-2 text-sm">{entry.interests}</p>
          ) : null}
        </div>
      </div>

      {entry.voice_intro_audio_url ? (
        <div className="mt-4 space-y-2">
          {entry.voice_intro_question ? (
            <p className="text-xs italic text-stone-500">
              &ldquo;{entry.voice_intro_question}&rdquo;
            </p>
          ) : null}
          <audio controls preload="none" className="w-full">
            <source src={entry.voice_intro_audio_url} />
          </audio>
        </div>
      ) : null}
    </li>
  );
}
