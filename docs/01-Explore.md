---
title: "FlirtPhone — Explore"
type: project-doc
stage: explore
status: complete
project: "FlirtPhone"
date: 2026-04-29
tags:
  - pdk/explore
  - flirtphone
aliases:
  - "FlirtPhone Explore"
---

# FlirtPhone — Explore
*Stage 1 · Explore Session · 2026-04-29*

> [!abstract] Summary
> FlirtPhone is a community dating system built around a physical rotary phone and a companion web Rolodex. It's designed for community spaces (like a yoga studio or house music venue) and one-off events (parties, weddings). Profiles are public — real name, photo, voice intro — but the *sender* of a voice message stays anonymous to the recipient until they dial 9 to match back.

---

## Session Prompt

> [!example] Pasted to start the Explore session
> I want to explore an idea for a new project. I'll describe what I'm thinking, and I'd like you to help me flush it out — ask questions, poke at the edges, and help me figure out what this thing really is. I'm not looking for a spec yet, just exploration. Here's what I'm thinking: FlirtPhone — a physical rotary phone for community spaces and parties.

---

## Territory Covered

### The Core Idea
- A physical rotary phone in a community space or party that functions as a self-contained voice-first dating system
- Companion web Rolodex for browsing profiles
- Public profiles (name + photo + voice intro), but senders of voice messages stay anonymous to recipients until mutual match
- Voice-first — all messaging is voice, all asynchronous
- Lo-fi, anti-dating-app aesthetic; early-internet vibes

### The People
- **End users:** People in a defined community or attending a defined event
- **Admin/Host:** Sets up the FlirtPhone, defines the community type, gets interviewed about the event to generate question pool
- **Future:** Multi-phone communities spanning multiple physical locations (e.g., yoga studio + party house)

### The Workflow
- Host sends out a registration link via text to the community
- Each person registers via Twilio text conversation: provides phone, name, age, gender, orientation, interests, and a photo (via MMS)
- After form fields, system asks consent to call to record voice intro
- Twilio calls the user, asks one question from the event-specific pool, records 30-sec answer, hangs up
- User now appears on the Rolodex with full public profile + voice intro
- Other users browse the Rolodex, find someone interesting, pick up the FlirtPhone (or website phone for testing), dial that person's 3-digit number, and leave a voice message (up to 2 min)
- Sending the message is the sender's implicit match request
- The recipient gets an SMS notification: "you have a new message on FlirtPhone." No identifying info about the sender.
- Recipient goes to the phone, dials their own number to check messages, hears the voicemail
- While listening, recipient can: dial 1 to respond (loops back to sender anonymously), dial 2 to replay, dial 9 to match
- Dial 9 → mutual match achieved → both parties receive contact info (name + phone) via SMS instantly
- Conversations are turn-based and reactive — you respond to what you receive

### The Edges
- Browse mode should be immediately engaging even for non-registered passersby — pick up the phone, hear voices, get drawn in
- Registration must work entirely via text/MMS where possible (fall back to web form only if MMS fails for photos)
- The website phone (testing version) is temporary — it will be replaced by Raspberry Pi hardware later
- Software must be modular so the port to hardware doesn't require rewrites

### What This Is NOT
- Not a profile-matching algorithm. No swiping. No "compatibility scores."
- Not a polished dating app. Lo-fi, analog, weird-on-purpose.
- Not anonymous on the profile side — names and photos are public
- Not real-time. All communication is asynchronous voicemail-style.

### Constraints (already known)
- US-only SMS for MVP
- Eventual hardware: Raspberry Pi running rotary phone
- Self-managed phone — no physical attendant; phone explains itself when picked up
- Minimize external service dependencies

---

## Discovery Research Notes

> [!info] Reference points
> - **36 Questions That Lead to Love** — Arthur Aron's research on accelerating intimacy via structured questioning. Reference for the interview question pool design.
> - **Speed dating research** — questions that surface personality and chemistry quickly. Useful for question framing.
> - **Voicemail / answering machine UX** — the spiritual ancestor of the messaging flow. The "leave a message after the tone" cadence is a deliberate aesthetic choice.

---

## Key Insights from the Conversation

1. **Public profiles + anonymous senders is a clever asymmetry.** It protects recipients from being approached by people they wouldn't want to engage with (since the sender saw the profile and chose deliberately), while preserving the thrill of mystery on the recipient side.

2. **Sending = match request** simplifies the matching mechanic significantly. The original framing had both parties dialing 9; the new framing has only the recipient needing to. This is cleaner and more intuitive.

3. **Turn-based reactive messaging** (dial 1 to respond while listening) eliminates the need for threading or message inboxes per-sender. Each message is its own atomic interaction.

4. **Event-specific question pools** are what make the voice intros interesting. Without them, intros become "hi I'm Sarah and I like hiking." With them, the *event itself* is part of the experience.

5. **The physical phone is the point.** The website phone is scaffolding for testing UX. The real product is a rotary phone in a hallway or bathroom that you pick up and feel like you've stumbled into something.

---

## Exit Check

**1. In two sentences: what is this thing and why does it exist?**

→ FlirtPhone is a voice-first dating system on a physical rotary phone (with a companion web Rolodex) for use in defined communities and events. It exists to create romantic connection within a community in a way that feels playful, intimate, and physically rooted — not algorithmic or app-like.

**2. Top open items going into Define:**

- [x] Registration flow specifics (text-only? photo upload mechanism? voice recording mechanism?)
- [x] Interview question generation strategy
- [x] Follow-up question cadence and mechanism
- [x] Physical signage and onboarding for someone who's never seen the phone
- [x] Tech stack and integration choices (deferred to Architect)
- [x] What happens to data after a temporary event ends

---

*Stage 1 complete → [[FlirtPhone - 02 Decisions Log]]*
