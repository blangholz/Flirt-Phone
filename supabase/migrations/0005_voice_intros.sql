-- voice_intros: one CURRENT 30s intro per user. Replaced (not appended)
-- on profile refresh. Phase 2 may add a history table.

create table public.voice_intros (
  user_id uuid primary key references public.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  audio_url text not null,
  duration_seconds integer not null,
  recorded_at timestamptz not null default now(),
  constraint duration_within_30s check (duration_seconds between 1 and 30)
);

alter table public.voice_intros enable row level security;

create policy "voice_intros_admin_read" on public.voice_intros
  for select using (
    exists (
      select 1 from public.users u
      join public.communities c on c.id = u.community_id
      where u.id = voice_intros.user_id and c.owner_admin_id = auth.uid()
    )
  );

-- Public Rolodex reads via SECURITY DEFINER RPC (added in Milestone 5).
