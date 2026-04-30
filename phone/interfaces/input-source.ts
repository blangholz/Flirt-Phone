// InputSource — abstracts how the phone receives user input.
// Web: DOM clicks / keypresses + MediaRecorder.
// Pi (future): GPIO from rotary mechanism + handset switch + microphone.
//
// The state machine subscribes to events; it does NOT poll DOM or hardware.
// Recording is initiated by the state machine via startRecording(), which
// emits a `recordingDone` event when the capture ends (by stopRecording(),
// hangup, or maxDurationSeconds elapsed).

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

  // Begin audio capture. Implementation must emit `recordingDone` when
  // capture ends (caller calls stopRecording, max duration elapses, or
  // hangup occurs). Idempotent if already recording.
  startRecording(maxDurationSeconds: number): void;

  // Stop in-flight recording (if any). Must trigger `recordingDone` once.
  stopRecording(): void;
}
