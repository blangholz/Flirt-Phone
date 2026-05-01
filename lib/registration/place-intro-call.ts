// Place the outbound Twilio call that records a user's voice intro.
// Triggered when the SMS FSM advances a user to registration_step
// = 'call_pending' (i.e. they replied YES).
//
// Twilio dials the user's phone; on pickup, Twilio fetches our
// /api/twilio/voice endpoint, which returns TwiML that plays the
// question + records the answer. Recording is captured by
// /api/twilio/recording.

import { getServerEnv, requireTwilio } from '@/lib/env';
import { getTwilioClient } from '@/lib/twilio';

export interface PlacedCall {
  callSid: string;
}

export async function placeVoiceIntroCall(args: {
  userId: string;
  toNumber: string; // E.164
}): Promise<PlacedCall> {
  const env = getServerEnv();
  const twilio = requireTwilio();
  const client = getTwilioClient();

  const voiceUrl = `${env.NEXT_PUBLIC_APP_URL}/api/twilio/voice?userId=${encodeURIComponent(args.userId)}`;
  const statusUrl = `${env.NEXT_PUBLIC_APP_URL}/api/twilio/call-status?userId=${encodeURIComponent(args.userId)}`;

  const call = await client.calls.create({
    from: twilio.TWILIO_PHONE_NUMBER,
    to: args.toNumber,
    url: voiceUrl,
    method: 'POST',
    statusCallback: statusUrl,
    statusCallbackEvent: ['no-answer', 'failed', 'busy', 'completed'],
    statusCallbackMethod: 'POST',
    timeout: 30, // seconds to wait for pickup
  });
  return { callSid: call.sid };
}
