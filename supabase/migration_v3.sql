-- ============================================
-- V3: Funnel scoring system + verticals list
-- ============================================

-- 1. Add AI funnel score columns to ideas table
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tam_score INT CHECK (tam_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS competition_score INT CHECK (competition_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS problem_severity_score INT CHECK (problem_severity_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS market_founder_fit_score INT CHECK (market_founder_fit_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS execution_difficulty_score INT CHECK (execution_difficulty_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS total_score INT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS vertical TEXT;

-- 2. Create verticals_list table (industry verticals for the generator)
CREATE TABLE IF NOT EXISTS verticals_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE verticals_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon on verticals_list" ON verticals_list FOR ALL TO anon USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE verticals_list;

-- 3. Seed verticals from the Excel industry data
INSERT INTO verticals_list (name) VALUES
  ('Neurotech / BCI'),
  ('Longevity / Anti-Aging'),
  ('Wellness / Fitness'),
  ('Frontier AI / ML'),
  ('Robotics / Autonomous'),
  ('Quantum Computing'),
  ('Biotech / Pharma'),
  ('Nuclear / Fusion'),
  ('Defense / Dual-Use'),
  ('Cybersecurity'),
  ('AI Applications'),
  ('Space / Aerospace'),
  ('Semiconductor / Chips'),
  ('Healthcare / Digital Health'),
  ('Data Infrastructure'),
  ('Climate / Clean Energy'),
  ('Cloud / Infrastructure'),
  ('Developer Tools'),
  ('Enterprise SaaS'),
  ('Consumer / Social'),
  ('Fintech'),
  ('Legal Tech'),
  ('Insurance'),
  ('Logistics / Supply Chain'),
  ('Crypto / Web3'),
  ('Mobility / Transport'),
  ('Food / AgTech'),
  ('Education / EdTech'),
  ('Real Estate / PropTech'),
  ('E-Commerce / Marketplace'),
  ('Telecom / Connectivity'),
  ('Media / Entertainment'),
  ('HR / Workforce'),
  ('Surgical / MedTech'),
  ('Construction / Infrastructure')
ON CONFLICT (name) DO NOTHING;
