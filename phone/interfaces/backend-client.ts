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

  // Resolve a 3-digit number to a userId within a community.
  // Used for both send-message recipient validation and check-messages
  // "authentication" (enter your own number).
  resolveByAssignedNumber(args: {
    communitySlug: string;
    assignedNumber: number;
  }): Promise<{ userId: string } | null>;

  // Upload a recorded voice message.
  uploadMessage(args: {
    senderUserId: string;
    recipientUserId: string;
    blob: Blob;
    durationSeconds: number;
  }): Promise<{ messageId: string }>;

  // Inbox: messages this user has received.
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
