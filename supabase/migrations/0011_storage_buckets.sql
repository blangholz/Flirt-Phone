-- Storage buckets for user-uploaded media. Public read so the Rolodex
-- can serve URLs directly without signed URLs (rolodex audio is already
-- public per Decision #18).
--
-- Bucket policies still require authenticated/service-role for write —
-- our server-side code uses service_role. Anyone can READ.

insert into storage.buckets (id, name, public)
values
  ('audio', 'audio', true),
  ('photos', 'photos', true)
on conflict (id) do nothing;

-- Public read policy on both buckets
create policy "audio_public_read" on storage.objects
  for select using (bucket_id = 'audio');

create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

-- Writes via service_role bypass RLS — no insert/update/delete policies needed.
