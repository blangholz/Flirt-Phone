import { describe, expect, it } from 'vitest';
import type { UserRow } from '@/lib/db/types';
import {
  advanceRegistration,
  startRegistration,
  type CommunityRef,
} from './fsm';

const community: CommunityRef = {
  id: 'comm-1',
  name: 'Test Studio',
  slug: 'test-studio',
};
const resolveCommunity = (slug: string) =>
  slug === 'test-studio' ? community : null;

function fakeUser(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: 'user-1',
    community_id: 'comm-1',
    phone_number: '+15551234567',
    name: null,
    photo_url: null,
    age: null,
    gender: null,
    orientation: null,
    location: null,
    interests: null,
    assigned_number: null,
    status: 'registering',
    registration_step: 'awaiting_name',
    last_inbound_message_sid: null,
    created_at: '2026-04-30T00:00:00Z',
    ...overrides,
  };
}

const SID_A = 'SMaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const SID_B = 'SMbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

// ---------------------------------------------------------------------------

describe('startRegistration', () => {
  it('creates a user when body matches an active community slug', () => {
    const result = startRegistration('test-studio', resolveCommunity);
    expect(result).toMatchObject({
      kind: 'create_user',
      communityId: 'comm-1',
      nextStep: 'awaiting_name',
    });
    expect(result.kind === 'create_user' && result.reply).toContain('Test Studio');
  });

  it('accepts "START <slug>" form (case insensitive)', () => {
    expect(startRegistration('Start test-studio', resolveCommunity).kind).toBe(
      'create_user',
    );
    expect(startRegistration('START test-studio', resolveCommunity).kind).toBe(
      'create_user',
    );
  });

  it('accepts "FLIRT <slug>" form (the Twilio campaign keyword)', () => {
    expect(startRegistration('FLIRT test-studio', resolveCommunity).kind).toBe(
      'create_user',
    );
    expect(startRegistration('flirt test-studio', resolveCommunity).kind).toBe(
      'create_user',
    );
  });

  it('treats bare FLIRT as an opt-in request and asks for community code', () => {
    const result = startRegistration('FLIRT', resolveCommunity);
    expect(result.kind).toBe('unrecognized');
    expect(result.kind === 'unrecognized' && result.reply).toMatch(
      /community code/i,
    );
  });

  it('treats bare JOIN/HELLO/HI/SIGNUP the same way', () => {
    for (const kw of ['JOIN', 'hello', 'hi', 'SignUp']) {
      const result = startRegistration(kw, resolveCommunity);
      expect(result.kind).toBe('unrecognized');
      expect(result.kind === 'unrecognized' && result.reply).toMatch(
        /community code/i,
      );
    }
  });

  it('returns unrecognized for arbitrary text', () => {
    expect(startRegistration('hello?', resolveCommunity).kind).toBe('unrecognized');
  });

  it('returns unrecognized for unknown slugs', () => {
    expect(
      startRegistration('not-a-real-community', resolveCommunity).kind,
    ).toBe('unrecognized');
  });
});

// ---------------------------------------------------------------------------

describe('advanceRegistration — happy path through form', () => {
  it('awaiting_name → awaiting_age', () => {
    const u = fakeUser({ registration_step: 'awaiting_name' });
    const result = advanceRegistration(u, { body: 'Alex', mediaUrls: [] }, SID_A);
    expect(result).toMatchObject({
      kind: 'update_user',
      updates: { name: 'Alex', last_inbound_message_sid: SID_A },
      nextStep: 'awaiting_age',
    });
  });

  it('awaiting_age accepts a valid number', () => {
    const u = fakeUser({ registration_step: 'awaiting_age' });
    const result = advanceRegistration(u, { body: '29', mediaUrls: [] }, SID_A);
    expect(result).toMatchObject({
      kind: 'update_user',
      updates: { age: 29 },
      nextStep: 'awaiting_gender',
    });
  });

  it('awaiting_age rejects non-numeric', () => {
    const u = fakeUser({ registration_step: 'awaiting_age' });
    const result = advanceRegistration(u, { body: 'twenty', mediaUrls: [] }, SID_A);
    expect(result).toMatchObject({ kind: 'update_user', nextStep: null });
    expect(result.kind === 'update_user' && result.reply).toMatch(/age.*number/i);
  });

  it('awaiting_age rejects under-18', () => {
    const u = fakeUser({ registration_step: 'awaiting_age' });
    const result = advanceRegistration(u, { body: '17', mediaUrls: [] }, SID_A);
    expect(result.kind === 'update_user' && result.nextStep).toBeNull();
  });

  it('awaiting_gender → awaiting_orientation', () => {
    const u = fakeUser({ registration_step: 'awaiting_gender' });
    const result = advanceRegistration(
      u,
      { body: 'nonbinary', mediaUrls: [] },
      SID_A,
    );
    expect(result).toMatchObject({
      kind: 'update_user',
      updates: { gender: 'nonbinary' },
      nextStep: 'awaiting_orientation',
    });
  });

  it('awaiting_photo accepts an MMS attachment and signals upload', () => {
    const u = fakeUser({ registration_step: 'awaiting_photo' });
    const result = advanceRegistration(
      u,
      { body: '', mediaUrls: ['https://api.twilio.com/xxx/Media/MEabc'] },
      SID_A,
    );
    expect(result).toMatchObject({
      kind: 'update_user',
      photoMediaUrl: 'https://api.twilio.com/xxx/Media/MEabc',
      nextStep: 'awaiting_call_consent',
    });
  });

  it('awaiting_photo without an attachment re-prompts', () => {
    const u = fakeUser({ registration_step: 'awaiting_photo' });
    const result = advanceRegistration(
      u,
      { body: 'no thanks', mediaUrls: [] },
      SID_A,
    );
    expect(result).toMatchObject({ kind: 'update_user', nextStep: null });
  });

  it('awaiting_call_consent accepts YES variants', () => {
    const u = fakeUser({ registration_step: 'awaiting_call_consent' });
    expect(
      advanceRegistration(u, { body: 'YES', mediaUrls: [] }, SID_A),
    ).toMatchObject({ nextStep: 'call_pending' });
    expect(
      advanceRegistration(u, { body: 'y', mediaUrls: [] }, SID_A),
    ).toMatchObject({ nextStep: 'call_pending' });
    expect(
      advanceRegistration(u, { body: 'yes!', mediaUrls: [] }, SID_A),
    ).toMatchObject({ nextStep: null }); // 'yes!' has trailing punctuation
  });
});

// ---------------------------------------------------------------------------

describe('advanceRegistration — idempotency', () => {
  it('returns duplicate_message when MessageSid matches the last one', () => {
    const u = fakeUser({
      registration_step: 'awaiting_age',
      last_inbound_message_sid: SID_A,
    });
    const result = advanceRegistration(u, { body: '29', mediaUrls: [] }, SID_A);
    expect(result).toEqual({ kind: 'duplicate_message', reply: null });
  });

  it('processes a different MessageSid normally', () => {
    const u = fakeUser({
      registration_step: 'awaiting_age',
      last_inbound_message_sid: SID_A,
    });
    const result = advanceRegistration(u, { body: '29', mediaUrls: [] }, SID_B);
    expect(result.kind).toBe('update_user');
  });
});

// ---------------------------------------------------------------------------

describe('advanceRegistration — terminal states', () => {
  it('complete users get a welcome-back message with their number', () => {
    const u = fakeUser({
      registration_step: 'complete',
      assigned_number: 137,
    });
    const result = advanceRegistration(u, { body: 'hi', mediaUrls: [] }, SID_A);
    expect(result).toMatchObject({ kind: 'update_user', nextStep: null });
    expect(result.kind === 'update_user' && result.reply).toContain('137');
  });

  it('call_pending users get a "hang tight" message', () => {
    const u = fakeUser({ registration_step: 'call_pending' });
    const result = advanceRegistration(u, { body: 'hello', mediaUrls: [] }, SID_A);
    expect(result.kind === 'update_user' && result.reply).toMatch(
      /hang tight|call/i,
    );
  });
});
