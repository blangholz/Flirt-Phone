-- matches: completed mutual match. Recipient dial-9 on a message creates
-- the match; both parties receive contact info via SMS. Permanent within
-- the community (Decision #19, Functional Spec §9).

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_a_id uuid not null references public.users(id) on delete cascade,
  user_b_id uuid not null references public.users(id) on delete cascade,
  triggering_message_id uuid not null references public.messages(id) on delete restrict,
  matched_at timestamptz not null default now(),
  -- Canonical ordering ensures unique pair regardless of who sent first.
  constraint user_a_lt_user_b check (user_a_id < user_b_id)
);

create unique index idx_matches_unique_pair
  on public.matches(community_id, user_a_id, user_b_id);

create index idx_matches_user_a on public.matches(user_a_id);
create index idx_matches_user_b on public.matches(user_b_id);

alter table public.matches enable row level security;

create policy "matches_admin_read" on public.matches
  for select using (
    exists (
      select 1 from public.communities c
      where c.id = matches.community_id and c.owner_admin_id = auth.uid()
    )
  );
