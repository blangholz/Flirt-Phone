# FlirtPhone

Voice-first community dating on a (eventual) physical rotary phone, with a web Rolodex companion. Communities (yoga studios, weddings, parties) onboard their members via SMS; members browse the Rolodex, pick someone, and leave a voice message that doubles as a match request. Recipients listen anonymously and dial 9 to match.

Full design lives in [docs/](docs/) — start with [docs/PDK-CLAUDE.md](docs/PDK-CLAUDE.md), then [docs/04-Architect.md](docs/04-Architect.md).

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4
- **Database / Auth (admin) / Storage:** Supabase
- **Voice / SMS / MMS:** Twilio
- **Question generation:** Anthropic API (Claude)
- **Hosting:** Vercel

## Bootstrap

```bash
# 1. Clone and install
npm install

# 2. Copy env template, fill in real values
cp .env.example .env.local

# 3. Link to your Supabase project (one-time)
npx supabase login
npx supabase link --project-ref <your-project-ref>

# 4. Push schema
npx supabase db push

# 5. Run dev server
npm run dev
```

Required env vars (see [.env.example](.env.example) for the canonical list):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (E.164)
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Repo layout

```
app/                  Next.js App Router (pages + API routes)
  api/twilio/         Inbound webhooks: SMS, voice, recording status
  api/admin/          Admin endpoints (Supabase Auth-gated)
phone/                Modular phone state machine (pure logic — Pi-portable)
  state-machine.ts    Core transitions (Architect §6.2)
  interfaces/         AudioOutput, InputSource, BackendClient
lib/                  Shared utilities
  env.ts              zod-validated env access
  supabase/           Server / browser / admin clients
  twilio.ts           Twilio client + signature validation
  anthropic.ts        Claude SDK client
  db/types.ts         Handwritten DB types (replaceable by `supabase gen types`)
supabase/             Postgres schema + config
  migrations/         8 migrations matching Architect §4
  config.toml         Project + auth config
docs/                 PDK stage docs (copied from vault at handoff)
middleware.ts         Supabase Auth session refresh
```

## Conventions

- **Member auth is custom**, not Supabase Auth — phone-verification via Twilio SMS OTP. Admin auth uses Supabase magic-link.
- **Phone state machine is pure logic.** Web/Pi implementations supply `AudioOutput`, `InputSource`, `BackendClient`. The state machine itself imports nothing from React, the DOM, Node, or Next.js.
- **Twilio webhook routes** validate `X-Twilio-Signature` before trusting any field, and dedupe by `MessageSid` / `CallSid` for idempotency.
- **All audio** lives in Supabase Storage at `audio/{community_id}/{intros|messages|responses}/{user_or_message_id}.{ext}`.

## Deploy

```bash
vercel link
vercel env add ...   # mirror every var from .env.local
vercel --prod
```

After first deploy, update `supabase/config.toml`'s `site_url` and `additional_redirect_urls` to the Vercel URL, then `npx supabase config push`.

## Status

Milestone 1 (foundation) complete. See [.claude/plans/](.claude/) for current build state.
