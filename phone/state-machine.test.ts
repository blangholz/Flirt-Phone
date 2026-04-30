import { beforeEach, describe, expect, it } from 'vitest';
import { PhoneStateMachine, type State } from './state-machine';
import type { AudioOutput } from './interfaces/audio-output';
import type {
  BackendClient,
  MatchResult,
  MessageSummary,
  VoiceIntroSummary,
} from './interfaces/backend-client';
import type { InputSource, PhoneInputEvent } from './interfaces/input-source';
import { prompts } from './prompts';

// ---------------------------------------------------------------------------
// Test fakes

class FakeAudio implements AudioOutput {
  calls: string[] = [];
  async playPrompt(text: string) {
    this.calls.push(`prompt:${text}`);
  }
  async playRecording(url: string) {
    this.calls.push(`recording:${url}`);
  }
  async playBeep() {
    this.calls.push('beep');
  }
  async stop() {
    this.calls.push('stop');
  }
  lastPrompt(): string | undefined {
    const last = [...this.calls].reverse().find((c) => c.startsWith('prompt:'));
    return last?.slice('prompt:'.length);
  }
}

class FakeInput implements InputSource {
  recordingActive = false;
  startCalls: number[] = [];
  stopCalls = 0;
  onEvent(_handler: (event: PhoneInputEvent) => void) {
    return () => {};
  }
  startRecording(maxDurationSeconds: number) {
    this.recordingActive = true;
    this.startCalls.push(maxDurationSeconds);
  }
  stopRecording() {
    this.stopCalls += 1;
    this.recordingActive = false;
  }
}

class FakeBackend implements BackendClient {
  voiceIntros: VoiceIntroSummary[] = [];
  inbox: MessageSummary[] = [];
  resolveByNumber = new Map<number, { userId: string }>();
  matchOutcomes = new Map<string, MatchResult>();

  uploadedMessages: Array<Parameters<BackendClient['uploadMessage']>[0]> = [];
  recordedResponses: Array<Parameters<BackendClient['recordResponse']>[0]> = [];
  matchCalls: string[] = [];
  markedListened: string[] = [];

  async listVoiceIntros() {
    return this.voiceIntros;
  }
  async resolveByAssignedNumber({ assignedNumber }: { assignedNumber: number }) {
    return this.resolveByNumber.get(assignedNumber) ?? null;
  }
  async uploadMessage(args: Parameters<BackendClient['uploadMessage']>[0]) {
    this.uploadedMessages.push(args);
    return { messageId: `msg-${this.uploadedMessages.length}` };
  }
  async fetchInbox(_userId: string) {
    return this.inbox;
  }
  async markListened(messageId: string) {
    this.markedListened.push(messageId);
  }
  async recordResponse(args: Parameters<BackendClient['recordResponse']>[0]) {
    this.recordedResponses.push(args);
  }
  async match(messageId: string) {
    this.matchCalls.push(messageId);
    return this.matchOutcomes.get(messageId) ?? { matched: true };
  }
}

const recordingDoneEvent: PhoneInputEvent = {
  kind: 'recordingDone',
  blob: new Blob(['fake-audio']),
  durationSeconds: 30,
};

// ---------------------------------------------------------------------------
// Setup

interface Harness {
  sm: PhoneStateMachine;
  audio: FakeAudio;
  input: FakeInput;
  backend: FakeBackend;
}

function setup(opts: { senderUserId?: string } = {}): Harness {
  const audio = new FakeAudio();
  const input = new FakeInput();
  const backend = new FakeBackend();
  const sm = new PhoneStateMachine({
    audio,
    input,
    backend,
    communitySlug: 'test-studio',
    senderUserId: opts.senderUserId,
  });
  return { sm, audio, input, backend };
}

// ---------------------------------------------------------------------------
// Tests

describe('PhoneStateMachine — global behavior', () => {
  it('starts in idle', () => {
    const { sm } = setup();
    expect(sm.getState().mode).toBe('idle');
  });

  it('pickup transitions to menu and plays greeting', async () => {
    const { sm, audio } = setup();
    await sm.dispatch({ kind: 'pickup' });
    expect(sm.getState().mode).toBe('menu');
    expect(audio.lastPrompt()).toBe(prompts.greeting);
  });

  it('hangup from any state returns to idle', async () => {
    const { sm, input } = setup({ senderUserId: 'u1' });
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    expect(sm.getState().mode).toBe('sendEnterNumber');

    await sm.dispatch({ kind: 'hangup' });
    expect(sm.getState().mode).toBe('idle');
    expect(input.stopCalls).toBeGreaterThanOrEqual(1);
  });

  it('ignores dial events while idle', async () => {
    const { sm } = setup();
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    expect(sm.getState().mode).toBe('idle');
  });

  it('menu re-prompts on unknown digit', async () => {
    const { sm, audio } = setup();
    await sm.dispatch({ kind: 'pickup' });
    audio.calls = [];
    await sm.dispatch({ kind: 'dialDigit', digit: '7' });
    expect(audio.calls).toContain(`prompt:${prompts.unknownDigit}`);
    expect(sm.getState().mode).toBe('menu');
  });
});

describe('PhoneStateMachine — browse mode', () => {
  const intros: VoiceIntroSummary[] = [
    { userId: 'u1', assignedNumber: 137, audioUrl: 'a1.m4a', questionText: 'Q1' },
    { userId: 'u2', assignedNumber: 248, audioUrl: 'a2.m4a', questionText: 'Q2' },
  ];

  it('digit 1 from menu enters browse and plays first intro', async () => {
    const { sm, backend, audio } = setup();
    backend.voiceIntros = intros;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    const state = sm.getState();
    expect(state.mode).toBe('browseIntroPlaying');
    expect(audio.calls).toContain('recording:a1.m4a');
  });

  it('returns to menu when no intros exist', async () => {
    const { sm, audio } = setup();
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    expect(audio.calls).toContain(`prompt:${prompts.browseEmpty}`);
    expect(sm.getState().mode).toBe('menu');
  });

  it('# advances to next intro, then ends gracefully', async () => {
    const { sm, backend, audio } = setup();
    backend.voiceIntros = intros;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect(audio.calls).toContain('recording:a2.m4a');
    expect((sm.getState() as Extract<State, { mode: 'browseIntroPlaying' }>).index).toBe(1);

    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect(audio.calls).toContain(`prompt:${prompts.browseEnd}`);
    expect(sm.getState().mode).toBe('menu');
  });

  it('0 returns to menu', async () => {
    const { sm, backend } = setup();
    backend.voiceIntros = intros;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '0' });
    expect(sm.getState().mode).toBe('menu');
  });

  it('dial 9 without senderUserId blocks send and returns to menu', async () => {
    const { sm, backend, audio } = setup(); // no senderUserId
    backend.voiceIntros = intros;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(audio.calls).toContain(`prompt:${prompts.sendMessageNotAuthenticated}`);
    expect(sm.getState().mode).toBe('menu');
  });

  it('dial 9 with senderUserId starts countdown and recording', async () => {
    const { sm, backend, input } = setup({ senderUserId: 'sender' });
    backend.voiceIntros = intros;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(sm.getState().mode).toBe('sendRecording');
    expect(input.startCalls).toEqual([120]);
  });
});

describe('PhoneStateMachine — send message mode', () => {
  it('blocks unauthenticated senders at menu', async () => {
    const { sm, audio } = setup();
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    expect(audio.calls).toContain(`prompt:${prompts.sendMessageNotAuthenticated}`);
    expect(sm.getState().mode).toBe('menu');
  });

  it('collects 3 digits, resolves recipient, starts recording', async () => {
    const { sm, backend, input } = setup({ senderUserId: 'sender' });
    backend.resolveByNumber.set(248, { userId: 'recipient' });
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '2' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '8' });
    expect(sm.getState().mode).toBe('sendRecording');
    expect(input.startCalls).toEqual([120]);
  });

  it('on invalid number, plays error and resets digit buffer', async () => {
    const { sm, backend, audio } = setup({ senderUserId: 'sender' });
    // No resolveByNumber entry — backend returns null
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(audio.calls).toContain(`prompt:${prompts.sendMessageRecipientNotFound('999')}`);
    expect(sm.getState()).toEqual({ mode: 'sendEnterNumber', digits: '' });
  });

  it('# during recording stops capture; upload completes; returns to menu', async () => {
    const { sm, backend, input } = setup({ senderUserId: 'sender' });
    backend.resolveByNumber.set(248, { userId: 'recipient' });
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '2' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '8' });

    // Simulate user pressing # to end recording
    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect(input.stopCalls).toBe(1);

    // Driver fires recordingDone after stop
    await sm.dispatch(recordingDoneEvent);
    expect(backend.uploadedMessages).toHaveLength(1);
    expect(backend.uploadedMessages[0]).toMatchObject({
      senderUserId: 'sender',
      recipientUserId: 'recipient',
      durationSeconds: 30,
    });
    expect(sm.getState().mode).toBe('menu');
  });

  it('0 with empty digit buffer returns to menu', async () => {
    const { sm } = setup({ senderUserId: 'sender' });
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '4' });
    await sm.dispatch({ kind: 'dialDigit', digit: '0' });
    expect(sm.getState().mode).toBe('menu');
  });
});

describe('PhoneStateMachine — check messages mode', () => {
  const inbox: MessageSummary[] = [
    { messageId: 'm1', audioUrl: 'msg1.m4a', durationSeconds: 45 },
    { messageId: 'm2', audioUrl: 'msg2.m4a', durationSeconds: 60 },
  ];

  it('authenticates by 3-digit number, fetches inbox, plays first', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '3' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '3' });
    await sm.dispatch({ kind: 'dialDigit', digit: '7' });

    expect(sm.getState().mode).toBe('checkPlaying');
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesIncoming}`);
    expect(audio.calls).toContain('recording:msg1.m4a');
    expect(backend.markedListened).toContain('m1');
  });

  it('failed auth resets and retries', async () => {
    const { sm, audio } = setup();
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '3' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesAuthFailed}`);
    expect(sm.getState()).toEqual({ mode: 'checkAuth', digits: '' });
  });

  it('empty inbox returns to menu', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    // no messages
    await sm.dispatch({ kind: 'pickup' });
    await sm.dispatch({ kind: 'dialDigit', digit: '3' });
    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    await sm.dispatch({ kind: 'dialDigit', digit: '3' });
    await sm.dispatch({ kind: 'dialDigit', digit: '7' });
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesEmpty}`);
    expect(sm.getState().mode).toBe('menu');
  });

  it('dial 1 records a response, # stops, upload runs, advances', async () => {
    const { sm, backend, input } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    await authenticateAndPlay(sm);

    await sm.dispatch({ kind: 'dialDigit', digit: '1' });
    expect(sm.getState().mode).toBe('checkRecordingResponse');
    expect(input.startCalls[0]).toBe(120);

    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect(input.stopCalls).toBe(1);
    await sm.dispatch(recordingDoneEvent);
    expect(backend.recordedResponses).toHaveLength(1);
    expect(backend.recordedResponses[0]?.messageId).toBe('m1');
    // Should have advanced to the second message
    expect(sm.getState().mode).toBe('checkPlaying');
    expect((sm.getState() as Extract<State, { mode: 'checkPlaying' }>).index).toBe(1);
  });

  it('dial 9 on a fresh sender triggers match, advances', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    backend.matchOutcomes.set('m1', { matched: true });
    await authenticateAndPlay(sm);

    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(backend.matchCalls).toContain('m1');
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesMatchSuccess}`);
    expect((sm.getState() as Extract<State, { mode: 'checkPlaying' }>).index).toBe(1);
  });

  it('dial 9 on an already-matched sender plays already-matched prompt', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    backend.matchOutcomes.set('m1', { matched: false });
    await authenticateAndPlay(sm);

    await sm.dispatch({ kind: 'dialDigit', digit: '9' });
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesMatchAlready}`);
  });

  it('dial 2 replays the current message', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    await authenticateAndPlay(sm);

    const playsBefore = audio.calls.filter((c) => c === 'recording:msg1.m4a').length;
    await sm.dispatch({ kind: 'dialDigit', digit: '2' });
    const playsAfter = audio.calls.filter((c) => c === 'recording:msg1.m4a').length;
    expect(playsAfter).toBeGreaterThan(playsBefore);
  });

  it('dial # advances to next message', async () => {
    const { sm, backend } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = inbox;
    await authenticateAndPlay(sm);

    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect((sm.getState() as Extract<State, { mode: 'checkPlaying' }>).index).toBe(1);
  });

  it('# at last message returns to menu', async () => {
    const { sm, backend, audio } = setup();
    backend.resolveByNumber.set(137, { userId: 'me' });
    backend.inbox = [inbox[0]];
    await authenticateAndPlay(sm);

    await sm.dispatch({ kind: 'dialDigit', digit: '#' });
    expect(audio.calls).toContain(`prompt:${prompts.checkMessagesAllHeard}`);
    expect(sm.getState().mode).toBe('menu');
  });
});

// ---------------------------------------------------------------------------
// Helpers

async function authenticateAndPlay(sm: PhoneStateMachine): Promise<void> {
  await sm.dispatch({ kind: 'pickup' });
  await sm.dispatch({ kind: 'dialDigit', digit: '3' });
  await sm.dispatch({ kind: 'dialDigit', digit: '1' });
  await sm.dispatch({ kind: 'dialDigit', digit: '3' });
  await sm.dispatch({ kind: 'dialDigit', digit: '7' });
}
