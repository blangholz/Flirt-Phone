import Anthropic from '@anthropic-ai/sdk';
import { requireAnthropic } from '@/lib/env';

let cachedClient: Anthropic | null = null;

export function getAnthropicClient() {
  if (cachedClient) return cachedClient;
  const env = requireAnthropic();
  cachedClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return cachedClient;
}
