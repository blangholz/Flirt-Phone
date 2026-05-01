import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'FlirtPhone admin' };

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();
  const { data: communities, error } = await supabase
    .from('communities')
    .select('id, name, slug, type, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Communities</h1>
        <Link
          href="/admin/communities/new"
          className="bg-stone-900 px-4 py-2 text-sm text-amber-50 hover:bg-stone-700"
        >
          New community
        </Link>
      </div>

      {error ? (
        <p className="text-sm text-red-700">Could not load communities: {error.message}</p>
      ) : !communities || communities.length === 0 ? (
        <div className="rounded border border-dashed border-stone-400 px-6 py-16 text-center">
          <p className="text-stone-600">No communities yet.</p>
          <Link
            href="/admin/communities/new"
            className="mt-4 inline-block underline hover:text-stone-900"
          >
            Create your first community →
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stone-300">
          {communities.map((c) => (
            <li key={c.id} className="py-4">
              <Link
                href={`/admin/communities/${c.slug}`}
                className="flex items-center justify-between hover:underline"
              >
                <div>
                  <span className="font-semibold">{c.name}</span>
                  <span className="ml-2 text-sm text-stone-500">/{c.slug}</span>
                </div>
                <span className="text-sm text-stone-500">
                  {c.type} · {c.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
