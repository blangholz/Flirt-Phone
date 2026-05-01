// Inbound Twilio SMS / MMS webhook.
//
// Milestone 3: drives the conversational registration FSM.
// Inputs (form-encoded): From, Body, NumMedia, MediaUrl0, MessageSid, ...
//
// Spec refs: PDK §5 (Registration), Architect §5.1.

import {
  newMessagingResponse,
  parseAndValidateTwilioWebhook,
  twimlResponse,
} from '@/lib/twilio';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }

  // Stub — Milestone 3 will replace this with the conversational
  // registration FSM. For now, acknowledge so Twilio doesn't retry.
  const twiml = newMessagingResponse();
  twiml.message(
    'FlirtPhone registration is not yet open. Stay tuned.',
  );
  return twimlResponse(twiml);
}
