-- ============================================
-- Exploration Tracker V2: Funnel Framework + Reference Database
-- Run this AFTER the original migration.sql
-- ============================================

-- New enum-like types for idea status
-- ideas funnel: brainstorm → shortlist → deep_dive → killed | selected

-- ============================================
-- 1. ARCHETYPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  num_startups INT,
  total_capital TEXT,
  top_investors TEXT,
  investor_thesis TEXT,
  why_hot TEXT,
  relevance_to_caddy TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on archetypes" ON archetypes FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 2. REFERENCE STARTUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reference_startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_id UUID REFERENCES archetypes(id) ON DELETE SET NULL,
  company TEXT NOT NULL,
  industry TEXT,
  one_liner TEXT,
  stage TEXT,
  amount_raised TEXT,
  key_investors TEXT,
  arr_revenue TEXT,
  key_traction TEXT,
  latest_news TEXT,
  score INT,
  interest TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reference_startups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on reference_startups" ON reference_startups FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 3. IDEAS TABLE (replaces verticals conceptually)
-- ============================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'brainstorm' CHECK (status IN ('brainstorm', 'shortlist', 'deep_dive', 'killed', 'selected')),
  archetype_id UUID REFERENCES archetypes(id) ON DELETE SET NULL,
  added_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on ideas" ON ideas FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 4. IDEA SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS idea_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  scored_by TEXT NOT NULL,
  problem_severity INT CHECK (problem_severity BETWEEN 1 AND 10),
  willingness_to_pay INT CHECK (willingness_to_pay BETWEEN 1 AND 10),
  our_edge INT CHECK (our_edge BETWEEN 1 AND 10),
  moat_potential INT CHECK (moat_potential BETWEEN 1 AND 10),
  time_to_demo INT CHECK (time_to_demo BETWEEN 1 AND 10),
  market_size INT CHECK (market_size BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(idea_id, scored_by)
);

ALTER TABLE idea_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on idea_scores" ON idea_scores FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================
-- 5. ADD idea_id TO EXISTING TABLES
-- ============================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL;

-- ============================================
-- 6. ENABLE REALTIME FOR NEW TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE archetypes;
ALTER PUBLICATION supabase_realtime ADD TABLE reference_startups;
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE idea_scores;

-- ============================================
-- SEED: Sample ideas to get started
-- ============================================
INSERT INTO ideas (name, description, source, status, added_by) VALUES
  ('Surgical OR Camera Analytics', 'CV on existing OR cameras to track surgical workflow, detect delays, and optimize turnover', 'core', 'deep_dive', 'Adham'),
  ('AR/XR Vocational Training', 'Augmented reality for hands-on job training in trades and healthcare', 'brainstorm', 'shortlist', 'Aly'),
  ('Construction Site Monitoring', 'Computer vision for real-time safety and progress monitoring on construction sites', 'database', 'brainstorm', 'Youssif');
