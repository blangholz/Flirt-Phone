// Twilio recording status callback.
//
// Milestone 4: when Twilio finishes a <Record>, this endpoint receives
// RecordingSid + RecordingUrl + CallSid. Download the audio, upload to
// Supabase Storage at audio/{community_id}/{intros|messages|responses}/
// {user_or_message_id}.{ext}, then update the corresponding row's audio_url.
//
// Spec refs: Architect §5.6.

import { parseAndValidateTwilioWebhook } from '@/lib/twilio';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }
  // Stub — Milestone 4 will implement the download + upload pipeline.
  return new Response('Not implemented yet — Milestone 4', { status: 501 });
}
