import twilio, { twiml as TwilioTwiml } from 'twilio';
import { getServerEnv } from '@/lib/env';

let cachedClient: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return cachedClient;
}

// Validate an inbound webhook against Twilio's X-Twilio-Signature header.
// See: https://www.twilio.com/docs/usage/webhooks/webhooks-security
export function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>,
): boolean {
  if (!signature) return false;
  const env = getServerEnv();
  return twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params);
}

// Parse + validate an inbound Twilio webhook in one shot. Twilio sends
// application/x-www-form-urlencoded bodies and signs them against the
// full request URL.
//
// Returns the parsed params on success, or null on signature mismatch —
// caller should respond with 403 in that case.
export async function parseAndValidateTwilioWebhook(
  request: Request,
): Promise<Record<string, string> | null> {
  const signature = request.headers.get('x-twilio-signature');
  const formData = await request.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = typeof value === 'string' ? value : value.name;
  });
  if (!validateTwilioSignature(signature, request.url, params)) {
    return null;
  }
  return params;
}

// TwiML response builders — re-export for convenience so route handlers
// don't have to import from 'twilio' directly.
export function newVoiceResponse(): TwilioTwiml.VoiceResponse {
  return new TwilioTwiml.VoiceResponse();
}

export function newMessagingResponse(): TwilioTwiml.MessagingResponse {
  return new TwilioTwiml.MessagingResponse();
}

// Wrap a TwiML object in a Web `Response` with the right Content-Type.
export function twimlResponse(twimlObj: { toString: () => string }): Response {
  return new Response(twimlObj.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}
