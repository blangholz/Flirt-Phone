import twilio from 'twilio';
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
