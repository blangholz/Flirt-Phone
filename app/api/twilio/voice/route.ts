// Inbound Twilio Voice webhook (TwiML response).
//
// Two flows hit this endpoint:
//
// 1. Outbound voice-intro leg (Milestone 4):
//    The SMS FSM placed a call with `?userId=...`. When the user picks up,
//    Twilio fetches this URL and we respond with TwiML that plays the
//    question + records a 30-second answer. Recording status fires to
//    /api/twilio/recording.
//
// 2. Generic inbound call (someone dials our Twilio number directly):
//    No userId — return a friendly "not available yet" hangup. The full
//    inbound-phone behavior is Milestone 7.
//
// Spec refs: PDK §5.2 (intro recording), Architect §5.3 + §5.4.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { getServerEnv } from '@/lib/env';
import {
  newVoiceResponse,
  parseAndValidateTwilioWebhook,
  twimlResponse,
} from '@/lib/twilio';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }

  const userId = new URL(request.url).searchParams.get('userId');
  if (!userId) {
    // Generic inbound call (not a registration leg).
    const twiml = newVoiceResponse();
    twiml.say('FlirtPhone is not yet available for inbound calls. Goodbye.');
    twiml.hangup();
    return twimlResponse(twiml);
  }

  const env = getServerEnv();
  const supabase = createSupabaseAdminClient();

  // Fetch user + a random question from their community.
  const { data: user } = await supabase
    .from('users')
    .select('id, name, community_id, registration_step')
    .eq('id', userId)
    .maybeSingle();
  if (!user) {
    return errorTwiml('We could not find your registration. Please text us again.');
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text')
    .eq('community_id', user.community_id);
  if (!questions || questions.length === 0) {
    return errorTwiml(
      'This community has no questions configured yet. The host needs to set those up.',
    );
  }
  const question = questions[Math.floor(Math.random() * questions.length)];

  const recordingUrl = new URL(
    '/api/twilio/recording',
    env.NEXT_PUBLIC_APP_URL,
  );
  recordingUrl.searchParams.set('userId', user.id);
  recordingUrl.searchParams.set('questionId', question.id);

  const greeting = user.name
    ? `Hi ${user.name}, this is FlirtPhone.`
    : 'This is FlirtPhone.';

  const twiml = newVoiceResponse();
  twiml.say(`${greeting} I'm going to ask you one question.`);
  twiml.pause({ length: 1 });
  twiml.say(question.question_text);
  twiml.pause({ length: 1 });
  twiml.say(
    'Record your answer after the beep. You have thirty seconds. Press the pound key when finished.',
  );
  twiml.record({
    maxLength: 30,
    finishOnKey: '#',
    playBeep: true,
    recordingStatusCallback: recordingUrl.toString(),
    recordingStatusCallbackEvent: ['completed'],
    recordingStatusCallbackMethod: 'POST',
    timeout: 5, // seconds of silence before stopping
  });
  // If <Record> ends without a recording, fall through:
  twiml.say('Sorry, I did not catch that. Goodbye.');
  twiml.hangup();
  return twimlResponse(twiml);
}

function errorTwiml(message: string): Response {
  const twiml = newVoiceResponse();
  twiml.say(message);
  twiml.hangup();
  return twimlResponse(twiml);
}
