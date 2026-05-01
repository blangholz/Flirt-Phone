-- Milestone 3: track per-user registration FSM state for the conversational
-- SMS flow at /api/twilio/sms.
--
-- One row per (community_id, phone_number) — enforced by 0003_users.sql.
-- Step advances on each inbound SMS that satisfies the current prompt.

create type public.registration_step as enum (
  'awaiting_name',
  'awaiting_age',
  'awaiting_gender',
  'awaiting_orientation',
  'awaiting_location',
  'awaiting_interests',
  'awaiting_photo',
  'awaiting_call_consent',
  'call_pending',     -- placed by Milestone 4 outbound call
  'complete'          -- voice intro recorded, status promoted to 'active'
);

alter table public.users
  add column registration_step public.registration_step
    not null default 'awaiting_name';

-- Idempotency: dedupe Twilio webhook retries by MessageSid.
alter table public.users
  add column last_inbound_message_sid text;

create index idx_users_phone_global
  on public.users(phone_number, status);
