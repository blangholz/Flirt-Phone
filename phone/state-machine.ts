// FlirtPhone state machine — pure logic, no DOM / Node / Next imports.
// Web and Pi implementations supply the AudioOutput, InputSource, and
// BackendClient. State transitions per Architect §6.2.
//
// Milestone 1: skeleton with greeting + hangup transitions only.
// Milestone 6+: fill in BROWSE_PROFILES, SEND_MESSAGE, CHECK_MESSAGES,
// PLAYING_MESSAGE, RECORDING_RESPONSE, MATCH_TRIGGER.

import type { AudioOutput } from './interfaces/audio-output';
import type { BackendClient } from './interfaces/backend-client';
import type { InputSource, PhoneInputEvent } from './interfaces/input-source';

export type PhoneMode =
  | 'idle'
  | 'greeting'
  | 'menu'
  | 'browseProfiles'
  | 'sendMessageEnterNumber'
  | 'sendMessageRecording'
  | 'checkMessagesAuth'
  | 'checkMessagesPlayingMessage'
  | 'checkMessagesRecordingResponse';

export interface PhoneStateMachineDeps {
  audio: AudioOutput;
  input: InputSource;
  backend: BackendClient;
  communitySlug: string;
}

const GREETING_PROMPT =
  'Welcome to FlirtPhone. Press 1 to browse profiles. ' +
  'Press 3 to check your messages. Press 4 to send a message to a specific user.';

export class PhoneStateMachine {
  private mode: PhoneMode = 'idle';
  private unsubscribe?: () => void;

  constructor(private readonly deps: PhoneStateMachineDeps) {}

  start(): void {
    this.unsubscribe = this.deps.input.onEvent((event) => this.handle(event));
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.mode = 'idle';
  }

  getMode(): PhoneMode {
    return this.mode;
  }

  private handle(event: PhoneInputEvent): void {
    if (event.kind === 'pickup' && this.mode === 'idle') {
      this.mode = 'greeting';
      void this.deps.audio.playPrompt(GREETING_PROMPT);
      return;
    }

    if (event.kind === 'hangup') {
      void this.deps.audio.stop();
      this.mode = 'idle';
      return;
    }

    // TODO (Milestone 6+): full state-transition table per Architect §6.2.
  }
}
