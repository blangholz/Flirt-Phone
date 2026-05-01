// Twilio call status callback. Fires for every call we placed with
// statusCallback (registration intro calls in Milestone 4).
//
// MVP behavior: signature-validate + 200. Future: if the call goes
// no-answer or fails, revert the user from call_pending →
// awaiting_call_consent so they can retry by texting YES.
//
// Spec refs: Architect §5.3.

import { parseAndValidateTwilioWebhook } from '@/lib/twilio';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }
  // params.CallStatus = queued|ringing|in-progress|completed|busy|failed|no-answer
  return new Response('OK', { status: 200 });
}
