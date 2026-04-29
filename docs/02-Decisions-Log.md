---
title: "FlirtPhone — Decisions Log"
type: project-doc
stage: decisions-log
status: active
project: "FlirtPhone"
date: 2026-04-29
updated: 2026-04-29
tags:
  - pdk/decisions
  - flirtphone
aliases:
  - "FlirtPhone Decisions"
---

# FlirtPhone — Decisions Log
*Started 2026-04-29 · Last updated 2026-04-29*

> [!abstract] How to Use
> This log captures every significant decision made across all stages of the project. **In an AI-assisted build workflow, this document is also a constraint document.** Hand it to Claude at the start of a build session — it tells Claude: *"these things are already decided, don't re-litigate them."*

> [!info] Decision Statuses
> - `decided` — resolved, locked in
> - `deferred` — consciously parked for a later phase, with a reason
> - `open` — not yet resolved, needs attention
> - `superseded` — changed after being decided; old decision preserved for reference

---

## Confirmed Decisions Summary

| # | Topic | Decision |
|---|-------|----------|
| 1 | Physical phone count | One shared phone for MVP. Architecture allows for multi-phone communities later. |
| 2 | Registration channel | Twilio text conversation for form fields + photo (MMS) + outbound call for voice intro. Web form fallback only if MMS fails. |
| 3 | Profile public fields | Real name, photo, age, location, gender, orientation, interests, voice intro. All required. Phone number NOT public. |
| 4 | Profile anonymity model (SUPERSEDED → see #18) | ~~Profiles fully anonymous; identity revealed only on mutual match.~~ |
| 5 | User numbering | System-assigned, random, unique 3-digit numbers. |
| 6 | Voice intro length | 30 seconds maximum. Submit on first take — no re-record. |
| 7 | Voice message length | 2 minutes maximum. |
| 8 | Voice intro generation | Each user is asked ONE question from a pool generated based on event context. Different users get different questions from the pool. |
| 9 | Question pool generation | Admin is interviewed during FlirtPhone setup (5 min for events, 15 min for ongoing communities). System generates a question pool based on event/space context. Admin reviews all potential questions and approves the pool. |
| 10 | Matching mechanic (SUPERSEDED → see #19) | ~~Both parties dial 9 to match. When both have dialed 9 for each other, contact info is exchanged via SMS.~~ |
| 11 | Match payload | Name + phone number only. No email, social media, etc. |
| 12 | Message inbox UX | Voicemail-style. While listening to a message, dial 1 to respond, 2 to replay, 9 to match. No threading. |
| 13 | New message notification | SMS to recipient: "You have a new message on FlirtPhone." NO identifying info about the sender. |
| 14 | Where messages are heard | Physical phone (or website phone in testing) ONLY. Cannot listen via the Rolodex/web. |
| 15 | Profile refresh | Admin can set scheduled cadence (default monthly) or trigger manually. New SMS asks user to record a new answer via Twilio call. New answer replaces old voice intro. |
| 16 | Refresh scope | Refresh sends a new question to ALL users in the community simultaneously. |
| 17 | Community lifecycle | Admin chooses ongoing or temporary at setup. Temporary requires start + end date. After temporary closure, phone system and Rolodex inaccessible, but users keep contact info from matches via SMS. Data is dormant, not deleted — can be reactivated for a future event. |
| 18 | Profile public model (NEW, supersedes #4) | Real name and photo are PUBLIC on the Rolodex. Senders of messages know who they're contacting. Recipients do NOT know who messaged them until they dial 9 to match back. |
| 19 | Matching mechanic (NEW, supersedes #10) | Sending a voice message IS the implicit match request. Only the recipient needs to dial 9 to complete the match. Mutual match (sender's message + recipient's dial-9) triggers SMS contact exchange to both parties. |
| 20 | Response routing | When recipient dials 1 to respond while listening, system routes the response back to the sender without revealing the sender's identity to the recipient. |
| 21 | SMS scope | US-only for MVP. International deferred. |
| 22 | Tech stack | Node.js + Express backend; React frontend; Supabase (DB + auth); Twilio (calls + SMS/MMS); Vercel (hosting); Git (version control). |
| 23 | Hardware port modularity | Phone interface logic must be kept separate from web layer to enable clean Raspberry Pi port without rewrites. |
| 24 | App architecture | One Vercel app, two sections: Rolodex and website phone. |
| 25 | Stagnant profile refresh | DEFERRED to Phase 2 — auto-detect underperforming profiles and prompt refresh. |
| 26 | Interview-style registration with multiple questions | DEFERRED to Phase 2 — for MVP, one question per registration. |
| 27 | Astrology / birth date / location for cosmic matching | DEFERRED to Phase 2. |
| 28 | Paper Rolodex physical signage | DEFERRED to Phase 2. For MVP: simple laminated card with menu options + "Dial 9 to Match" branding. |
| 29 | Multi-phone cross-location communities | DEFERRED to Phase 2. |
| 30 | Sender-side notification when recipient dials 9 (without contact info) | OPEN — for now, no separate notification; both parties just receive the contact info SMS at match completion. |

---

## Full Decision Log

### Decision #1
**Topic:** Physical phone count for MVP
**Question:** Should there be one shared phone or multiple phones in the community?
**Decision:** One shared phone for MVP. Architecture allows multiple phones to connect a single community later (e.g., one at the yoga studio, one at a party venue).
**Rationale:** Simplest viable starting point. Multi-phone is interesting for scaling but adds significant complexity to data model and routing.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #2
**Topic:** Registration channel
**Question:** Where does registration happen — phone, web form, text, or hybrid?
**Decision:** Twilio text conversation for form fields and photo upload (via MMS) + Twilio outbound call to record voice intro. Fall back to web form link only if MMS upload fails.
**Rationale:** Keeps the entire onboarding in the phone-native channel. Calling the user to record their intro also gets them familiar with the FlirtPhone interface before they ever touch the physical phone.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #3
**Topic:** What's public on a profile
**Question:** Which user fields are visible on the Rolodex?
**Decision:** Real name, photo, age, location, gender, orientation, interests, voice intro. All required. Phone number is NOT public.
**Rationale:** Public identification is what makes the sender's choice meaningful and the recipient's anonymity protected. Phone number stays private to prevent off-platform contact before mutual match.
**Status:** `decided`
**Phase decided:** Define (revised post-Architect — see Decision #18)

---

### Decision #4 (SUPERSEDED)
**Topic:** Profile anonymity
**Question:** Are profiles anonymous on the Rolodex?
**Decision:** Profiles fully anonymous. Identity revealed only when both parties dial 9 to match.
**Rationale:** Original concept emphasized mystery and surprise.
**Status:** `superseded` by Decision #18
**Phase decided:** Define
**Superseded:** Architect (final pass)

---

### Decision #5
**Topic:** User numbering on the phone system
**Question:** How are user numbers assigned?
**Decision:** System-assigned, random, unique 3-digit numbers.
**Rationale:** Short numbers are easy to dial on a rotary phone. Random (not sequential) avoids implying order or popularity.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #6
**Topic:** Voice intro length
**Question:** How long can a voice intro be?
**Decision:** 30 seconds maximum. Submit on first take, no re-record.
**Rationale:** Short enough to keep browsing engaging; first-take constraint matches the lo-fi authenticity ethos.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #7
**Topic:** Voice message length
**Question:** How long can a voice message between users be?
**Decision:** 2 minutes maximum.
**Rationale:** Long enough for substantive messages, short enough to keep things from getting one-sided.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #8
**Topic:** Voice intro source
**Question:** Is the intro a free-form recording or an answer to a question?
**Decision:** Each user is asked ONE question from a pool generated based on event context. They record their 30-second answer.
**Rationale:** Removes the awkwardness of "introduce yourself." Question creates structure and surfaces personality. Different questions across users keeps the Rolodex varied.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #9
**Topic:** Question pool generation
**Question:** Where do the interview questions come from?
**Decision:** Admin is interviewed at setup (5 min for events, 15 min for ongoing spaces) to surface event/space context. System generates a pool of relevant questions. Admin reviews all potential questions and approves the pool. Different users get different questions from the pool.
**Rationale:** Event-specific questions are what make voice intros interesting and contextual. Admin oversight ensures questions match the vibe.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #10 (SUPERSEDED)
**Topic:** Matching mechanic
**Question:** How do users match?
**Decision:** Both parties dial 9 to match. When both have dialed 9 for each other, contact info exchanged via SMS.
**Rationale:** Symmetric mutual consent.
**Status:** `superseded` by Decision #19
**Phase decided:** Define
**Superseded:** Architect (final pass)

---

### Decision #11
**Topic:** Match payload
**Question:** What information is exchanged on match?
**Decision:** Name + phone number only.
**Rationale:** Minimum viable info to continue the conversation off-platform. Users can share more themselves once connected.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #12
**Topic:** Message inbox UX
**Question:** How does a user navigate their messages on the phone?
**Decision:** Voicemail-style. Messages play in order. While listening, dial 1 to respond, 2 to replay, 9 to match. No threading.
**Rationale:** Voicemail metaphor is universally understood and matches the lo-fi aesthetic. Reactive in-the-moment dialing keeps the interaction simple and embodied.
**Status:** `decided`
**Phase decided:** Define / Architect (refined when matching mechanic changed)

---

### Decision #13
**Topic:** New message notification
**Question:** What does the recipient know when a new message arrives?
**Decision:** SMS notification: "You have a new message on FlirtPhone." NO identifying info about the sender.
**Rationale:** Preserves the recipient-side anonymity that's core to the experience.
**Status:** `decided`
**Phase decided:** Architect (refined for new model)

---

### Decision #14
**Topic:** Where messages are listened to
**Question:** Can users listen to messages on the website?
**Decision:** Phone only (physical phone in production; website phone in testing). Messages cannot be heard via the Rolodex.
**Rationale:** Drives in-person engagement. The phone is the experience.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #15
**Topic:** Profile refresh mechanism
**Question:** How are voice intros kept fresh over time?
**Decision:** Admin can set scheduled cadence (default monthly) or trigger manually. Refresh sends users an SMS asking them to record a new answer via Twilio outbound call. New answer replaces old voice intro.
**Rationale:** Stale intros kill engagement. Admin control respects different community cadences.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #16
**Topic:** Refresh scope
**Question:** Does the refresh affect everyone or only some users?
**Decision:** All users in the community get a new question simultaneously.
**Rationale:** Simpler to implement; creates a community-wide refresh moment.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #17
**Topic:** Community lifecycle
**Question:** What happens when a community/event ends?
**Decision:** Admin sets ongoing or temporary at setup. Temporary has start + end dates. After end date, phone system and Rolodex inaccessible, but match contact info SMS persist on user phones. Data is dormant (NOT deleted) and can be reactivated for a future event.
**Rationale:** Most communities run multiple events. Dormant-but-recoverable data lets returning users reactivate their profile rather than re-register from scratch.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #18 (NEW — supersedes #4)
**Topic:** Profile public model
**Question:** Are profiles anonymous on the Rolodex, or do they show real identity?
**Decision:** Real name and photo are PUBLIC on the Rolodex. Senders see who they're contacting and pick deliberately. Recipients do NOT know who messaged them until they dial 9 to match back.
**Rationale:** This asymmetric model is more interesting than full anonymity. Senders take ownership of the choice ("I picked you specifically"), while recipients retain the thrill of mystery and the safety of not being approached by someone they wouldn't engage with. Aesthetic principle (lo-fi, anti-app) is preserved through visual style and voice-first messaging, not through hiding identity.
**Status:** `decided`
**Phase decided:** Architect (final pass)

---

### Decision #19 (NEW — supersedes #10)
**Topic:** Matching mechanic
**Question:** How do users match given the new public profile model?
**Decision:** Sending a voice message IS the implicit match request. The sender has effectively "dialed 9" by sending. Only the recipient needs to dial 9 to complete the match. When recipient dials 9, mutual match completes and both parties receive contact info (name + phone) via SMS.
**Rationale:** Cleaner than symmetric dial-9. Matches the asymmetric anonymity model. The act of choosing someone off the Rolodex and recording a 2-minute message is already a strong signal of intent.
**Status:** `decided`
**Phase decided:** Architect (final pass)

---

### Decision #20 (NEW)
**Topic:** Response routing
**Question:** How does the recipient respond without learning the sender's identity?
**Decision:** When recipient dials 1 to respond while listening to a message, the system records their response and routes it to the sender via the original message's metadata. Recipient never sees or hears the sender's number/name.
**Rationale:** Keeps anonymity intact during turn-based exchange. Sender is identified to themselves; recipient stays blind until they dial 9.
**Status:** `decided`
**Phase decided:** Architect (final pass)

---

### Decision #21
**Topic:** SMS scope
**Question:** Does FlirtPhone support international SMS?
**Decision:** US-only for MVP.
**Rationale:** Keeps Twilio config simple, avoids regulatory complexity for first launch.
**Status:** `decided`
**Phase decided:** Define

---

### Decision #22
**Topic:** Tech stack
**Question:** What technologies will FlirtPhone be built with?
**Decision:** Node.js + Express (backend); React (frontend); Supabase (DB + auth); Twilio (calls + SMS/MMS); Vercel (hosting); Git (version control).
**Rationale:** Familiar to operator, minimal external dependencies, well-supported, scales to production.
**Status:** `decided`
**Phase decided:** Architect

---

### Decision #23
**Topic:** Hardware port modularity
**Question:** How do we ensure the eventual port from website phone to Raspberry Pi doesn't require rewrites?
**Decision:** Phone interface logic kept strictly separate from web UI layer. Phone state machine and audio I/O abstracted behind interfaces so the Pi version can swap implementations.
**Rationale:** Operator's biggest concern was wasted effort during port. Modularity is the mitigation.
**Status:** `decided`
**Phase decided:** Architect

---

### Decision #24
**Topic:** App architecture
**Question:** Are the Rolodex and the website phone separate apps?
**Decision:** One Vercel deployment, two sections: Rolodex (`/` or `/rolodex`) and website phone (`/phone`).
**Rationale:** Simpler to deploy and manage. Separation is at the route level, not deployment level.
**Status:** `decided`
**Phase decided:** Architect

---

## Deferred Items

| # | Topic | Deferred Until | Reason |
|---|-------|----------------|--------|
| 25 | Stagnant profile refresh nudges | Phase 2 | MVP just needs scheduled + manual refresh |
| 26 | Multi-question registration interviews | Phase 2 | One question per user is sufficient for MVP |
| 27 | Astrology / cosmic matching | Phase 2 | Cool, not critical |
| 28 | Paper Rolodex physical signage | Phase 2 | Laminated card is enough for MVP |
| 29 | Multi-phone cross-location communities | Phase 2 | Architecture allows but not built yet |
| 30 | Sender-side notification when recipient dials 9 (without contact info) | Open | Decide based on testing — currently no separate ping |

---

## Open Items

> [!warning] These should be resolved before or during the first build session.

- [ ] Audio file storage choice — Supabase Storage vs. Vercel Blob vs. S3 (pick path of least resistance in first build session)
- [ ] Exact menu numbering on phone (which digit for browse vs. register vs. check messages)
- [ ] Whether new-message SMS should give any hint about the sender (currently: no hint)

---

*This document travels with the project. Keep it current as decisions evolve.*
*→ [[FlirtPhone - 03 Functional Spec]]*
