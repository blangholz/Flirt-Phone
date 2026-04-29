// InputSource — abstracts how the phone receives user input.
// Web: DOM clicks / keypresses / MediaRecorder.
// Pi (future): GPIO from rotary mechanism + handset switch + microphone.
//
// The state machine subscribes to events; it does NOT poll DOM or hardware.

export type DialDigit =
  | '0' | '1' | '2' | '3' | '4'
  | '5' | '6' | '7' | '8' | '9'
  | '*' | '#';

export type PhoneInputEvent =
  | { kind: 'pickup' }
  | { kind: 'hangup' }
  | { kind: 'dialDigit'; digit: DialDigit }
  | { kind: 'recordingDone'; blob: Blob; durationSeconds: number };

export interface InputSource {
  // Returns an unsubscribe function.
  onEvent(handler: (event: PhoneInputEvent) => void): () => void;
}
