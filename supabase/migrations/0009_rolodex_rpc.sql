-- Public Rolodex read path. SECURITY DEFINER bypasses RLS on the underlying
-- tables but the function itself NEVER returns phone_number. Anyone on the
-- internet with the community slug can call this — that's by design
-- (Decision #18: profiles are public on the Rolodex).

create or replace function public.get_rolodex(community_slug text)
returns table (
  user_id uuid,
  name text,
  photo_url text,
  age integer,
  gender text,
  orientation text,
  location text,
  interests text,
  assigned_number integer,
  voice_intro_audio_url text,
  voice_intro_question text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.name,
    u.photo_url,
    u.age,
    u.gender,
    u.orientation,
    u.location,
    u.interests,
    u.assigned_number,
    vi.audio_url as voice_intro_audio_url,
    q.question_text as voice_intro_question
  from communities c
  join users u on u.community_id = c.id
  left join voice_intros vi on vi.user_id = u.id
  left join questions q on q.id = vi.question_id
  where c.slug = community_slug
    and c.status = 'active'
    and u.status = 'active'
  order by u.assigned_number;
$$;

grant execute on function public.get_rolodex(text) to anon, authenticated;
