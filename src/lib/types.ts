export type TeamMember = 'Adham' | 'Aly' | 'Youssif';

// V2 Idea Funnel
export type IdeaStatus = 'brainstorm' | 'shortlist' | 'deep_dive' | 'killed' | 'selected';

export type SignalStrength = 'strong' | 'moderate' | 'weak';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'parallel';

export type MeetingType = 'vc' | 'angel' | 'operator' | 'accelerator' | 'other';

export type MeetingStatus = 'need_intro' | 'intro_requested' | 'intro_made' | 'scheduled' | 'confirmed' | 'completed' | 'no_response';

export interface Idea {
  id: string;
  name: string;
  description: string | null;
  source: string | null;
  status: IdeaStatus;
  archetype_id: string | null;
  vertical: string | null;
  added_by: TeamMember;
  tam_score: number | null;
  competition_score: number | null;
  problem_severity_score: number | null;
  market_founder_fit_score: number | null;
  execution_difficulty_score: number | null;
  total_score: number | null;
  score_reasoning: Record<string, string> | null;
  created_at: string;
}

export interface VerticalItem {
  id: string;
  name: string;
  created_at: string;
}

export interface IdeaScore {
  id: string;
  idea_id: string;
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

export interface Archetype {
  id: string;
  name: string;
  num_startups: number | null;
  total_capital: string | null;
  top_investors: string | null;
  investor_thesis: string | null;
  why_hot: string | null;
  relevance_to_caddy: string | null;
  created_at: string;
}

export interface ReferenceStartup {
  id: string;
  archetype_id: string | null;
  company: string;
  industry: string | null;
  one_liner: string | null;
  stage: string | null;
  amount_raised: string | null;
  key_investors: string | null;
  arr_revenue: string | null;
  key_traction: string | null;
  latest_news: string | null;
  score: number | null;
  interest: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  vertical_id: string | null;
  idea_id: string | null;
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
  idea_id: string | null;
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
