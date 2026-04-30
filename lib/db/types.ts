// Handwritten DB types matching supabase/migrations/0001_*.sql through 0008_*.sql.
// REPLACE with `npx supabase gen types typescript --linked > lib/db/types.ts`
// once the Supabase project is linked. Until then, these types stay in sync
// with the migrations by hand.

export type CommunityType = 'ongoing' | 'temporary';
export type CommunityStatus = 'active' | 'dormant' | 'closed';
export type UserStatus = 'registering' | 'active' | 'dormant';
export type QuestionSource = 'admin_approved' | 'admin_added';

// --- Row shapes (what comes out of SELECT) ---

export interface AdminRow {
  id: string;
  email: string;
  created_at: string;
}

export interface CommunityRow {
  id: string;
  name: string;
  slug: string;
  type: CommunityType;
  start_date: string | null;
  end_date: string | null;
  status: CommunityStatus;
  refresh_cadence: string | null; // postgres interval, e.g. "1 mon"
  owner_admin_id: string;
  created_at: string;
}

export interface UserRow {
  id: string;
  community_id: string;
  phone_number: string; // E.164
  name: string | null;
  photo_url: string | null;
  age: number | null;
  gender: string | null;
  orientation: string | null;
  location: string | null;
  interests: string | null;
  assigned_number: number | null; // 100-999
  status: UserStatus;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  community_id: string;
  question_text: string;
  source: QuestionSource;
  created_at: string;
}

export interface VoiceIntroRow {
  user_id: string; // PK — one current intro per user
  question_id: string;
  audio_url: string;
  duration_seconds: number;
  recorded_at: string;
}

export interface MessageRow {
  id: string;
  sender_user_id: string;
  recipient_user_id: string;
  audio_url: string;
  duration_seconds: number;
  sent_at: string;
  listened_at: string | null;
  listened_count: number;
}

export interface ResponseRow {
  id: string;
  message_id: string;
  responder_user_id: string;
  audio_url: string;
  duration_seconds: number;
  recorded_at: string;
}

export interface MatchRow {
  id: string;
  community_id: string;
  user_a_id: string; // canonical: user_a_id < user_b_id
  user_b_id: string;
  triggering_message_id: string;
  matched_at: string;
}

// --- Insert shapes (PK + defaultable fields optional) ---

export type AdminInsert = Pick<AdminRow, 'id' | 'email'> & Partial<Pick<AdminRow, 'created_at'>>;

export type CommunityInsert = Pick<CommunityRow, 'name' | 'slug' | 'type' | 'owner_admin_id'> &
  Partial<Pick<CommunityRow, 'id' | 'start_date' | 'end_date' | 'status' | 'refresh_cadence' | 'created_at'>>;

export type UserInsert = Pick<UserRow, 'community_id' | 'phone_number'> &
  Partial<Omit<UserRow, 'community_id' | 'phone_number'>>;

export type QuestionInsert = Pick<QuestionRow, 'community_id' | 'question_text' | 'source'> &
  Partial<Pick<QuestionRow, 'id' | 'created_at'>>;

export type VoiceIntroInsert = Pick<VoiceIntroRow, 'user_id' | 'question_id' | 'audio_url' | 'duration_seconds'> &
  Partial<Pick<VoiceIntroRow, 'recorded_at'>>;

export type MessageInsert = Pick<MessageRow, 'sender_user_id' | 'recipient_user_id' | 'audio_url' | 'duration_seconds'> &
  Partial<Pick<MessageRow, 'id' | 'sent_at' | 'listened_at' | 'listened_count'>>;

export type ResponseInsert = Pick<ResponseRow, 'message_id' | 'responder_user_id' | 'audio_url' | 'duration_seconds'> &
  Partial<Pick<ResponseRow, 'id' | 'recorded_at'>>;

export type MatchInsert = Pick<MatchRow, 'community_id' | 'user_a_id' | 'user_b_id' | 'triggering_message_id'> &
  Partial<Pick<MatchRow, 'id' | 'matched_at'>>;

// --- Database shape for createClient<Database>() / createServerClient<Database>() ---

export interface Database {
  public: {
    Tables: {
      admins: { Row: AdminRow; Insert: AdminInsert; Update: Partial<AdminRow> };
      communities: { Row: CommunityRow; Insert: CommunityInsert; Update: Partial<CommunityRow> };
      users: { Row: UserRow; Insert: UserInsert; Update: Partial<UserRow> };
      questions: { Row: QuestionRow; Insert: QuestionInsert; Update: Partial<QuestionRow> };
      voice_intros: { Row: VoiceIntroRow; Insert: VoiceIntroInsert; Update: Partial<VoiceIntroRow> };
      messages: { Row: MessageRow; Insert: MessageInsert; Update: Partial<MessageRow> };
      responses: { Row: ResponseRow; Insert: ResponseInsert; Update: Partial<ResponseRow> };
      matches: { Row: MatchRow; Insert: MatchInsert; Update: Partial<MatchRow> };
    };
    Enums: {
      community_type: CommunityType;
      community_status: CommunityStatus;
      user_status: UserStatus;
      question_source: QuestionSource;
    };
    Functions: Record<string, never>;
  };
}
