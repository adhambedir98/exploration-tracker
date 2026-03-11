-- ============================================
-- V5: Sound AI Lab Tables
-- ============================================

-- Sound AI Ideas
CREATE TABLE sound_ai_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  one_liner TEXT,
  category TEXT,
  target_customer TEXT,
  how_it_works TEXT,
  revenue_model TEXT,
  competitors TEXT,
  differentiation TEXT,
  tam_score INT CHECK (tam_score >= 1 AND tam_score <= 10),
  pain_score INT CHECK (pain_score >= 1 AND pain_score <= 10),
  feasibility_score INT CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  moat_score INT CHECK (moat_score >= 1 AND moat_score <= 10),
  team_fit_score INT CHECK (team_fit_score >= 1 AND team_fit_score <= 10),
  time_to_revenue_score INT CHECK (time_to_revenue_score >= 1 AND time_to_revenue_score <= 10),
  passion_score INT CHECK (passion_score >= 1 AND passion_score <= 10),
  composite_score NUMERIC,
  status TEXT DEFAULT 'brainstorm' CHECK (status IN ('brainstorm', 'researching', 'validating', 'building', 'killed')),
  notes TEXT,
  added_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sound AI Thesis (versioned)
CREATE TABLE sound_ai_thesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sound AI Competitive Landscape
CREATE TABLE sound_ai_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  focus TEXT,
  funding TEXT,
  key_product TEXT,
  gap_opportunity TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (permissive, internal tool)
ALTER TABLE sound_ai_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_ai_thesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_ai_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for sound_ai_ideas" ON sound_ai_ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sound_ai_thesis" ON sound_ai_thesis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for sound_ai_competitors" ON sound_ai_competitors FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Seed: Thesis (version 1)
-- ============================================
INSERT INTO sound_ai_thesis (version, content, updated_by) VALUES (
  1,
  E'## Current Working Thesis: AI Session Musicians for Film & Video\n\n"We''re building AI instrument agents that generate individual music stems on command, giving every composer and filmmaker a full orchestra at their fingertips. Each agent specializes in one instrument, trained on licensed performance data. The human stays in the creative seat. We''re the instrument, not the artist."\n\n### Key Differentiators\n- Native stem-level output (not separated after mixing like Suno)\n- Human composes, AI performs (copyright safe, industry friendly)\n- Video-aware generation (stems match emotional arc of scenes)\n- Licensed training data with artist revenue share\n\n### Target Customers (in order)\n1. YouTube creators and podcast producers (wedge, easiest to reach)\n2. Indie filmmakers (core market, highest willingness to pay)\n3. Game developers (adaptive scoring, high technical value)\n4. Professional composers (productivity tool, not replacement)\n5. Studios and streaming platforms (enterprise, long-term)\n\n### December 2026 Kill Criteria\n- Working demo with 3+ instrument agents\n- 10+ paying users or signed LOIs\n- Accelerator acceptance or $500K+ committed funding\n- If all three are not met, team disbands and founders pursue other paths',
  'Adham'
);

-- ============================================
-- Seed: Competitors
-- ============================================
INSERT INTO sound_ai_competitors (company, focus, funding, key_product, gap_opportunity) VALUES
  ('Suno', 'Consumer song generation', '$250M, $2.45B val, $300M ARR', 'Text-to-song with vocals, Suno Studio DAW', 'Stems separated after-the-fact (artifacts). No video awareness. Consumer, not pro.'),
  ('Udio', 'Consumer song generation', '$60M+', 'Text-to-song, experimental', 'Locked ecosystem. Smaller user base. Same copyright issues as Suno.'),
  ('Mirelo', 'Video-to-SFX', '$41M seed (a16z, Index)', 'Upload video, get synced sound effects', 'SFX only, not music. Music on roadmap. Founded by PhD ML researchers.'),
  ('ElevenLabs', 'Voice synthesis', '$180M+', 'Text-to-speech, voice cloning, Eleven Music', 'Music is side product. Voice is core.'),
  ('AIVA', 'AI classical composer', 'Acquired by Bandai Namco', 'AI-composed classical/cinematic music', 'Dated tech. Not stem-level. Not video-aware.'),
  ('Epidemic Sound', 'Royalty-free music library', '$450M+', 'Human-composed library, 50K+ tracks', 'Not generative. Incumbent being disrupted.'),
  ('Soundraw', 'Background music generator', 'Small', 'Loop-based background music', 'Commodity. Not professional grade.'),
  ('Mubert', 'Generative ambient/electronic', 'Small', 'API-first ambient generation', 'Not scene-aware. Limited genres.'),
  ('Stability Audio', 'Open-source audio models', 'Stability AI', 'Stable Audio, open-source', 'Underfunded parent. Research tools, not products.'),
  ('Meta AudioCraft', 'Open-source research', 'Meta internal', 'MusicGen, AudioGen', 'Research models. Not productized. Potential infrastructure layer.'),
  ('Google MusicLM', 'Internal research', 'Google internal', 'MusicFX, YouTube integration', 'May build features into YouTube Studio. Won''t build standalone scoring product.'),
  ('Boomy', 'Consumer music creation', 'Small', 'Simple track generation', 'Toy product. Not professional.');

-- ============================================
-- Seed: Ideas (8 pre-populated)
-- ============================================
INSERT INTO sound_ai_ideas (name, one_liner, category, target_customer, how_it_works, revenue_model, competitors, differentiation, tam_score, pain_score, feasibility_score, moat_score, team_fit_score, time_to_revenue_score, passion_score, composite_score, status, notes, added_by) VALUES
(
  'AI Session Musicians',
  'AI instrument agents that generate individual music stems on command for film composers and filmmakers',
  'Film & TV Scoring',
  'Indie filmmakers with budgets under $5M who can''t afford full orchestral scoring',
  'Each AI agent specializes in one instrument (violin, piano, drums, etc.), trained on licensed performance data. Composers select instruments, set mood/tempo/key, and the agents generate stems that layer together. Video-aware mode analyzes scene emotion and auto-generates matching stems.',
  'SaaS Subscription',
  'Suno (consumer, not stem-level), AIVA (dated, not video-aware), Epidemic Sound (not generative)',
  'Native stem output, human stays in creative seat, video-aware generation, licensed training data',
  7, 8, 7, 7, 9, 6, 9, 7.60,
  'researching',
  'This is our current lead thesis. Key risk: technical quality of individual stems needs to match professional session musicians. Key advantage: no one is doing stem-level generation with video awareness.',
  'Adham'
),
(
  'AI Venue Music',
  'AI-generated ambient music for restaurants, hotels, and retail that adapts to time of day and crowd energy',
  'Commercial/Venue Music',
  'Restaurant and hotel owners paying $50-500/mo for Muzak-style background music services',
  'Venues describe their brand aesthetic and the AI generates continuous, non-repeating ambient music. Sensors or manual controls adjust energy, tempo, and mood throughout the day. Never plays the same thing twice. No licensing fees.',
  'SaaS Subscription',
  'Soundtrack Your Brand, Rockbot, Mubert (limited genres)',
  'Fully generative (never repeats), adapts to real-time conditions, no licensing overhead',
  6, 6, 8, 4, 7, 8, 7, 6.45,
  'researching',
  'We built a working prototype (Vibe). Good wedge market but low moat — any generative music company could add this feature. Defensibility comes from venue-specific customization and sensor integration.',
  'Adham'
),
(
  'Composer Avatar Marketplace',
  'Licensed AI versions of real composers that generate music in their signature style with revenue share',
  'Music Production Tools',
  'Music supervisors and ad agencies who need specific sonic aesthetics on tight deadlines',
  'Partner with composers to train AI models on their catalog (with permission + revenue share). Buyers select a composer avatar, describe what they need, and get music in that specific style. Composers earn royalties on every generation.',
  'Marketplace (take rate)',
  'Suno (no artist licensing), AIVA (no marketplace), Epidemic Sound (human-only catalog)',
  'Licensed artist relationships create supply-side moat, two-sided marketplace network effects',
  5, 6, 5, 8, 7, 5, 7, 6.15,
  'brainstorm',
  'Strong moat if we can sign exclusive artist deals. Challenge: convincing composers to license their style to AI. Revenue share model needs to be generous enough to attract top talent.',
  'Adham'
),
(
  'AI Foley/SFX for Indie Film',
  'Upload video, get perfectly synced sound effects and foley — built for indie creators at accessible pricing',
  'Sound Effects & Foley',
  'Independent filmmakers and YouTube creators who can''t afford professional foley artists',
  'Upload a video clip and the AI detects objects, movements, and environments to generate perfectly timed sound effects. Footsteps match walking pace, doors sound like the doors shown, ambient fills match the location. Export individual SFX tracks for editing.',
  'Per-Generation / Usage-Based',
  'Mirelo ($41M, a16z-backed, same concept but enterprise-focused)',
  'Indie/creator pricing tier, simpler UX, bundled with music generation for one-stop audio post',
  5, 7, 7, 5, 7, 7, 6, 6.25,
  'brainstorm',
  'Mirelo is well-funded and going after the same space. Our angle would need to be creator-tier pricing and simpler UX. Risk: Mirelo adds music and takes the whole market.',
  'Aly'
),
(
  'AI Game Scoring Engine',
  'Middleware that generates adaptive music stems in real-time responding to gameplay state and player emotions',
  'Game Audio',
  'Indie game studios (teams of 5-50) building narrative games who can''t afford adaptive scoring',
  'SDK integrates into Unity/Unreal. Game sends state signals (combat, exploration, dialogue, tension level) and the engine generates real-time music stems that seamlessly transition between moods. No pre-composed loops needed — infinite variation.',
  'Enterprise Contracts',
  'Wwise (middleware but not generative), FMOD (same), no AI-native game audio middleware exists',
  'First AI-native game audio middleware, SDK integration creates switching costs, infinite variation vs. loop fatigue',
  6, 7, 5, 7, 8, 5, 8, 6.60,
  'brainstorm',
  'Technically challenging — real-time generation with low latency is hard. But the market has no AI-native solution. Game studios are desperate for affordable adaptive scoring. Strong team fit with our audio engineering CTO.',
  'Youssif'
),
(
  'AI Podcast Scoring',
  'Auto-generate mood-matched background music for podcast episodes based on transcript analysis',
  'Podcast & YouTube',
  'Mid-tier podcast producers (10K-500K listeners) who want professional sound without music licensing headaches',
  'Upload a podcast episode or transcript. AI analyzes sentiment, pacing, topic shifts, and emotional beats. Generates subtle background music that enhances the listening experience — swelling during emotional moments, quieting during intimate conversations.',
  'SaaS Subscription',
  'Descript (editing, not music), Riverside (recording, not music), no AI podcast scoring tool exists',
  'First dedicated AI podcast music tool, transcript-aware generation, integrates into existing podcast workflows',
  4, 6, 8, 4, 6, 8, 5, 5.75,
  'brainstorm',
  'Easy to build, fast to revenue, but small TAM and low moat. Could be a feature in Descript or Riverside rather than a standalone product. Good wedge but not a venture-scale business alone.',
  'Aly'
),
(
  'AI Music Video Sync',
  'Generate original music that perfectly matches the emotional arc and visual rhythm of existing video content',
  'Film & TV Scoring',
  'Video editors and content creators who need custom music synced to their edits without licensing hassles',
  'Upload any video and the AI analyzes scene changes, emotional tone, pacing, and visual rhythm. Generates original music that hits every beat, builds tension in the right places, and resolves at the right moments. Export as stems or full mix.',
  'Per-Generation / Usage-Based',
  'Suno (not video-aware), Soundraw (not video-aware), Mirelo (SFX only, not music)',
  'Video-native generation (music is born from the video, not added after), temporal precision, scene-level awareness',
  6, 7, 6, 6, 8, 6, 8, 6.70,
  'researching',
  'Core technology overlaps significantly with our Session Musicians thesis. This could be the primary use case that proves video-aware generation works, then we expand to the full session musician product.',
  'Adham'
),
(
  'AI Stem Library',
  'On-demand generation of individual instrument loops and stems for music producers, infinitely customizable',
  'Music Production Tools',
  'Bedroom producers and beat-makers who spend hours searching sample libraries for the right loops',
  'Instead of browsing Splice or Loopmasters, producers describe what they want: "jazzy Rhodes piano loop, 90 BPM, minor key, laid-back feel." AI generates unique stems instantly. Every stem is royalty-free and unique. Integrates as a plugin in Ableton, Logic, FL Studio.',
  'Freemium + Upsell',
  'Splice (curated human samples), Loopmasters (same), Landr (mastering, not generation)',
  'Infinite, on-demand generation vs. finite library browsing. DAW plugin integration for in-workflow generation.',
  5, 5, 8, 3, 6, 7, 6, 5.60,
  'brainstorm',
  'Easy to build but very low moat — Splice or any well-funded player could add generative features. Commodity risk is high. Would need massive distribution or a unique data/quality advantage.',
  'Youssif'
);
