// FlirtPhone state machine — pure logic, no DOM / Node / Next imports.
// Web and Pi implementations supply AudioOutput, InputSource, BackendClient.
// State transitions per Architect §6.2 and Functional Spec §7.

import type { AudioOutput } from './interfaces/audio-output';
import type {
  BackendClient,
  MessageSummary,
  VoiceIntroSummary,
} from './interfaces/backend-client';
import type { DialDigit, InputSource, PhoneInputEvent } from './interfaces/input-source';
import { RECORDING_CAPS, prompts } from './prompts';

// ---------------------------------------------------------------------------
// State

export type State =
  | { mode: 'idle' }
  | { mode: 'menu' }
  | {
      mode: 'browseIntroPlaying';
      list: VoiceIntroSummary[];
      index: number;
      busy: boolean;
    }
  | { mode: 'sendEnterNumber'; digits: string }
  | { mode: 'sendCountdown'; recipientUserId: string }
  | { mode: 'sendRecording'; recipientUserId: string }
  | { mode: 'sendUploading'; recipientUserId: string }
  | { mode: 'checkAuth'; digits: string }
  | {
      mode: 'checkPlaying';
      userId: string;
      inbox: MessageSummary[];
      index: number;
    }
  | {
      mode: 'checkRecordingResponse';
      userId: string;
      inbox: MessageSummary[];
      index: number;
      messageId: string;
    };

export type Mode = State['mode'];

// ---------------------------------------------------------------------------
// Deps

export interface PhoneStateMachineDeps {
  audio: AudioOutput;
  input: InputSource;
  backend: BackendClient;
  communitySlug: string;
  // The user this phone session is acting as. Required for sending messages
  // and checking your own inbox. Browse works without it. On the website
  // phone, this is set after the SMS-OTP login at /phone/[slug]/login.
  // On the Pi phone, it's resolved from caller-ID or per-handset config.
  senderUserId?: string;
}

// ---------------------------------------------------------------------------
// State Machine

export class PhoneStateMachine {
  private state: State = { mode: 'idle' };
  private unsubscribe?: () => void;

  constructor(private readonly deps: PhoneStateMachineDeps) {}

  start(): void {
    this.unsubscribe = this.deps.input.onEvent((event) => {
      void this.dispatch(event);
    });
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.state = { mode: 'idle' };
  }

  getState(): State {
    return this.state;
  }

  // Public so tests (and any non-InputSource caller) can await full
  // transitions. Production input subscribers fire-and-forget via start().
  async dispatch(event: PhoneInputEvent): Promise<void> {
    // Hangup is global — always returns to idle.
    if (event.kind === 'hangup') {
      this.deps.input.stopRecording();
      void this.deps.audio.stop();
      this.state = { mode: 'idle' };
      return;
    }

    switch (this.state.mode) {
      case 'idle':
        return this.handleIdle(event);
      case 'menu':
        return this.handleMenu(event);
      case 'browseIntroPlaying':
        return this.handleBrowse(event, this.state);
      case 'sendEnterNumber':
        return this.handleSendEnterNumber(event, this.state);
      case 'sendCountdown':
        return; // countdown ignores input until we transition to recording
      case 'sendRecording':
        return this.handleSendRecording(event, this.state);
      case 'sendUploading':
        return; // uploads are non-interactive; ignore input
      case 'checkAuth':
        return this.handleCheckAuth(event, this.state);
      case 'checkPlaying':
        return this.handleCheckPlaying(event, this.state);
      case 'checkRecordingResponse':
        return this.handleCheckRecordingResponse(event, this.state);
    }
  }

  // ---- IDLE ---------------------------------------------------------------

  private async handleIdle(event: PhoneInputEvent): Promise<void> {
    if (event.kind !== 'pickup') return;
    this.state = { mode: 'menu' };
    await this.deps.audio.playPrompt(prompts.greeting);
  }

  // ---- MENU ---------------------------------------------------------------

  private async handleMenu(event: PhoneInputEvent): Promise<void> {
    if (event.kind !== 'dialDigit') return;
    void this.deps.audio.stop();

    switch (event.digit) {
      case '1':
        return this.enterBrowse();
      case '3':
        return this.enterCheckMessagesAuth();
      case '4':
        return this.enterSendMessage();
      default:
        await this.deps.audio.playPrompt(prompts.unknownDigit);
        await this.deps.audio.playPrompt(prompts.greeting);
    }
  }

  // ---- BROWSE -------------------------------------------------------------

  private async enterBrowse(): Promise<void> {
    const list = await this.deps.backend.listVoiceIntros(this.deps.communitySlug);
    if (list.length === 0) {
      await this.deps.audio.playPrompt(prompts.browseEmpty);
      this.state = { mode: 'menu' };
      return;
    }
    this.state = { mode: 'browseIntroPlaying', list, index: 0, busy: false };
    await this.playCurrentIntro();
  }

  private async playCurrentIntro(): Promise<void> {
    if (this.state.mode !== 'browseIntroPlaying') return;
    const current = this.state.list[this.state.index];
    if (!current) return;
    await this.deps.audio.playRecording(current.audioUrl);
    if (this.state.mode !== 'browseIntroPlaying') return;
    await this.deps.audio.playPrompt(prompts.browseAfterIntro(current.assignedNumber));
  }

  private async handleBrowse(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'browseIntroPlaying' }>,
  ): Promise<void> {
    if (event.kind !== 'dialDigit') return;
    void this.deps.audio.stop();

    switch (event.digit) {
      case '9': {
        if (!this.deps.senderUserId) {
          await this.deps.audio.playPrompt(prompts.sendMessageNotAuthenticated);
          this.state = { mode: 'menu' };
          await this.deps.audio.playPrompt(prompts.greeting);
          return;
        }
        const recipient = state.list[state.index];
        this.state = { mode: 'sendCountdown', recipientUserId: recipient.userId };
        await this.runCountdownAndRecord(recipient.userId);
        return;
      }
      case '#': {
        const nextIndex = state.index + 1;
        if (nextIndex >= state.list.length) {
          await this.deps.audio.playPrompt(prompts.browseEnd);
          this.state = { mode: 'menu' };
          await this.deps.audio.playPrompt(prompts.greeting);
          return;
        }
        this.state = { ...state, index: nextIndex };
        await this.playCurrentIntro();
        return;
      }
      case '0':
        this.state = { mode: 'menu' };
        await this.deps.audio.playPrompt(prompts.greeting);
        return;
      default:
        return;
    }
  }

  // ---- SEND MESSAGE -------------------------------------------------------

  private async enterSendMessage(): Promise<void> {
    if (!this.deps.senderUserId) {
      await this.deps.audio.playPrompt(prompts.sendMessageNotAuthenticated);
      this.state = { mode: 'menu' };
      await this.deps.audio.playPrompt(prompts.greeting);
      return;
    }
    this.state = { mode: 'sendEnterNumber', digits: '' };
    await this.deps.audio.playPrompt(prompts.sendMessageEnterNumber);
  }

  private async handleSendEnterNumber(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'sendEnterNumber' }>,
  ): Promise<void> {
    if (event.kind !== 'dialDigit') return;
    if (event.digit === '0' && state.digits === '') {
      this.state = { mode: 'menu' };
      await this.deps.audio.playPrompt(prompts.greeting);
      return;
    }
    if (!isNumeric(event.digit)) return;

    const digits = state.digits + event.digit;
    if (digits.length < 3) {
      this.state = { ...state, digits };
      return;
    }

    // 3 digits collected — try to resolve
    const assignedNumber = parseInt(digits, 10);
    const resolved = await this.deps.backend.resolveByAssignedNumber({
      communitySlug: this.deps.communitySlug,
      assignedNumber,
    });
    if (!resolved) {
      this.state = { mode: 'sendEnterNumber', digits: '' };
      await this.deps.audio.playPrompt(prompts.sendMessageRecipientNotFound(digits));
      return;
    }

    this.state = { mode: 'sendCountdown', recipientUserId: resolved.userId };
    await this.runCountdownAndRecord(resolved.userId);
  }

  private async runCountdownAndRecord(recipientUserId: string): Promise<void> {
    await this.deps.audio.playPrompt(prompts.sendMessageCountdown);
    await this.deps.audio.playBeep();
    if (this.state.mode !== 'sendCountdown') return; // hung up mid-countdown
    this.state = { mode: 'sendRecording', recipientUserId };
    this.deps.input.startRecording(RECORDING_CAPS.message);
  }

  private async handleSendRecording(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'sendRecording' }>,
  ): Promise<void> {
    if (event.kind === 'dialDigit' && event.digit === '#') {
      this.deps.input.stopRecording();
      return;
    }
    if (event.kind !== 'recordingDone') return;
    if (!this.deps.senderUserId) return;

    this.state = { mode: 'sendUploading', recipientUserId: state.recipientUserId };
    await this.deps.backend.uploadMessage({
      senderUserId: this.deps.senderUserId,
      recipientUserId: state.recipientUserId,
      blob: event.blob,
      durationSeconds: event.durationSeconds,
    });
    await this.deps.audio.playPrompt(prompts.sendMessageDone);
    this.state = { mode: 'menu' };
    await this.deps.audio.playPrompt(prompts.greeting);
  }

  // ---- CHECK MESSAGES -----------------------------------------------------

  private async enterCheckMessagesAuth(): Promise<void> {
    this.state = { mode: 'checkAuth', digits: '' };
    await this.deps.audio.playPrompt(prompts.checkMessagesEnterOwnNumber);
  }

  private async handleCheckAuth(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'checkAuth' }>,
  ): Promise<void> {
    if (event.kind !== 'dialDigit') return;
    if (event.digit === '0' && state.digits === '') {
      this.state = { mode: 'menu' };
      await this.deps.audio.playPrompt(prompts.greeting);
      return;
    }
    if (!isNumeric(event.digit)) return;

    const digits = state.digits + event.digit;
    if (digits.length < 3) {
      this.state = { ...state, digits };
      return;
    }

    const assignedNumber = parseInt(digits, 10);
    const resolved = await this.deps.backend.resolveByAssignedNumber({
      communitySlug: this.deps.communitySlug,
      assignedNumber,
    });
    if (!resolved) {
      this.state = { mode: 'checkAuth', digits: '' };
      await this.deps.audio.playPrompt(prompts.checkMessagesAuthFailed);
      return;
    }

    const inbox = await this.deps.backend.fetchInbox(resolved.userId);
    if (inbox.length === 0) {
      await this.deps.audio.playPrompt(prompts.checkMessagesEmpty);
      this.state = { mode: 'menu' };
      await this.deps.audio.playPrompt(prompts.greeting);
      return;
    }

    this.state = { mode: 'checkPlaying', userId: resolved.userId, inbox, index: 0 };
    await this.playCurrentInboxMessage();
  }

  private async playCurrentInboxMessage(): Promise<void> {
    if (this.state.mode !== 'checkPlaying') return;
    const message = this.state.inbox[this.state.index];
    if (!message) return;
    await this.deps.audio.playPrompt(prompts.checkMessagesIncoming);
    await this.deps.audio.playRecording(message.audioUrl);
    if (this.state.mode !== 'checkPlaying') return;
    void this.deps.backend.markListened(message.messageId);
    await this.deps.audio.playPrompt(prompts.checkMessagesAfterMessage);
  }

  private async handleCheckPlaying(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'checkPlaying' }>,
  ): Promise<void> {
    if (event.kind !== 'dialDigit') return;
    void this.deps.audio.stop();
    const message = state.inbox[state.index];

    switch (event.digit) {
      case '1':
        this.state = {
          mode: 'checkRecordingResponse',
          userId: state.userId,
          inbox: state.inbox,
          index: state.index,
          messageId: message.messageId,
        };
        await this.deps.audio.playPrompt(prompts.checkMessagesRecordResponse);
        await this.deps.audio.playBeep();
        this.deps.input.startRecording(RECORDING_CAPS.response);
        return;
      case '2':
        await this.playCurrentInboxMessage();
        return;
      case '9': {
        const result = await this.deps.backend.match(message.messageId);
        await this.deps.audio.playPrompt(
          result.matched ? prompts.checkMessagesMatchSuccess : prompts.checkMessagesMatchAlready,
        );
        return this.advanceInbox(state);
      }
      case '#':
        return this.advanceInbox(state);
      case '0':
        this.state = { mode: 'menu' };
        await this.deps.audio.playPrompt(prompts.greeting);
        return;
      default:
        return;
    }
  }

  private async advanceInbox(
    state: Extract<State, { mode: 'checkPlaying' }>,
  ): Promise<void> {
    const nextIndex = state.index + 1;
    if (nextIndex >= state.inbox.length) {
      await this.deps.audio.playPrompt(prompts.checkMessagesAllHeard);
      this.state = { mode: 'menu' };
      await this.deps.audio.playPrompt(prompts.greeting);
      return;
    }
    this.state = { ...state, index: nextIndex };
    await this.playCurrentInboxMessage();
  }

  private async handleCheckRecordingResponse(
    event: PhoneInputEvent,
    state: Extract<State, { mode: 'checkRecordingResponse' }>,
  ): Promise<void> {
    if (event.kind === 'dialDigit' && event.digit === '#') {
      this.deps.input.stopRecording();
      return;
    }
    if (event.kind !== 'recordingDone') return;

    await this.deps.backend.recordResponse({
      messageId: state.messageId,
      blob: event.blob,
      durationSeconds: event.durationSeconds,
    });
    await this.deps.audio.playPrompt(prompts.checkMessagesResponseSent);

    // Continue inbox playback from where we left off.
    const playingState: Extract<State, { mode: 'checkPlaying' }> = {
      mode: 'checkPlaying',
      userId: state.userId,
      inbox: state.inbox,
      index: state.index,
    };
    this.state = playingState;
    return this.advanceInbox(playingState);
  }
}

// ---------------------------------------------------------------------------
// Helpers

function isNumeric(digit: DialDigit): boolean {
  return digit >= '0' && digit <= '9';
}
