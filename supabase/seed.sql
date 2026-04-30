-- supabase/seed.sql — local dev test data.
-- Runs automatically after `supabase db reset` (local stack only;
-- production data is NEVER seeded by this file).

-- ---------------------------------------------------------------------------
-- 1 fake admin. We seed auth.users directly because local supabase runs
-- this file as superuser. The handle_new_admin() trigger from migration 0001
-- creates the matching public.admins row.

insert into auth.users (
  id, instance_id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'admin@flirtphone.test',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  now(), now(), now()
);

-- ---------------------------------------------------------------------------
-- 1 community

insert into communities (id, name, slug, type, status, owner_admin_id) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Test Studio', 'test-studio',
   'ongoing', 'active', '00000000-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------------
-- 5 admin-approved questions

insert into questions (community_id, question_text, source) values
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'What''s the last thing that surprised you?', 'admin_approved'),
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'What was your favorite class here so far?', 'admin_approved'),
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'If you taught a one-day workshop, what would it be on?', 'admin_approved'),
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'What''s a song you''ve been playing on repeat?', 'admin_approved'),
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'What''s something most people don''t know about you?', 'admin_approved');

-- ---------------------------------------------------------------------------
-- 5 users with public profile data

insert into users (
  id, community_id, phone_number, name, age,
  gender, orientation, location, interests,
  assigned_number, status
) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   '+15551111111', 'Alex', 29, 'woman', 'pansexual',
   'Brooklyn', 'climbing, ceramics, late-night ramen', 137, 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   '+15552222222', 'Sam', 31, 'man', 'gay',
   'Queens', 'distance running, jazz, bouldering', 248, 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   '+15553333333', 'Jordan', 27, 'nonbinary', 'queer',
   'Brooklyn', 'rope flow, fermenting things, sketch comedy', 391, 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'aaaaaaaa-0000-0000-0000-000000000001',
   '+15554444444', 'Taylor', 33, 'woman', 'straight',
   'Manhattan', 'tarot, hot yoga, weird pasta', 562, 'active'),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'aaaaaaaa-0000-0000-0000-000000000001',
   '+15555555555', 'Morgan', 30, 'man', 'bisexual',
   'Brooklyn', 'climbing, slacklining, sourdough', 718, 'active');

-- ---------------------------------------------------------------------------
-- Voice intros — placeholder audio URLs (each user gets a random question)

insert into voice_intros (user_id, question_id, audio_url, duration_seconds)
select
  u.id,
  (select id from questions
   where community_id = u.community_id
   order by random() limit 1),
  'https://example.test/intro-' || u.assigned_number || '.m4a',
  28
from users u
where u.community_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- ---------------------------------------------------------------------------
-- A couple of messages between users (placeholder audio URLs)

insert into messages (sender_user_id, recipient_user_id, audio_url, duration_seconds) values
  ('bbbbbbbb-0000-0000-0000-000000000001',
   'bbbbbbbb-0000-0000-0000-000000000002',
   'https://example.test/msg-1.m4a', 42),
  ('bbbbbbbb-0000-0000-0000-000000000003',
   'bbbbbbbb-0000-0000-0000-000000000004',
   'https://example.test/msg-2.m4a', 73);
