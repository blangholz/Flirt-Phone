// Inbound Twilio SMS / MMS webhook.
//
// Milestone 3: drives the conversational registration FSM.
// Inputs (form-encoded): From, Body, NumMedia, MediaUrl0, MessageSid, ...
// Must validate X-Twilio-Signature against TWILIO_AUTH_TOKEN before trusting any field.
// Idempotency: dedupe by MessageSid.
//
// Spec refs: PDK §5 (Registration), Architect §5.1.

export async function POST(_request: Request) {
  return new Response('Not implemented yet — Milestone 3', { status: 501 });
}
