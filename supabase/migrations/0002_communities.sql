-- communities: each FlirtPhone install (yoga studio, wedding, party).
-- Owned by an admin. URL-scoped by slug per Architect §3.

create type public.community_type as enum ('ongoing', 'temporary');
create type public.community_status as enum ('active', 'dormant', 'closed');

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type public.community_type not null,
  start_date date,
  end_date date,
  status public.community_status not null default 'active',
  refresh_cadence interval,
  owner_admin_id uuid not null references public.admins(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint temporary_dates_required check (
    type <> 'temporary' or (start_date is not null and end_date is not null)
  ),
  constraint slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$')
);

create index idx_communities_owner on public.communities(owner_admin_id);

alter table public.communities enable row level security;

create policy "communities_owner_all" on public.communities
  for all using (auth.uid() = owner_admin_id)
  with check (auth.uid() = owner_admin_id);

-- Public can see active communities; column-level safety is enforced by RPCs
-- (added in Milestone 5 when the Rolodex page lands).
create policy "communities_public_read_active" on public.communities
  for select using (status = 'active');
