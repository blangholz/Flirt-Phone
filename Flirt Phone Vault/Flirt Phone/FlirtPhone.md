---
title: "FlirtPhone"
type: project
stage: build
status: active
version: "0.2"
spec_version: "0.2"
started: 2026-04-29
updated: 2026-04-29
description: "Voice-first community dating on a shared rotary phone — public profiles, anonymous senders"
repo: ""
tags:
  - project
  - flirtphone
aliases:
  - "FlirtPhone"
---

# FlirtPhone

> [!abstract] Brief
> FlirtPhone is a physical rotary phone (eventually) and companion web Rolodex that lets people in a community connect romantically through voice. Profiles on the Rolodex are public — real name, photo, age, location, orientation, interests, and a 30-second voice intro answering one event-specific interview question. The sender deliberately picks someone from the Rolodex and leaves a voice message; this is the implicit match request. The recipient hears the message anonymously and can dial 1 to respond, 2 to replay, or 9 to match. Mutual match (sender's message + recipient's dial-9) triggers contact info exchange via SMS.

---

## Key Constraints

*The things Claude must never violate. Curated from [[FlirtPhone - 02 Decisions Log]].*

- **Profiles are public on the Rolodex.** Real name, photo, age, location, orientation, interests, and voice intro are visible to all browsers. Phone number is NOT public.
- **Senders are known to themselves; recipients are blind.** When you pick someone off the Rolodex and leave them a message, you know who they are. They do not know who you are until they dial 9 to match back.
- **Sending a message = implicit match request.** There is no way to message someone without it being a match request. The sender has effectively already "dialed 9" by sending.
- **Matching completes when the recipient dials 9.** At that moment, both parties receive each other's contact info (name + phone) via SMS. The sender's name was already known to themselves, but they now learn the recipient has matched back.
- **Messaging is turn-based and reactive.** No threading. While listening to a message, the recipient can dial 1 to respond, 2 to replay, 9 to match. Responses route back to the sender without the recipient knowing the sender's number. The original sender can also re-initiate from the Rolodex.
- **Registration is two-part:** Twilio text/MMS conversational form (phone, name, age, gender, orientation, interests, photo via MMS) + Twilio outbound call to record 30-sec voice intro answering one interview question. All fields required for MVP.
- **Interview questions are event-specific.** Admin is interviewed about the event/space; system generates a pool of questions; different users get different questions from the pool.
- **Follow-up profile refresh** is admin-controllable: scheduled cadence (default monthly) or manual trigger. New answer replaces old voice intro.
- **Physical signage** prominently features the dial menu and "Dial 9 to Match" branding.
- **MVP is a website version of the phone interface.** Eventual port to Raspberry Pi hardware must be architecturally clean — phone logic kept modular and separate from web layer.
- **SMS scope: US-only for MVP.**
- **Lo-fi aesthetic.** Early-internet, analog feel preserved despite public profiles. Anti-dating-app in vibe — not anti-identity.
- **Minimize external dependencies.** Stack: Supabase, Twilio, Vercel, Git. No Auth0 or extra services unless justified.

---

## Current Focus

→ Build phase begins. Starting with the registration flow (Twilio text/MMS conversational form + outbound call for voice intro). Then Rolodex browsing UI. Then the website phone interface (dial-to-message, voicemail playback, dial 1/2/9 actions). Then matching system (sender = implicit match, recipient dial 9 completes, SMS contact exchange).

---

## Open Questions

*Unresolved items not yet in the Decisions Log.*

- [ ] Audio file storage choice — Supabase Storage vs. Vercel Blob vs. S3 (defer to first build session, pick path of least resistance)
- [ ] Exact menu numbering on phone (which digit for browse vs. register vs. check messages, etc.)
- [ ] Whether to send a "you have a new message" SMS that includes any hint about the sender (currently: no hint at all)

---

## Handoff Notes

**Repository:** *[Create on GitHub, then update repo URL in frontmatter above]*

**At handoff:**
1. Create GitHub repo `flirtphone`
2. Create `docs/` folder; copy stage docs (01 Explore through 04 Architect) into it
3. Place `CLAUDE.md` at repo root
4. Scaffold Node.js + Express backend, React frontend (single Vercel app, two sections: Rolodex and website phone)
5. Set up Supabase project; wire env vars
6. Set up Twilio account; configure phone number for inbound calls + SMS/MMS

**Suggested folder structure:**
```
flirtphone/
├── docs/
│   ├── 01-Explore.md
│   ├── 02-Decisions-Log.md
│   ├── 03-Functional-Spec.md
│   └── 04-Architect.md
├── src/
│   ├── backend/        ← Node.js + Express, phone logic isolated for hardware port
│   ├── frontend/       ← React (Rolodex + website phone)
│   └── shared/
├── CLAUDE.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## Document Registry

- [[FlirtPhone - 01 Explore]]
- [[FlirtPhone - 02 Decisions Log]]
- [[FlirtPhone - 03 Functional Spec]]
- [[FlirtPhone - 04 Architect]]

---

*PDK v1.0 · Index note travels with the project through all stages.*
