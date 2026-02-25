-- ============================================
-- V4: Funnel overhaul
-- - TAM: dollar estimate in billions (replaces 1-10 score)
-- - Competition: categorical Low/Medium/High (replaces 1-10 score)
-- - Execution difficulty: reversed (1=easy, 10=hard)
-- - New criteria: time_to_100m_arr_months, second_buyer, passion
-- - Keep total_score (recomputed from numeric scores)
-- ============================================

-- 1. Add TAM estimate in billions (NUMERIC for fractional values like 1.5 = $1.5B)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tam_estimate_billions NUMERIC;

-- Migrate existing tam_score data to rough dollar estimates
UPDATE ideas SET tam_estimate_billions = CASE
  WHEN tam_score = 10 THEN 100
  WHEN tam_score = 9 THEN 50
  WHEN tam_score = 8 THEN 10
  WHEN tam_score = 7 THEN 5
  WHEN tam_score = 6 THEN 1
  WHEN tam_score = 5 THEN 0.75
  WHEN tam_score = 4 THEN 0.5
  WHEN tam_score = 3 THEN 0.25
  WHEN tam_score = 2 THEN 0.1
  WHEN tam_score = 1 THEN 0.05
  ELSE NULL
END WHERE tam_score IS NOT NULL;

-- Drop old tam_score
ALTER TABLE ideas DROP COLUMN IF EXISTS tam_score;

-- 2. Add competition level (categorical)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS competition_level TEXT
  CHECK (competition_level IN ('Low', 'Medium', 'High'));

-- Migrate existing competition_score (higher = less competition)
UPDATE ideas SET competition_level = CASE
  WHEN competition_score >= 8 THEN 'Low'
  WHEN competition_score >= 4 THEN 'Medium'
  WHEN competition_score >= 1 THEN 'High'
  ELSE NULL
END WHERE competition_score IS NOT NULL;

-- Drop old competition_score
ALTER TABLE ideas DROP COLUMN IF EXISTS competition_score;

-- 3. Reverse execution_difficulty_score (was: 1=hard,10=easy → now: 1=easy,10=hard)
UPDATE ideas SET execution_difficulty_score = 11 - execution_difficulty_score
  WHERE execution_difficulty_score IS NOT NULL;

-- 4. Add new "Talk to Users" funnel criteria
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS time_to_100m_arr_months INT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS second_buyer_name TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS second_buyer_score INT CHECK (second_buyer_score BETWEEN 1 AND 10);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS passion_score INT CHECK (passion_score BETWEEN 1 AND 10);

-- 5. Recompute total_score from numeric scores
-- total = problem_severity + mf_fit + (11 - exec_difficulty) + second_buyer + passion
-- For ideas that don't have the new scores yet, keep their existing total or set null
UPDATE ideas SET total_score =
  COALESCE(problem_severity_score, 0) +
  COALESCE(market_founder_fit_score, 0) +
  (11 - COALESCE(execution_difficulty_score, 6)) +
  COALESCE(second_buyer_score, 0) +
  COALESCE(passion_score, 0)
WHERE problem_severity_score IS NOT NULL;
