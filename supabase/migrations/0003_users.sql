-- users: community members. NOT mirrored from auth.users — members
-- authenticate via custom phone-verification flow (Twilio SMS OTP),
-- not Supabase Auth. Phone number is the primary identifier.

create type public.user_status as enum ('registering', 'active', 'dormant');

create table public.users (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  phone_number text not null,
  name text,
  photo_url text,
  age integer,
  gender text,
  orientation text,
  location text,
  interests text,
  assigned_number integer,
  status public.user_status not null default 'registering',
  created_at timestamptz not null default now(),
  unique (community_id, phone_number),
  unique (community_id, assigned_number),
  constraint assigned_number_3_digits check (
    assigned_number is null or (assigned_number between 100 and 999)
  ),
  constraint age_reasonable check (age is null or (age between 18 and 120)),
  constraint phone_number_e164 check (phone_number ~ '^\+[1-9]\d{1,14}$')
);

create index idx_users_lookup_phone on public.users(community_id, phone_number);
create index idx_users_lookup_number on public.users(community_id, assigned_number);
create index idx_users_status on public.users(community_id, status);

alter table public.users enable row level security;

-- Admins see metadata for users in their communities.
create policy "users_admin_read" on public.users
  for select using (
    exists (
      select 1 from public.communities c
      where c.id = users.community_id and c.owner_admin_id = auth.uid()
    )
  );

-- Member-driven flows (registration, send/receive) use service_role,
-- which bypasses RLS. No member-facing RLS policies needed for MVP.
