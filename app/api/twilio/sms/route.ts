// Inbound Twilio SMS / MMS webhook — drives the conversational
// registration FSM (Milestone 3).
//
// Flow:
//   1. Validate X-Twilio-Signature.
//   2. Look up an in-progress user by From + status='registering'.
//   3. If none → treat body as a community slug; create users row.
//   4. Otherwise → advance the existing FSM step.
//   5. Apply DB updates + (if MMS) fetch the photo + upload to Storage.
//   6. Reply with TwiML <Message>.
//
// Spec refs: PDK §5, Architect §5.1, Decisions #2 + #18.

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  newMessagingResponse,
  parseAndValidateTwilioWebhook,
  twimlResponse,
} from '@/lib/twilio';
import {
  advanceRegistration,
  isBareOptInKeyword,
  parseSlug,
  startRegistration,
  type CommunityRef,
} from '@/lib/registration/fsm';
import { fetchAndUploadPhoto } from '@/lib/registration/photo-upload';
import { placeVoiceIntroCall } from '@/lib/registration/place-intro-call';
import type { UserInsert } from '@/lib/db/types';

export async function POST(request: Request) {
  const params = await parseAndValidateTwilioWebhook(request);
  if (!params) {
    return new Response('Invalid signature', { status: 403 });
  }

  const from = params['From'];
  const body = (params['Body'] ?? '').trim();
  const messageSid = params['MessageSid'] ?? '';
  const numMedia = parseInt(params['NumMedia'] ?? '0', 10) || 0;
  const mediaUrls: string[] = [];
  for (let i = 0; i < numMedia; i++) {
    const url = params[`MediaUrl${i}`];
    if (url) mediaUrls.push(url);
  }

  if (!from || !messageSid) {
    return new Response('Missing required fields', { status: 400 });
  }

  // CTIA / A2P 10DLC compliance: STOP and HELP must be answered, even if
  // the user has no in-progress registration. Twilio's Advanced Opt-Out
  // typically intercepts these at the Messaging Service level, but we
  // respond here as a backstop so the campaign passes carrier review even
  // if that feature isn't configured on the Messaging Service.
  if (/^(stop|stopall|unsubscribe|cancel|end|quit)$/i.test(body)) {
    return reply(
      'FlirtPhone: You have been unsubscribed and will receive no more ' +
        'messages. Reply START to resubscribe.',
    );
  }
  if (/^(help|info)$/i.test(body)) {
    return reply(
      'FlirtPhone: voice-first community dating. Msg&data rates may apply. ' +
        'Reply STOP to unsubscribe. Support: blangholz@gmail.com',
    );
  }

  const supabase = createSupabaseAdminClient();

  // Find an in-progress registration for this number.
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('phone_number', from)
    .eq('status', 'registering')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No in-progress session — try to interpret as a community slug.
  if (!existingUser) {
    const outcome = startRegistration(body, () => null /* unused below */);
    if (outcome.kind === 'unrecognized') {
      // Bare opt-in keyword? FSM already returned the friendly prompt;
      // skip the community lookup.
      if (isBareOptInKeyword(body)) return reply(outcome.reply);

      // Try the actual lookup with the parsed slug.
      const slug = parseSlug(body);
      if (slug) {
        const { data: community } = await supabase
          .from('communities')
          .select('id, name, slug')
          .eq('slug', slug)
          .eq('status', 'active')
          .maybeSingle();
        if (community) {
          const result = startRegistration(slug, () => community as CommunityRef);
          if (result.kind === 'create_user') {
            const insert: UserInsert = {
              community_id: result.communityId,
              phone_number: from,
              status: 'registering',
              registration_step: result.nextStep,
              last_inbound_message_sid: messageSid,
            };
            await supabase.from('users').insert(insert);
            return reply(result.reply);
          }
        }
      }
      return reply(outcome.reply);
    }
    // Defensive — startRegistration only returns unrecognized | create_user
    return reply('Something went wrong. Try again.');
  }

  // Continuing session — advance the FSM.
  const outcome = advanceRegistration(
    existingUser,
    { body, mediaUrls },
    messageSid,
  );

  if (outcome.kind === 'duplicate_message') {
    // Twilio retried; we already replied. Empty TwiML acknowledges.
    return twimlResponse(newMessagingResponse());
  }

  if (outcome.kind === 'unrecognized') {
    return reply(outcome.reply);
  }

  if (outcome.kind === 'update_user') {
    let updates = { ...outcome.updates };

    // Photo upload happens BEFORE the DB update so we can store photo_url.
    if (outcome.photoMediaUrl) {
      try {
        const { photoUrl } = await fetchAndUploadPhoto({
          mediaUrl: outcome.photoMediaUrl,
          communityId: existingUser.community_id,
          userId: existingUser.id,
        });
        updates = { ...updates, photo_url: photoUrl };
      } catch (err) {
        // Photo failed — don't advance step; tell user to retry.
        return reply(
          `Couldn't save your photo (${
            err instanceof Error ? err.message : 'unknown error'
          }). Try sending it again.`,
        );
      }
    }

    // If FSM advanced to call_pending, place the outbound call BEFORE
    // committing the state change. Failure → keep user on
    // awaiting_call_consent so they can reply YES to retry.
    if (outcome.nextStep === 'call_pending') {
      try {
        await placeVoiceIntroCall({
          userId: existingUser.id,
          toNumber: existingUser.phone_number,
        });
      } catch (err) {
        await supabase.from('users').update(updates).eq('id', existingUser.id);
        return reply(
          `Couldn't reach you for the call (${
            err instanceof Error ? err.message : 'unknown error'
          }). Reply YES to try again.`,
        );
      }
    }

    const stepUpdate =
      outcome.nextStep !== null ? { registration_step: outcome.nextStep } : {};

    await supabase
      .from('users')
      .update({ ...updates, ...stepUpdate })
      .eq('id', existingUser.id);

    return reply(outcome.reply);
  }

  return reply('Something went wrong.');
}

// ---------------------------------------------------------------------------
// Helpers

function reply(message: string): Response {
  const twiml = newMessagingResponse();
  twiml.message(message);
  return twimlResponse(twiml);
}
