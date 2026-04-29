# FlirtPhone — Build Context

**Project:** Voice-first community dating on a (eventual) physical rotary phone, with a web Rolodex companion.
**Stage:** Build
**Stack:** Next.js (React + Node API routes), Supabase (Postgres, Auth, Storage), Twilio (Voice + SMS/MMS), Anthropic API (question generation), Vercel (hosting), Git/GitHub.

> Full PDK docs live in `docs/`. This file is the distilled context for Claude during build sessions.

---

## What FlirtPhone Is (in one paragraph)

A community signs up for FlirtPhone (a yoga studio, a wedding, a house venue, a party). The admin runs a setup interview; the system generates an event-specific question pool. Members register via Twilio text/MMS — name, photo, age, gender, orientation, location, interests — and finish by getting a Twilio call that asks them one question and records their 30-second answer. The Rolodex (web) shows everyone publicly: photo, name, vital info, voice intro. Users browse the Rolodex, pick someone, go to the phone, dial that person's 3-digit number, and leave a voice message (up to 2 min). That message IS the implicit match request. The recipient gets an SMS ("you have a new message") with NO sender info, goes to the phone, dials their own number, hears the message anonymously. While listening, they can dial 1 to respond (routes back to sender, recipient never learns identity), 2 to replay, or 9 to match. Dial 9 = mutual match, both get each other's contact info via SMS.

---

## Hard Constraints (do not violate)

1. **Profiles are PUBLIC on the Rolodex** — real name, photo, voice intro. Phone number stays private.
2. **Senders know who they're contacting. Recipients do NOT know who sent them a message until they dial 9.**
3. **Sending a voice message = implicit match request.** There is no "just chat" mode.
4. **Mutual match = sender's message + recipient's dial-9.** When recipient dials 9, both parties immediately receive contact info (name + phone) via SMS.
5. **Messaging is turn-based and reactive.** Dial 1 to respond while listening. No threading UI.
6. **Voice messages: 2 min max. Voice intros: 30 sec max, one take, no re-record.**
7. **Registration is two-part:** Twilio SMS conversational form (incl. MMS photo) + Twilio outbound call to record voice intro answering one event-specific question.
8. **Question pool generated per community** by interviewing the admin and using LLM. Different users get different questions from the pool.
9. **Profile refresh:** admin-scheduled (default monthly) or manual; sends new question to all users; replaces current intro.
10. **New-message SMS to recipient says ONLY "You have a new message on FlirtPhone."** No sender info.
11. **Messages are heard at the phone ONLY.** Never on the Rolodex.
12. **The phone interface is the heart of the product.** Website phone in MVP, Raspberry Pi physical phone in production.
13. **Phone state machine MUST be modular** — pure logic, abstracted from audio I/O and dial input — so the Pi port doesn't require rewrites. See `src/phone/`.
14. **One Vercel app, three routes:** `/rolodex`, `/phone`, `/admin`.
15. **Lo-fi early-internet aesthetic** preserved despite public profiles. Anti-dating-app in feel.
16. **SMS scope: US-only for MVP.**
17. **Minimize external dependencies.** Stack listed above is the full set.
18. **Temporary communities** have start + end dates; after end, all interfaces close, but match contact info SMS persist on user phones. Data is dormant, not deleted.
19. **Communities are URL-scoped** by slug: `/rolodex/{community-slug}`.
20. **Admins have metadata access only** — never message audio or content.

---

## Build Order (current focus)

1. Project scaffold (Next.js + Supabase + Vercel + Twilio test number)
2. Database migrations for all entities in `docs/04-Architect.md` §4
3. Admin onboarding + setup interview UI
4. LLM question pool generation (Anthropic API)
5. Admin console (question review, refresh trigger, community status)
6. Twilio inbound SMS conversational registration flow
7. MMS photo upload → Supabase Storage
8. Twilio outbound call → voice intro recording → Supabase Storage
9. Rolodex page (React, public)
10. Phone state machine (pure logic, modular)
11. Web AudioOutput + DOM InputSource implementations
12. Phone modes: Browse, Send Message, Check Messages
13. Dial 1 (respond) → routing back to sender
14. Dial 9 (match) → mutual match logic → SMS contact exchange
15. Profile refresh (scheduled + manual)
16. Community lifecycle (ongoing/temporary, dormancy)

---

## Don't Re-Litigate

The following are settled — do not re-debate during build:

- Public profiles (not anonymous Rolodex)
- Sender = implicit match (not symmetric dial-9)
- Voice-only messages (no text messages between users)
- Phone-only message playback (not web)
- One question per registration (multi-question is Phase 2)
- One photo per profile (galleries are Phase 2)
- Random user numbers, not sequential
- 30-second intros, 2-minute messages, hard caps, no re-record on intro

If you think one of these decisions is wrong: read `docs/02-Decisions-Log.md` for rationale, then surface the concern explicitly — don't silently work around it.

---

## Modular Phone Logic — The Critical Architecture

`src/phone/state-machine.ts` is **pure logic**. It must:
- Have no React, no DOM, no Node fs, no direct API calls
- Receive inputs through an `InputSource` interface
- Emit outputs through an `AudioOutput` interface
- Talk to the backend through a `BackendClient` interface

The web implementation (`src/phone/web-impl/`) provides DOM-based input and WebAudio-based output. The future Pi implementation will provide GPIO-based input and ALSA-based output. The state machine itself does not change.

If during build you find yourself wanting to add a feature that requires state-machine knowledge of the DOM or web environment: **stop**. That's the failure mode this architecture is designed to prevent. Add to the interface, not to the state machine.

---

## Open Items (resolve in first build session)

- [ ] Confirm Supabase Storage for audio (vs. Vercel Blob)
- [ ] Pin menu digit assignments (suggestion: 1=browse, 2=register, 3=check msgs, 4=send msg)
- [ ] Decide auth approach for "check messages" on website phone (likely SMS OTP for first session, then cookie)

---

## References

- Functional Spec: `docs/03-Functional-Spec.md`
- Architect doc: `docs/04-Architect.md`
- Decisions Log (constraint document): `docs/02-Decisions-Log.md`
- Explore notes (background): `docs/01-Explore.md`
