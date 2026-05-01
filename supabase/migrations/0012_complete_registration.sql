-- Milestone 4: complete a user's registration after the voice intro is
-- captured. Atomically:
--   - assign a unique 3-digit number within the community (random in 100-999)
--   - flip status to 'active' and registration_step to 'complete'
--   - return the assigned number so the caller can SMS it back to the user
--
-- Decision #5: random, not sequential. We retry on collision; with ~900
-- slots per community and modest membership, this terminates quickly.

create or replace function public.complete_registration(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community_id uuid;
  v_number integer;
  v_attempts integer := 0;
begin
  select community_id into v_community_id
  from public.users where id = p_user_id;

  if v_community_id is null then
    raise exception 'User not found: %', p_user_id;
  end if;

  loop
    v_attempts := v_attempts + 1;
    if v_attempts > 200 then
      raise exception
        'Could not find unused 3-digit number in community % after 200 attempts',
        v_community_id;
    end if;
    v_number := 100 + floor(random() * 900)::integer;
    exit when not exists (
      select 1 from public.users
      where community_id = v_community_id and assigned_number = v_number
    );
  end loop;

  update public.users
  set assigned_number = v_number,
      status = 'active',
      registration_step = 'complete'
  where id = p_user_id;

  return v_number;
end;
$$;

grant execute on function public.complete_registration(uuid) to service_role;
