-- Exploration Tracker: Full Schema Migration + Seed Data
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE verticals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  source text,
  status text NOT NULL DEFAULT 'longlist'
    CHECK (status IN ('longlist', 'shortlist', 'deep_dive', 'killed', 'selected')),
  added_by text NOT NULL
    CHECK (added_by IN ('Adham', 'Aly', 'Youssif')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vertical_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id uuid NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
  scored_by text NOT NULL
    CHECK (scored_by IN ('Adham', 'Aly', 'Youssif')),
  problem_severity integer CHECK (problem_severity BETWEEN 1 AND 10),
  willingness_to_pay integer CHECK (willingness_to_pay BETWEEN 1 AND 10),
  our_edge integer CHECK (our_edge BETWEEN 1 AND 10),
  moat_potential integer CHECK (moat_potential BETWEEN 1 AND 10),
  time_to_demo integer CHECK (time_to_demo BETWEEN 1 AND 10),
  market_size integer CHECK (market_size BETWEEN 1 AND 10),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vertical_id, scored_by)
);

CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id uuid REFERENCES verticals(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_role text,
  contact_org text,
  conducted_by text NOT NULL
    CHECK (conducted_by IN ('Adham', 'Aly', 'Youssif')),
  date date,
  summary text,
  raw_notes text,
  signal_strength text
    CHECK (signal_strength IN ('strong', 'moderate', 'weak')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to text NOT NULL
    CHECK (assigned_to IN ('Adham', 'Aly', 'Youssif')),
  phase text NOT NULL DEFAULT 'phase_1'
    CHECK (phase IN ('phase_1', 'phase_2', 'phase_3', 'parallel')),
  due_date date,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),
  vertical_id uuid REFERENCES verticals(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sf_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  contact_role text,
  company_or_fund text,
  meeting_type text NOT NULL DEFAULT 'other'
    CHECK (meeting_type IN ('vc', 'angel', 'operator', 'accelerator', 'other')),
  status text NOT NULL DEFAULT 'need_intro'
    CHECK (status IN ('need_intro', 'intro_requested', 'intro_made', 'scheduled', 'confirmed', 'completed', 'no_response')),
  intro_through text,
  owner text NOT NULL
    CHECK (owner IN ('Adham', 'Aly', 'Youssif')),
  scheduled_date timestamptz,
  location text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- RLS (permissive for internal tool)
-- ============================================

ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vertical_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_meetings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for anonymous users (internal tool, no auth)
CREATE POLICY "Allow all for anon" ON verticals FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON vertical_scores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON conversations FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON sf_meetings FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE verticals;
ALTER PUBLICATION supabase_realtime ADD TABLE vertical_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE sf_meetings;

-- ============================================
-- SEED DATA
-- ============================================

-- Verticals
INSERT INTO verticals (name, description, source, status, added_by) VALUES
  ('Surgical OR Camera', 'Computer vision on existing OR boom cameras. Track instruments, automate turnover analytics, generate surgical motion data for robotics companies.', 'brainstorm', 'shortlist', 'Adham'),
  ('AR/XR Vocational Training', 'AR-guided training for skilled trades. Plays directly to team''s 10+ years of AR/XR experience.', 'brainstorm', 'longlist', 'Aly'),
  ('Construction Site Monitoring', 'CV on existing job site cameras to track progress, safety compliance, and equipment utilization.', 'brainstorm', 'longlist', 'Adham');

-- Tasks
INSERT INTO tasks (title, assigned_to, phase, due_date, status) VALUES
  ('Review 3K company database and flag interesting verticals', 'Aly', 'phase_1', '2025-02-25', 'todo'),
  ('Generate additional vertical ideas from brainstorm', 'Youssif', 'phase_1', '2025-02-25', 'todo'),
  ('Score and cut to 5-7 verticals (team call)', 'Adham', 'phase_1', '2025-02-25', 'todo'),
  ('Submit YC progress update', 'Adham', 'parallel', '2025-02-24', 'todo'),
  ('Start reaching out to networks for SF meeting intros', 'Adham', 'parallel', '2025-02-28', 'todo'),
  ('Start reaching out to networks for SF meeting intros', 'Aly', 'parallel', '2025-02-28', 'todo'),
  ('Start reaching out to networks for SF meeting intros', 'Youssif', 'parallel', '2025-02-28', 'todo');
