-- admins: 1:1 mirror of auth.users with FlirtPhone admin metadata.
-- Auto-populated by trigger on auth.users insert.

create table public.admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "admins_self_read" on public.admins
  for select using (auth.uid() = id);

create policy "admins_self_update" on public.admins
  for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admins (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin();
