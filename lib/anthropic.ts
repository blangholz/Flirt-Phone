import Anthropic from '@anthropic-ai/sdk';
import { getServerEnv } from '@/lib/env';

let cachedClient: Anthropic | null = null;

export function getAnthropicClient() {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}
