-- messages: voice messages from sender to recipient. Sending IS the
-- implicit match request (Decision #19). Up to 2 minutes.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references public.users(id) on delete cascade,
  recipient_user_id uuid not null references public.users(id) on delete cascade,
  audio_url text not null,
  duration_seconds integer not null,
  sent_at timestamptz not null default now(),
  listened_at timestamptz,
  listened_count integer not null default 0,
  constraint sender_recipient_distinct check (sender_user_id <> recipient_user_id),
  constraint duration_within_2min check (duration_seconds between 1 and 120),
  constraint listened_count_non_negative check (listened_count >= 0)
);

create index idx_messages_recipient_inbox
  on public.messages(recipient_user_id, sent_at desc);
create index idx_messages_sender
  on public.messages(sender_user_id, sent_at desc);

alter table public.messages enable row level security;

create policy "messages_admin_read" on public.messages
  for select using (
    exists (
      select 1 from public.users u
      join public.communities c on c.id = u.community_id
      where u.id = messages.sender_user_id and c.owner_admin_id = auth.uid()
    )
  );
