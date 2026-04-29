// Twilio recording status callback.
//
// Milestone 4: when Twilio finishes a <Record>, this endpoint receives
// RecordingSid + RecordingUrl. Download the audio, upload to Supabase Storage
// at audio/{community_id}/{intros|messages|responses}/{user_or_message_id}.{ext},
// then update the corresponding row's audio_url.
//
// Spec refs: Architect §5.6.

export async function POST(_request: Request) {
  return new Response('Not implemented yet — Milestone 4', { status: 501 });
}
