// Twilio recording status callback.
//
// Fires after a <Record> verb finishes. We:
//   1. Validate signature.
//   2. Fetch the audio with Twilio Basic auth (recordings are auth-gated
//      for ~24h).
//   3. Upload to Supabase Storage at audio/{community_id}/intros/{user_id}.mp3.
//   4. Insert a voice_intros row tying the audio to the user + question.
//   5. Call complete_registration() — assigns a unique 3-digit number,
//      flips status to active and registration_step to complete.
//   6. (Best-effort) send the user an SMS with their assigned number +
//      Rolodex link. Failure here is non-fatal — the user is now active
//      whether or not they get the SMS (until A2P 10DLC is approved).
//
// Spec refs: Architect §5.6, PDK §5.4.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getServerEnv, requireTwilio } from '@/lib/env';
import {
  getTwilioClient,
  parseAndValidateTwilioWebhook,
} from '@/lib/twilio';

const MP3_EXT = 'mp3';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  const questionId = url.searchParams.get('questionId');
  if (!userId || !questionId) {
    return new Response('Missing userId/questionId', { status: 400 });
  }

  const recordingUrl = params['RecordingUrl'];
  const recordingDuration = parseInt(params['RecordingDuration'] ?? '0', 10);
  if (!recordingUrl || !Number.isFinite(recordingDuration)) {
    return new Response('Missing recording fields', { status: 400 });
  }

  const env = getServerEnv();
  const twilio = requireTwilio();
  const supabase = createSupabaseAdminClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, community_id, phone_number, status')
    .eq('id', userId)
    .maybeSingle();
  if (userError || !user) {
    return new Response('User not found', { status: 404 });
  }

  // Idempotency: if user is already complete, treat this as a re-fire and ack.
  if (user.status === 'active') {
    return new Response('OK', { status: 200 });
  }

  // 1. Fetch the recording with Twilio Basic auth. RecordingUrl from
  //    Twilio is the JSON resource URL; append .mp3 to get the binary.
  const auth = Buffer.from(
    `${twilio.TWILIO_ACCOUNT_SID}:${twilio.TWILIO_AUTH_TOKEN}`,
  ).toString('base64');
  const audioRes = await fetch(`${recordingUrl}.${MP3_EXT}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!audioRes.ok) {
    return new Response(
      `Failed to fetch recording: ${audioRes.status}`,
      { status: 502 },
    );
  }
  const audioBuf = await audioRes.arrayBuffer();

  // 2. Upload to Supabase Storage.
  const objectKey = `${user.community_id}/intros/${user.id}.${MP3_EXT}`;
  const { error: uploadError } = await supabase.storage
    .from('audio')
    .upload(objectKey, new Uint8Array(audioBuf), {
      contentType: 'audio/mpeg',
      upsert: true,
    });
  if (uploadError) {
    return new Response(
      `Storage upload failed: ${uploadError.message}`,
      { status: 500 },
    );
  }
  const { data: pub } = supabase.storage.from('audio').getPublicUrl(objectKey);
  const publicUrl = pub.publicUrl;

  // 3. Insert/update voice_intros (PK is user_id, so upsert).
  const duration = Math.min(Math.max(recordingDuration, 1), 30);
  const { error: introError } = await supabase
    .from('voice_intros')
    .upsert({
      user_id: user.id,
      question_id: questionId,
      audio_url: publicUrl,
      duration_seconds: duration,
    });
  if (introError) {
    return new Response(
      `Voice intro insert failed: ${introError.message}`,
      { status: 500 },
    );
  }

  // 4. Atomically assign a 3-digit number + flip user to active.
  const { data: assignedNumber, error: completeError } = await supabase
    .rpc('complete_registration', { p_user_id: user.id });
  if (completeError || assignedNumber === null) {
    return new Response(
      `complete_registration failed: ${completeError?.message ?? 'no number'}`,
      { status: 500 },
    );
  }

  // 5. Best-effort: SMS the user their assigned number + Rolodex link.
  //    May fail until A2P 10DLC clears — we still 200 either way.
  try {
    const client = getTwilioClient();
    const { data: community } = await supabase
      .from('communities')
      .select('slug')
      .eq('id', user.community_id)
      .maybeSingle();
    const rolodexUrl = community
      ? `${env.NEXT_PUBLIC_APP_URL}/rolodex/${community.slug}`
      : env.NEXT_PUBLIC_APP_URL;
    await client.messages.create({
      from: twilio.TWILIO_PHONE_NUMBER,
      to: user.phone_number,
      body:
        `You're registered as user ${assignedNumber} on FlirtPhone. ` +
        `See yourself + browse: ${rolodexUrl}`,
    });
  } catch {
    // ignore; A2P 10DLC may still be pending
  }

  return new Response('OK', { status: 200 });
}
