// Inbound Twilio Voice webhook (TwiML response).
//
// Milestone 4 (outbound voice intro recording): respond with TwiML to play
// the question prompt, then <Record> for 30s.
// Milestone 7 (production phone): route inbound calls through phone state machine.
//
// Spec refs: PDK §5.2 (intro recording), §7 (phone interface), Architect §5.3, §5.4.

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

  // Stub — TwiML that hangs up. Actual logic in Milestones 4 + 7.
  const twiml = newVoiceResponse();
  twiml.say('FlirtPhone is not yet available. Please try again later.');
  twiml.hangup();
  return twimlResponse(twiml);
}
