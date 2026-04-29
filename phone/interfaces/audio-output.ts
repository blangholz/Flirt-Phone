// AudioOutput — abstracts how the phone produces audio.
// Web: WebAudio + TTS (or pre-recorded prompts).
// Pi (future): ALSA / Pi audio HW.
//
// The state machine talks ONLY to this interface — no DOM, no Web APIs.
export interface AudioOutput {
  playPrompt(text: string): Promise<void>;
  playRecording(url: string): Promise<void>;
  playBeep(): Promise<void>;
  stop(): Promise<void>;
}
