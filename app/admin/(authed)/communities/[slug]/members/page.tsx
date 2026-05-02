import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { RegistrationStep, UserStatus } from '@/lib/db/types';

export const metadata = { title: 'Members' };
export const dynamic = 'force-dynamic';

type MemberRow = {
  id: string;
  name: string | null;
  photo_url: string | null;
  phone_number: string;
  assigned_number: number | null;
  status: UserStatus;
  registration_step: RegistrationStep;
  created_at: string;
  voice_intros: { user_id: string }[] | null;
};

export default async function MembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: community } = await supabase
    .from('communities')
    .select('id, name')
    .eq('slug', slug)
    .maybeSingle();
  if (!community) notFound();

  const { data, error } = await supabase
    .from('users')
    .select(
      'id, name, photo_url, phone_number, assigned_number, status, ' +
        'registration_step, created_at, voice_intros(user_id)',
    )
    .eq('community_id', community.id)
    .order('created_at', { ascending: false });

  const members = (data ?? []) as unknown as MemberRow[];
  const counts = {
    active: members.filter((m) => m.status === 'active').length,
    registering: members.filter((m) => m.status === 'registering').length,
    dormant: members.filter((m) => m.status === 'dormant').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/admin/communities/${slug}`}
          className="text-sm underline hover:text-stone-900"
        >
          ← {community.name}
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Members</h1>
        <p className="mt-2 text-sm text-stone-600">
          {members.length} total · {counts.active} active · {counts.registering}{' '}
          registering · {counts.dormant} dormant
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-700">
          Could not load members: {error.message}
        </p>
      ) : members.length === 0 ? (
        <div className="rounded border border-dashed border-stone-400 px-6 py-16 text-center text-sm text-stone-600">
          No members yet. Share the signup link from the community page.
        </div>
      ) : (
        <ul className="divide-y divide-stone-300 border-y border-stone-300">
          {members.map((m) => (
            <MemberRow key={m.id} member={m} />
          ))}
        </ul>
      )}
    </div>
  );
}

function MemberRow({ member }: { member: MemberRow }) {
  const hasIntro = (member.voice_intros?.length ?? 0) > 0;
  return (
    <li className="py-4 flex items-start gap-4">
      {member.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo_url}
          alt={member.name ?? ''}
          className="w-14 h-14 object-cover rounded shrink-0"
        />
      ) : (
        <div className="w-14 h-14 bg-stone-200 flex items-center justify-center text-stone-400 rounded shrink-0">
          ?
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold">
            {member.name ?? <span className="text-stone-400">(no name yet)</span>}
          </span>
          {member.assigned_number ? (
            <span className="text-sm text-stone-500">
              #{member.assigned_number}
            </span>
          ) : null}
          <StatusBadge status={member.status} />
          {hasIntro ? (
            <span className="text-xs text-stone-500">· voice intro ✓</span>
          ) : null}
        </div>
        <div className="mt-1 text-sm text-stone-600 font-mono">
          {member.phone_number}
        </div>
        {member.status === 'registering' ? (
          <div className="mt-1 text-xs text-stone-500">
            stuck at: <span className="font-mono">{member.registration_step}</span>
          </div>
        ) : null}
        <div className="mt-1 text-xs text-stone-500">
          joined {formatDate(member.created_at)}
        </div>
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    active: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    registering: 'bg-amber-100 text-amber-900 border-amber-300',
    dormant: 'bg-stone-100 text-stone-700 border-stone-300',
  };
  return (
    <span
      className={`text-xs px-1.5 py-0.5 border ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
