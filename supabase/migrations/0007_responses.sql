-- responses: recipient's reply to a message via dial-1. Routed back to
-- original sender without revealing the responder's identity (Decision #20).

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  responder_user_id uuid not null references public.users(id) on delete cascade,
  audio_url text not null,
  duration_seconds integer not null,
  recorded_at timestamptz not null default now(),
  constraint duration_within_2min check (duration_seconds between 1 and 120)
);

create index idx_responses_message on public.responses(message_id);
create index idx_responses_responder on public.responses(responder_user_id);

alter table public.responses enable row level security;

create policy "responses_admin_read" on public.responses
  for select using (
    exists (
      select 1 from public.messages m
      join public.users u on u.id = m.sender_user_id
      join public.communities c on c.id = u.community_id
      where m.id = responses.message_id and c.owner_admin_id = auth.uid()
    )
  );
