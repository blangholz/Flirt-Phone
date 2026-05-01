import { z } from 'zod';

// Core env vars required for ANY page to render (Supabase Auth, app URL).
// Service-specific vars (Twilio, Anthropic) are optional here — code paths
// that need them validate on use via requireTwilio/requireAnthropic below.
const serverEnvSchema = z.object({
  // Supabase (required — middleware refreshes session on every request)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Twilio (optional until SMS / voice flows are wired up)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Must be E.164 (e.g. +15551234567)')
    .optional()
    .or(z.literal('')),
  // Anthropic (optional until question generation is invoked)
  ANTHROPIC_API_KEY: z.string().optional(),
  // App (required — referenced by auth callback redirect, OG tags, etc.)
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid server env vars:\n${issues}\nCheck .env.local against .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

const browserEnvSchema = serverEnvSchema.pick({
  NEXT_PUBLIC_SUPABASE_URL: true,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: true,
  NEXT_PUBLIC_APP_URL: true,
});

export type BrowserEnv = z.infer<typeof browserEnvSchema>;

export function getBrowserEnv(): BrowserEnv {
  return browserEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

// --- Service-specific accessors (throw with a clear message when unset) ---

export function requireTwilio(): {
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
} {
  const env = getServerEnv();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    throw new Error(
      'Twilio env vars are not set. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env.local (and Vercel) before using SMS / voice features.',
    );
  }
  return {
    TWILIO_ACCOUNT_SID: env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: env.TWILIO_PHONE_NUMBER,
  };
}

export function requireAnthropic(): { ANTHROPIC_API_KEY: string } {
  const env = getServerEnv();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local (and Vercel) before generating questions.',
    );
  }
  return { ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY };
}
