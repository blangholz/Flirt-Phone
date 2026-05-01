// SMS conversational registration FSM. Pure logic — no DB, no Twilio.
// The route handler is a thin orchestrator that:
//   1. Finds the existing user (or creates one if message matches a slug)
//   2. Calls computeRegistrationOutcome() with the current state + input
//   3. Applies the resulting db updates + sends the reply via TwiML
//
// Spec refs: PDK §5 (Registration), Decisions #2 + #18.

import type { RegistrationStep, UserRow } from '@/lib/db/types';

// ---------------------------------------------------------------------------
// Inputs

export interface IncomingSms {
  body: string;
  mediaUrls: string[]; // empty if no MMS attachment
}

export interface CommunityRef {
  id: string;
  name: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Outcomes — what the orchestrator should do next

// First-touch outcomes (returned by startRegistration / startBareOptInRegistration).
export type FirstTouchOutcome =
  | {
      kind: 'unrecognized';
      reply: string;
    }
  | {
      kind: 'create_user';
      communityId: string;
      reply: string;
      nextStep: RegistrationStep;
    };

export type RegistrationOutcome =
  | FirstTouchOutcome
  | {
      kind: 'update_user';
      userId: string;
      updates: UserUpdate;
      reply: string;
      nextStep: RegistrationStep | null; // null = no step change (validation prompt)
      photoMediaUrl?: string; // present when this turn captured a photo
    }
  | {
      kind: 'duplicate_message';
      reply: null; // already replied to this MessageSid; no-op
    };

export type UserUpdate = Partial<
  Pick<
    UserRow,
    | 'name'
    | 'age'
    | 'gender'
    | 'orientation'
    | 'location'
    | 'interests'
    | 'photo_url'
    | 'last_inbound_message_sid'
  >
>;

// ---------------------------------------------------------------------------
// Public API

// Canonical A2P 10DLC opt-in reply. Sent verbatim when a user texts a
// bare opt-in keyword (FLIRT/JOIN/etc.). Must match the Opt-in Message
// submitted on the Twilio campaign. Carrier-required elements: brand,
// recurring-message disclosure, msg freq, msg&data rates, HELP, STOP.
export const BARE_OPT_IN_REPLY =
  "FlirtPhone: You've been added! You're opted in to recurring SMS — " +
  'msg freq varies, msg&data rates may apply. Reply HELP for help, ' +
  'STOP to cancel. Reply with your first name to join.';

// Bare opt-in path: user texted just FLIRT/JOIN/etc. They've consented;
// drop them straight into the registration flow on the supplied community
// (typically the only/default active community for this Twilio number).
// If no community is available, surface that as an unrecognized outcome.
export function startBareOptInRegistration(
  community: CommunityRef | null,
): FirstTouchOutcome {
  if (!community) {
    return {
      kind: 'unrecognized',
      reply:
        'FlirtPhone: No active communities yet — please try again later, ' +
        'or contact your host.',
    };
  }
  return {
    kind: 'create_user',
    communityId: community.id,
    reply: BARE_OPT_IN_REPLY,
    nextStep: 'awaiting_name',
  };
}

// Slug-based first touch: phone number has no in-progress registration
// and the body looks like (or was prefixed with) a community slug.
export function startRegistration(
  body: string,
  resolveCommunity: (slug: string) => CommunityRef | null,
): FirstTouchOutcome {
  // Bare opt-in keywords are handled by startBareOptInRegistration. If
  // we're called with one here, fall through to the catch-all prompt
  // (callers should route to startBareOptInRegistration first).
  if (isBareOptInKeyword(body)) {
    return {
      kind: 'unrecognized',
      reply: BARE_OPT_IN_REPLY,
    };
  }

  const slug = parseSlug(body);
  if (!slug) {
    return {
      kind: 'unrecognized',
      reply:
        "Hi! Text us your community's code to register " +
        "(e.g., 'brooklyn-yoga'). Ask the host if you don't have one.",
    };
  }
  const community = resolveCommunity(slug);
  if (!community) {
    return {
      kind: 'unrecognized',
      reply: `We couldn't find a community called "${slug}". Double-check the code with your host.`,
    };
  }
  return {
    kind: 'create_user',
    communityId: community.id,
    // First message after opt-in via slug → include compliance disclosure.
    reply:
      `FlirtPhone: Welcome to ${community.name}! You're opted in to ` +
      'recurring SMS — msg freq varies, msg&data rates may apply, reply ' +
      "HELP for help or STOP to cancel. What's your first name?",
    nextStep: 'awaiting_name',
  };
}

// Continuing case: user has an in-progress row at some step.
export function advanceRegistration(
  user: UserRow,
  incoming: IncomingSms,
  messageSid: string,
): RegistrationOutcome {
  // Idempotency — Twilio retries the webhook if we don't 200 quickly.
  if (user.last_inbound_message_sid === messageSid) {
    return { kind: 'duplicate_message', reply: null };
  }

  const body = incoming.body.trim();
  const sidUpdate: UserUpdate = { last_inbound_message_sid: messageSid };

  switch (user.registration_step) {
    case 'awaiting_name': {
      const name = body.slice(0, 80);
      if (name.length < 1) {
        return invalidPrompt(user, sidUpdate, 'What should we call you?');
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, name },
        reply: `Thanks ${name}. How old are you?`,
        nextStep: 'awaiting_age',
      };
    }

    case 'awaiting_age': {
      const age = parseInt(body, 10);
      if (!Number.isFinite(age) || age < 18 || age > 120) {
        return invalidPrompt(
          user,
          sidUpdate,
          'Please reply with your age as a number (18 or older).',
        );
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, age },
        reply: 'Got it. What gender do you identify as? (free text — anything you like)',
        nextStep: 'awaiting_gender',
      };
    }

    case 'awaiting_gender': {
      const gender = body.slice(0, 60);
      if (gender.length < 1) {
        return invalidPrompt(user, sidUpdate, 'What gender do you identify as?');
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, gender },
        reply: 'And your orientation?',
        nextStep: 'awaiting_orientation',
      };
    }

    case 'awaiting_orientation': {
      const orientation = body.slice(0, 60);
      if (orientation.length < 1) {
        return invalidPrompt(user, sidUpdate, 'What is your orientation?');
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, orientation },
        reply: 'Where do you live, or where do you usually hang out?',
        nextStep: 'awaiting_location',
      };
    }

    case 'awaiting_location': {
      const location = body.slice(0, 100);
      if (location.length < 1) {
        return invalidPrompt(user, sidUpdate, 'Where do you live?');
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, location },
        reply:
          'Tell us 3–5 of your interests (comma-separated). ' +
          'These appear on your Rolodex card.',
        nextStep: 'awaiting_interests',
      };
    }

    case 'awaiting_interests': {
      const interests = body.slice(0, 280);
      if (interests.length < 1) {
        return invalidPrompt(user, sidUpdate, 'What are your interests?');
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: { ...sidUpdate, interests },
        reply: 'Last form step — send us a photo of yourself as an MMS.',
        nextStep: 'awaiting_photo',
      };
    }

    case 'awaiting_photo': {
      const mediaUrl = incoming.mediaUrls[0];
      if (!mediaUrl) {
        return invalidPrompt(
          user,
          sidUpdate,
          'Please send a photo as an MMS attachment.',
        );
      }
      return {
        kind: 'update_user',
        userId: user.id,
        updates: sidUpdate, // photo_url set by orchestrator after upload
        reply:
          "Got it. We'll call you in a moment to record a 30-second voice intro. " +
          'Reply YES when you\'re ready.',
        nextStep: 'awaiting_call_consent',
        photoMediaUrl: mediaUrl,
      };
    }

    case 'awaiting_call_consent': {
      if (!/^y(es)?$/i.test(body)) {
        return invalidPrompt(
          user,
          sidUpdate,
          'Reply YES when you\'re ready for the call.',
        );
      }
      // Call placement happens in Milestone 4 (route handler kicks it off).
      return {
        kind: 'update_user',
        userId: user.id,
        updates: sidUpdate,
        reply: "Calling you now…",
        nextStep: 'call_pending',
      };
    }

    case 'call_pending':
    case 'complete': {
      // Already past form input — Milestone 4 handles re-prompts after call.
      return {
        kind: 'update_user',
        userId: user.id,
        updates: sidUpdate,
        reply:
          user.registration_step === 'complete'
            ? `You're already registered as user ${user.assigned_number}. Welcome!`
            : 'Hang tight — we\'ll call you shortly.',
        nextStep: null,
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers

// Opt-in keywords advertised on the Twilio campaign / community signage.
// Sent alone they trigger a "what community?" prompt; sent as a prefix
// (e.g. "FLIRT brooklyn-yoga") they're stripped before slug parsing.
const OPT_IN_KEYWORD_PATTERN = /^(flirt|join|start|signup|hello|hi)$/i;
const OPT_IN_PREFIX_PATTERN = /^(flirt|join|start|signup|hello|hi)\s+/i;

export function isBareOptInKeyword(body: string): boolean {
  return OPT_IN_KEYWORD_PATTERN.test(body.trim());
}

export function parseSlug(body: string): string | null {
  // Accept "brooklyn-yoga" or "<KEYWORD> brooklyn-yoga" (case-insensitive).
  const cleaned = body
    .trim()
    .replace(OPT_IN_PREFIX_PATTERN, '')
    .toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(cleaned)) return null;
  return cleaned;
}

function invalidPrompt(
  user: UserRow,
  sidUpdate: UserUpdate,
  reply: string,
): RegistrationOutcome {
  return {
    kind: 'update_user',
    userId: user.id,
    updates: sidUpdate,
    reply,
    nextStep: null, // stay on the same step
  };
}
