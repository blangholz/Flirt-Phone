// BackendClient — abstracts the phone's calls to the FlirtPhone server.
// Same interface for web (fetch /api/...) and Pi (HTTPS to deployed backend).
//
// Concrete implementations stay thin: REST in, typed result out.
// All RLS / auth / business rules live on the server.

export interface VoiceIntroSummary {
  userId: string;
  assignedNumber: number;
  audioUrl: string;
  questionText: string;
}

export interface MessageSummary {
  messageId: string;
  audioUrl: string;
  durationSeconds: number;
}

export interface MatchResult {
  matched: boolean; // false if already matched, true if just completed
}

export interface BackendClient {
  // Browse mode: random voice intros for a community.
  listVoiceIntros(communitySlug: string): Promise<VoiceIntroSummary[]>;

  // Send message (sender already authenticated).
  uploadMessage(args: {
    senderUserId: string;
    recipientAssignedNumber: number;
    blob: Blob;
    durationSeconds: number;
  }): Promise<{ messageId: string }>;

  // Check messages (recipient already authenticated via SMS OTP).
  fetchInbox(userId: string): Promise<MessageSummary[]>;
  markListened(messageId: string): Promise<void>;

  // Reactive actions during playback.
  recordResponse(args: {
    messageId: string;
    blob: Blob;
    durationSeconds: number;
  }): Promise<void>;
  match(messageId: string): Promise<MatchResult>;
}
