export type TeamMember = 'Adham' | 'Aly' | 'Youssif';

export type VerticalStatus = 'longlist' | 'shortlist' | 'deep_dive' | 'killed' | 'selected';

export type SignalStrength = 'strong' | 'moderate' | 'weak';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'parallel';

export type MeetingType = 'vc' | 'angel' | 'operator' | 'accelerator' | 'other';

export type MeetingStatus = 'need_intro' | 'intro_requested' | 'intro_made' | 'scheduled' | 'confirmed' | 'completed' | 'no_response';

export interface Vertical {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  status: VerticalStatus;
  added_by: TeamMember;
  created_at: string;
}

export interface VerticalScore {
  id: string;
  vertical_id: string;
  scored_by: TeamMember;
  problem_severity: number;
  willingness_to_pay: number;
  our_edge: number;
  moat_potential: number;
  time_to_demo: number;
  market_size: number;
  notes: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  vertical_id: string | null;
  contact_name: string;
  contact_role: string | null;
  contact_org: string | null;
  conducted_by: TeamMember;
  date: string | null;
  summary: string | null;
  raw_notes: string | null;
  signal_strength: SignalStrength | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: TeamMember;
  phase: TaskPhase;
  due_date: string | null;
  status: TaskStatus;
  vertical_id: string | null;
  created_at: string;
}

export interface SFMeeting {
  id: string;
  contact_name: string;
  contact_role: string | null;
  company_or_fund: string | null;
  meeting_type: MeetingType;
  status: MeetingStatus;
  intro_through: string | null;
  owner: TeamMember;
  scheduled_date: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      verticals: {
        Row: Vertical;
        Insert: Omit<Vertical, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Vertical, 'id'>>;
      };
      vertical_scores: {
        Row: VerticalScore;
        Insert: Omit<VerticalScore, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<VerticalScore, 'id'>>;
      };
      conversations: {
        Row: Conversation;
        Insert: Omit<Conversation, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Conversation, 'id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Task, 'id'>>;
      };
      sf_meetings: {
        Row: SFMeeting;
        Insert: Omit<SFMeeting, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<SFMeeting, 'id'>>;
      };
    };
  };
}
