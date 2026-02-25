-- Seed data for archetypes and reference_startups
-- Auto-generated from seed_data.json
-- Total: 12 archetypes, 151 startups

DO $$
DECLARE
  arch_cv_sensors_for_physical_operations UUID;
  arch_healthcare_ai UUID;
  arch_robotics_physical_ai UUID;
  arch_ai_native_vertical_os UUID;
  arch_ai_agents_for_complex_workflows UUID;
  arch_ai_for_financial_services UUID;
  arch_compliance_grc_automation UUID;
  arch_voice_ai_conversational_agents UUID;
  arch_developer_ai_infrastructure UUID;
  arch_ai_powered_professional_services UUID;
  arch_consumer_ai_products UUID;
  arch_niche_unique_bets UUID;
BEGIN

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'CV/Sensors for Physical Operations', 7, '$214M', 'Bessemer Venture Partners, and more, Salesforce Ventures, Human Capital, Greycroft', 'Computer vision and IoT sensors applied to physical-world operations — monitoring, optimizing, and automating processes that humans currently eyeball.', 'This is the Retrocausal thesis. Physical operations generate massive data that''s never been captured digitally. Camera + AI = real-time intelligence layer. Investors see data moats: once you''re the camera in the room, the data compounds and no one can replicate it.', 'THIS IS YOUR CORE ARCHETYPE. Caddy = CV on OR cameras. Obvio uses stop sign cameras. H2Ok uses sensors in CPG manufacturing. AIM does embodied AI for earthmoving. Same pattern: existing physical infrastructure + AI = new data layer + operational intelligence.')
  RETURNING id INTO arch_cv_sensors_for_physical_operations;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Healthcare AI', 17, '$491M', 'Kivu Ventures and Greycroft, a16z and GV, Torch Capital, Kinnevik, Lumira Ventures', 'AI automating clinical, administrative, and operational healthcare workflows. From care delivery to billing to clinical trials.', 'Healthcare is a $4.5T market with terrible software. Post-COVID willingness to adopt tech is at all-time highs. a16z, GV, and Insight Partners are all deeply invested. The key: start with admin/ops (easier regulatory path), expand into clinical.', 'This is your direct competitive landscape. Note: most of these are admin-focused (Taxo, Anterior, Thatch) or care delivery (Counsel Health, Doctronic). Almost none touch surgical operations. That''s your white space.')
  RETURNING id INTO arch_healthcare_ai;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Robotics & Physical AI', 6, '$651M', 'Lux, and others, NVIDIA, CapitalG, The Garage', 'Foundation models and autonomous systems for physical-world robots. From factory automation to kitchen robots to warehouse logistics.', 'Physical Intelligence raised $600M for robot foundation models. NVIDIA, Sequoia, and Lux are all in. The bet: robotics is where AI meets atoms. Data is the moat — you need real-world interaction data to train these systems, and it''s expensive to collect.', 'Your second revenue stream (surgical motion data for robotics companies) plugs directly into this archetype. Physical Intelligence and others need structured motion data. You generate it as a byproduct of your primary business.')
  RETURNING id INTO arch_robotics_physical_ai;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'AI-Native Vertical OS', 10, '$390M', 'and others, Bessemer Venture Partners, Lightspeed Venture Partners, Markd, Weimob', 'Replace legacy software with AI-native operating systems purpose-built for specific industries. Not AI bolted onto existing tools — rebuilt from scratch with AI at the core.', 'Investors love this because it combines vertical SaaS defensibility with AI margins. These companies can charge 3-5x legacy pricing because they replace entire workflows, not just features. The ''AI-native'' framing signals a generational platform shift.', 'Caddy fits this archetype perfectly — you''re building the AI-native OS for surgical operations, not bolting analytics onto Epic.')
  RETURNING id INTO arch_ai_native_vertical_os;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'AI Agents for Complex Workflows', 10, '$224M', 'GV, Lightspeed Venture Partners, Insight Partners, Benchmark, a16z', 'Autonomous AI agents that handle multi-step, judgment-intensive work end-to-end. Not copilots — full agents that research, plan, and execute independently.', 'The copilot era is fading. Investors want agents that replace headcount, not augment it. The unit economics are compelling: one agent subscription vs. one FTE salary. Composio, Manus, and Coworker.ai represent the shift from ''AI assistant'' to ''AI employee''.', 'Your camera system is essentially an autonomous agent for OR management — it observes, diagnoses delays, and prescribes fixes without human input.')
  RETURNING id INTO arch_ai_agents_for_complex_workflows;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'AI for Financial Services', 16, '$259M', 'and others, Greylock, Detroit Venture Partners, ERA, and more', 'AI replacing manual processes in banking, insurance, lending, PE, and wealth management. Compliance-aware, regulation-ready, purpose-built for finance.', 'Finance is the highest-margin vertical for AI. Banks spend billions on manual processes. Regulatory complexity creates moats — you can''t just drop ChatGPT into a bank. YC and a16z are pouring into this space.', 'The PE-backed ASC buyer persona is a finance-first decision maker. Speak their language: contribution margin per case, IRR on camera install, payback period.')
  RETURNING id INTO arch_ai_for_financial_services;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Compliance & GRC Automation', 8, '$219M', 'Greycroft, Insight Partners, 10D, Index Ventures, NEA', 'AI automating regulatory compliance, governance, and risk management. From financial services compliance to government regulatory drafting.', 'Compliance spend is mandatory and growing. Every new regulation creates new demand. AI can reduce compliance costs 60-80% while improving accuracy. Lightspeed, Insight Partners, and a16z are funding this aggressively.', 'Hospital compliance (HIPAA, Joint Commission, CMS) is a natural expansion for Caddy once you have cameras in ORs. Surgical safety checklists, sterile field monitoring, instrument count verification are all compliance workflows.')
  RETURNING id INTO arch_compliance_grc_automation;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Voice AI & Conversational Agents', 7, '$74M', 'Bek Ventures, First Round Capital, Accel, First Harmonic, Crosslink and Threshold', 'Voice-first AI products that handle phone calls, customer service, and sales conversations autonomously.', 'Voice is the last major UI that AI hasn''t conquered. Call centers are a $340B global market. Voice AI agents can handle 80%+ of calls at 1/10th the cost. Accel and Lightspeed are leading rounds here.', 'Less directly relevant, but the pattern of ''AI replacing manual human process'' is the same. Your camera replaces manual nurse logging just like voice AI replaces manual call handling.')
  RETURNING id INTO arch_voice_ai_conversational_agents;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Developer & AI Infrastructure', 12, '$285M', 'Kleiner Perkins, GV and SYN Ventures, First Round Capital, Fusion Fund, Insight Partners', 'Tools, platforms, and infrastructure for building, monitoring, and deploying AI applications. The picks-and-shovels play for the AI gold rush.', 'Every AI company needs infrastructure. Braintrust ($80M for AI observability), Protege ($30M for AI data), Foxglove ($40M for physical AI data). Benchmark, ICONIQ, and a16z are funding the tooling layer.', 'Foxglove is particularly relevant — they''re building data infrastructure for physical AI. If Caddy generates structured surgical motion data, you might eventually need (or become) this kind of infrastructure.')
  RETURNING id INTO arch_developer_ai_infrastructure;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'AI-Powered Professional Services', 9, '$238M', '6 Degrees Capital, Founders Fund and Sequoia, and more, Accel, General Catalyst', 'AI replacing or augmenting expensive professional services: legal, accounting, consulting, financial advisory.', 'Professional services firms charge $200-1000/hour for work that''s increasingly automatable. AI can deliver 80% of the quality at 5% of the cost. Accel, Index Ventures, and Founders Fund are all active here.', 'The pattern of ''AI doing what expensive professionals do'' maps to surgical consulting. Top surgeons charge for technique coaching. Your camera provides the same feedback at scale.')
  RETURNING id INTO arch_ai_powered_professional_services;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Consumer AI Products', 9, '$1,266M', 'and others, GV, Shine Capital, OpenAI/Neuralink founders, Salesforce Ventures', 'AI products built directly for consumers — from app builders to personal AI assistants to health companions.', 'Lovable hit $2B valuation making AI app development accessible to non-developers. The consumer AI wave is cresting. Products that turn complex processes into simple interfaces win.', 'Less directly relevant to Caddy''s B2B model, but the ''make complex things simple'' principle applies. Your dashboard should make OR analytics as intuitive as Lovable makes app building.')
  RETURNING id INTO arch_consumer_ai_products;

  INSERT INTO archetypes (id, name, num_startups, total_capital, top_investors, investor_thesis, why_hot, relevance_to_caddy)
  VALUES (gen_random_uuid(), 'Niche/Unique Bets', 40, '$1,774M', 'Varana Capital, Bessemer Venture Partners, Triatomic Capital and Temasek, Crosslink Capital, Accel Partners', 'Startups that defy easy categorization — unique market insights, novel technology applications, or contrarian bets.', 'These represent founder conviction on overlooked markets. Investors fund these when the founder has unique insight that makes the opportunity non-obvious to everyone else.', 'CustoMED (AI for personalized surgical tools) is the closest analog to Caddy in this list. Generation Lab (biological age prediction) shows investor appetite for novel health data. Point One Navigation shows investor appetite for precision infrastructure.')
  RETURNING id INTO arch_niche_unique_bets;

  -- CV/Sensors for Physical Operations (7 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_cv_sensors_for_physical_operations, 'AIM', 'AI Applications', 'AIM, an embodied AI platform for earthmoving machinery', NULL, '$50M', 'Khosla Ventures, General Catalyst, Human Capital, and more', NULL, NULL, NULL, 31, 'Warm'),
    (arch_cv_sensors_for_physical_operations, 'SpAItial', 'AI Applications', 'SpAItial, an AI startup creating the ''holy grail'' model', 'seed', '$13M', 'Earlybird Venture Capital', NULL, NULL, NULL, 31, 'Warm'),
    (arch_cv_sensors_for_physical_operations, 'Foxglove', 'Data Infrastructure', 'Foxglove, a data and observability platform for the physical AI revolution', 'Series B', '$40M', 'Bessemer Venture Partners', NULL, NULL, NULL, 27, 'Cool'),
    (arch_cv_sensors_for_physical_operations, 'H2Ok Innovations', 'AI Applications', 'H2Ok Innovations, a startup providing AI-powered sensors for CPG manufacturing', 'Series A', '$12.4M', 'Greycroft', NULL, NULL, NULL, 26, 'Cool'),
    (arch_cv_sensors_for_physical_operations, 'Point One Navigation', 'Other', 'Precision-location startup Point One Navigation', 'Series C', '$35M', 'Khosla Ventures', NULL, NULL, NULL, 23, 'Cool'),
    (arch_cv_sensors_for_physical_operations, 'Obvio', 'Other', 'Obvio, a startup using stop sign cameras to detect unsafe drivers', 'Series A', '$22M', 'Bain Capital Ventures', NULL, NULL, NULL, 21, 'Cool'),
    (arch_cv_sensors_for_physical_operations, 'Fetcherr', 'Mobility / Transport', 'Fetcherr, an AI-based decision making platform for airlines', 'Series C', '$42M', 'Salesforce Ventures', NULL, NULL, NULL, 19, 'Low');

  -- Healthcare AI (17 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_healthcare_ai, 'Taxo', 'Frontier AI / ML', 'Taxo, a data extraction and reasoning engine for healthcare administration', 'seed', '$5M', 'YC, General Catalyst, and Character', NULL, NULL, NULL, 38, 'Warm'),
    (arch_healthcare_ai, 'Counsel Health', 'Healthcare / Digital Health', 'Counsel Health, a physician-supervised AI care platform', 'Series A', '$25M', 'a16z and GV', NULL, NULL, NULL, 36, 'Warm'),
    (arch_healthcare_ai, 'Biorce', 'Healthcare / Digital Health', 'Spanish AI clinical-trial platform Biorce', 'Series A', '$52M', 'DST Global Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_healthcare_ai, 'Anterior', 'Healthcare / Digital Health', 'AI health-plan workflow startup Anterior', NULL, '$40M', 'NEA, Sequoia, FPV, and Kinnevik', NULL, NULL, NULL, 33, 'Warm'),
    (arch_healthcare_ai, 'HOPPR', 'Frontier AI / ML', 'HOPPR, a medical AI imaging infrastructure company', 'Series A', '$31.5M', 'Kivu Ventures and Greycroft', NULL, NULL, NULL, 33, 'Warm'),
    (arch_healthcare_ai, 'Attuned Intelligence', 'Frontier AI / ML', 'Attuned Intelligence, a healthcare AI agents startup', 'seed', '$13M', 'Radical Ventures and Threshold Ventures', NULL, NULL, NULL, 33, 'Warm'),
    (arch_healthcare_ai, 'Corvia Medical', 'Healthcare / Digital Health', 'Corvia Medical, a company dedicated to transforming the treatment of heart failure', NULL, '$55M', 'Third Rock Ventures, General Catalyst, AccelMed, Lumira Ventures, and others', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'Tandem Health', 'Healthcare / Digital Health', 'AI healthcare startup Tandem Health', 'Series A', '$50M', 'Kinnevik', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'Ellipsis Health', 'Healthcare / Digital Health', 'Ellipsis Health, an AI healthcare technology company', 'Series A', '$45M', 'Salesforce, Khosla Ventures, and CVS Health Ventures', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'ExaCare AI', 'AI Applications', 'ExaCare AI, a company building an AI platform for post-acute care facilities', 'Series A', '$30M', 'Insight Partners', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'Blooming Health', 'Healthcare / Digital Health', 'Social care technology platform Blooming Health', 'Series A', '$26M', 'Insight Partners', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'NewDays', 'Healthcare / Digital Health', 'NewDays, a digital health startup focused on cognitive care', 'seed', '$7M', 'General Catalyst and Madrona', NULL, NULL, NULL, 31, 'Warm'),
    (arch_healthcare_ai, 'Thatch', 'Healthcare / Digital Health', 'Thatch, a startup transforming the health insurance experience for employers and employees', 'Series B', '$40M', 'Index Ventures', NULL, NULL, NULL, 28, 'Cool'),
    (arch_healthcare_ai, 'Sword Health', 'AI Applications', 'Sword Health, a Portuguese AI-powered digital health services', NULL, '$40M', 'General Catalyst', NULL, NULL, NULL, 26, 'Cool'),
    (arch_healthcare_ai, 'Fortuna Health', 'Healthcare / Digital Health', 'Fortuna Health, a consumer Medicaid navigation platform', 'Series A', '$18M', 'a16z', NULL, NULL, NULL, 26, 'Cool'),
    (arch_healthcare_ai, 'Bevel', 'Healthcare / Digital Health', 'AI health companion Bevel', 'Series A', '$10M', 'General Catalyst', NULL, NULL, NULL, 26, 'Cool'),
    (arch_healthcare_ai, 'Clara Home Care', 'Healthcare / Digital Health', 'Clara Home Care, a platform for in-home care for families', 'seed', '$3.1M', 'Torch Capital, Virtue, and Y Combinator', NULL, NULL, NULL, 26, 'Cool');

  -- Robotics & Physical AI (6 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_robotics_physical_ai, 'Physical Intelligence', 'Robotics / Autonomous', 'Foundation models for robots (pi0)', 'Series B', '$600M', 'CapitalG, Lux, Sequoia, NVIDIA', '~$37M est.', '$300/mo per robot sub', '$600M Series B at $5.6B valuation', 48, 'HOT'),
    (arch_robotics_physical_ai, 'Autonomous Technologies Group', 'Robotics / Autonomous', 'Autonomous Technologies Group, an AI financial advisor platform', 'pre-seed', '$15M', 'Y Combinator, Collaborative Group, Fusion Fund, and others', NULL, NULL, NULL, 43, 'HOT'),
    (arch_robotics_physical_ai, 'Gain', 'Robotics / Autonomous', 'Gain, an autonomous procurement AI startup', 'seed', '$12M', 'The Garage', NULL, NULL, NULL, 34, 'Warm'),
    (arch_robotics_physical_ai, 'Manex AI', 'Robotics / Autonomous', 'Manex AI, a German startup building an autonomous factory', 'seed', '$9M', 'Lightspeed Venture Partners and BlueYard Capital', NULL, NULL, NULL, 34, 'Warm'),
    (arch_robotics_physical_ai, 'Appetronix', 'Robotics / Autonomous', 'Appetronix, a startup building robotic kitchens for the foodservice industry', 'seed', '$6M', 'the Grote family and AlleyCorp', NULL, NULL, NULL, 32, 'Warm'),
    (arch_robotics_physical_ai, 'Central', 'Robotics / Autonomous', 'Central, an autonomous back office platform for startups', 'seed', '$8.6M', 'First Round Capital', NULL, NULL, NULL, 31, 'Warm');

  -- AI-Native Vertical OS (10 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_ai_native_vertical_os, 'Corgi', 'Frontier AI / ML', 'AI-native insurance carrier Corgi', 'seed', '$108M', 'Y Combinator, Kindred Ventures, Glade Brook, and others', '$40M+ (Jul 2025)', 'Sub-1% churn; 70 employees', '$108M at $630M; AI insurance carrier', 45, 'HOT'),
    (arch_ai_native_vertical_os, 'Omnea', 'Frontier AI / ML', 'Omnea, an AI-native procurement and intake orchestration platform', 'Series B', '$50M', 'Insight Partners and Khosla Ventures', NULL, NULL, NULL, 40, 'HOT'),
    (arch_ai_native_vertical_os, 'Avantos', 'Frontier AI / ML', 'Avantos, an AI-native OS for financial services', 'Series A', '$25M', 'Bessemer Venture Partners', NULL, NULL, NULL, 35, 'Warm'),
    (arch_ai_native_vertical_os, 'Reevo', 'Frontier AI / ML', 'Reevo, an AI-native GTM platform', NULL, '$80M', 'Khosla Ventures and Kleiner Perkins', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Sphere', 'Frontier AI / ML', 'Sphere, an AI-native tax compliance platform', 'Series A', '$21M', 'a16z', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Doctronic', 'Frontier AI / ML', 'Doctronic, an AI-native platform delivering fast, private, and personalized healthcare at scale', 'Series A', '$20M', 'Lightspeed Venture Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Irys', 'Frontier AI / ML', 'Irys, an insurtech startup building an AI-native OS', 'seed', '$12.5M', 'Markd', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Genstore', 'Frontier AI / ML', 'Genstore, an AI-native e-commerce startup', 'seed', '$10M', 'Weimob', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Convoke', 'Frontier AI / ML', 'Convoke, an AI-native OS for biopharma', 'seed', '$8.6M', 'Kleiner Perkins and Dimension Capital', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_native_vertical_os, 'Tabs', 'Frontier AI / ML', 'Tabs, an AI-native revenue platform', 'Series B', '$55M', 'Lightspeed Venture Partners', NULL, NULL, NULL, 30, 'Warm');

  -- AI Agents for Complex Workflows (10 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_ai_agents_for_complex_workflows, 'Trase', 'Frontier AI / ML', 'Autonomous AI agent platform Trase', 'pre-seed', '$10.5M', 'Red Cell Partners and Virginia Innovation Partnership Corporation', NULL, NULL, NULL, 35, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'Supersonik', 'Frontier AI / ML', 'Supersonik, a Spanish autonomous multilingual AI agent', 'seed', '$5M', 'a16z', NULL, NULL, NULL, 35, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'Delve', 'Frontier AI / ML', 'Delve, a startup building AI agents for compliance', 'Series A', '$32M', 'Insight Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'Composio', 'Frontier AI / ML', 'Composio, a startup building AI agents that improve over time', 'Series A', '$25M', 'Lightspeed Venture Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'StackOne', 'Frontier AI / ML', 'StackOne, a UK AI-powered platform for AI agents and SaaS integrations', 'Series A', '$20M', 'GV', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'Coworker.ai', 'Frontier AI / ML', 'Coworker.ai, an AI agent that can independently research, plan, and execute complex work', 'seed', '$13M', 'Jeff Huber', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'GeneralMind', 'Enterprise SaaS', 'GeneralMind, a German AI workflow automation startup, secured a $12M pre-seed round led by Lakestar', 'pre-seed', '$12M', 'Lakestar', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'Skygen.AI', 'AI Applications', 'Skygen.AI, an autonomous AI platform for enterprise software automation', 'seed', '$7M', NULL, NULL, NULL, NULL, 30, 'Warm'),
    (arch_ai_agents_for_complex_workflows, 'InstaLILY', 'Enterprise SaaS', 'InstaLILY, a startup building AI teammates for enterprise industries', 'Series A', '$25M', 'Insight Partners', NULL, NULL, NULL, 29, 'Cool'),
    (arch_ai_agents_for_complex_workflows, 'Manus', 'Frontier AI / ML', 'Manus, an AI agent platform for businesses', NULL, '$75M', 'Benchmark', NULL, NULL, NULL, 28, 'Cool');

  -- AI for Financial Services (16 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_ai_for_financial_services, 'Meridian', 'AI Applications', 'Meridian, an AI-powered financial-modeling spreadsheet startup', 'seed', '$17M', 'a16z, Litquidity Ventures, and others', NULL, NULL, NULL, 38, 'Warm'),
    (arch_ai_for_financial_services, 'Veritus', 'Frontier AI / ML', 'Voice-first lending AI agent startup Veritus', 'seed', '$10.1M', 'Crosslink and Threshold', NULL, NULL, NULL, 37, 'Warm'),
    (arch_ai_for_financial_services, 'Keye', 'AI Applications', 'Keye, an AI platform for PE due diligence', 'seed', '$5M', 'Sorenson Capital, General Catalyst, Y Combinator, ERA, and more', NULL, NULL, NULL, 36, 'Warm'),
    (arch_ai_for_financial_services, 'Clove', 'Fintech', 'Clove, a UK startup reshaping the economics of financial advice', 'pre-seed', '$14M', 'Accel', NULL, NULL, NULL, 34, 'Warm'),
    (arch_ai_for_financial_services, 'Sympera AI', 'Fintech', 'Sympera AI, a startup providing agentic AI for the banking sector', 'seed', '$10M', 'Nyca Partners and Viola Ventures', NULL, NULL, NULL, 34, 'Warm'),
    (arch_ai_for_financial_services, 'Fulcrum', 'AI Applications', 'Fulcrum, an AI platform for insurance brokerages', 'Seed', '$25M', 'CRV', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_for_financial_services, 'Foresight', 'Frontier AI / ML', 'Foresight, a SaaS startup building a data and AI infrastructure layer for private markets', 'seed', '$5.5M', 'NEA', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_for_financial_services, 'Knight FinTech', 'Fintech', 'Banking infrastructure startup Knight FinTech', 'Series A', '$23.6M', 'Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_for_financial_services, 'Aboon', 'AI Applications', 'Aboon, an AI-powered platform helping financial advisors launch and manage 401(k) plans', 'seed', '$17.5M', 'Bain Capital Ventures', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_for_financial_services, 'Oolka', 'AI Applications', 'Oolka, an AI-driven credit management platform', 'seed', '$7M', 'Lightspeed India Partners and Z47', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_for_financial_services, 'Moment', 'Fintech', 'Moment, a fintech modernizing fixed income trading ops', NULL, '$36M', 'Index Ventures and a16z', NULL, NULL, NULL, 29, 'Cool'),
    (arch_ai_for_financial_services, 'Longeye', 'Fintech', 'AI investigations startup Longeye', 'seed', '$5M', 'a16z', NULL, NULL, NULL, 29, 'Cool'),
    (arch_ai_for_financial_services, 'Samaya AI', 'Frontier AI / ML', 'Samaya AI, a startup creating AI models that assist financial analysts', NULL, '$43.5M', 'NEA', NULL, NULL, NULL, 28, 'Cool'),
    (arch_ai_for_financial_services, 'Greenlite AI', 'Frontier AI / ML', 'Greenlite AI, a leading AI agent platform for financial services', 'Series A', '$15M', 'Greylock', NULL, NULL, NULL, 28, 'Cool'),
    (arch_ai_for_financial_services, 'Atlas Invest', 'AI Applications', 'Atlas Invest, an AI-powered CRE private credit platform', NULL, '$25M', 'BlackRock', NULL, NULL, NULL, 18, 'Low'),
    (arch_ai_for_financial_services, 'Relcu', 'Frontier AI / ML', 'Relcu, a unified CRM and AI agent co-pilot for financial services', NULL, NULL, 'Menlo Ventures, Detroit Venture Partners, and others', NULL, NULL, NULL, 13, 'Low');

  -- Compliance & GRC Automation (8 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_compliance_grc_automation, 'Duna', 'Cybersecurity', 'Duna, a Dutch platform for compliant business identity', 'seed', '$12M', 'Index Ventures', NULL, NULL, NULL, 36, 'Warm'),
    (arch_compliance_grc_automation, 'Condukt', 'Enterprise SaaS', 'Condukt, a next-generation compliance platform for financial services', 'seed', '$10M', 'Lightspeed Venture Partners and MMC Ventures', NULL, NULL, NULL, 36, 'Warm'),
    (arch_compliance_grc_automation, 'WithCoverage', 'AI Applications', 'WithCoverage, an AI-enabled risk-management platform', 'Series B', '$42M', 'Sequoia Capital and Khosla Ventures', NULL, NULL, NULL, 35, 'Warm'),
    (arch_compliance_grc_automation, 'Vulcan Technologies', 'Enterprise SaaS', 'Vulcan Technologies, a reg-tech startup helping government agencies and legal professionals with regulatory drafting and compliance', 'seed', '$10.9M', 'General Catalyst and Cubit Capital', NULL, NULL, NULL, 34, 'Warm'),
    (arch_compliance_grc_automation, 'Delve', 'Frontier AI / ML', 'Delve, a startup building AI agents for compliance', 'Series A', '$32M', 'Insight Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_compliance_grc_automation, 'Safebooks', 'Biotech / Pharma', 'Safebooks, an AI revenue data governance startup', 'seed', '$15M', '10D', NULL, NULL, NULL, 31, 'Warm'),
    (arch_compliance_grc_automation, 'ConductorOne', 'Frontier AI / ML', 'ConductorOne, an AI-native identity security platform', 'Series B', '$79M', 'Greycroft', NULL, NULL, NULL, 30, 'Warm'),
    (arch_compliance_grc_automation, 'Zania', 'AI Applications', 'Zania, an AI-driven GRC automation startup', 'Series A', '$18M', 'NEA', NULL, NULL, NULL, 26, 'Cool');

  -- Voice AI & Conversational Agents (7 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_voice_ai_conversational_agents, 'Veritus', 'Frontier AI / ML', 'Voice-first lending AI agent startup Veritus', 'seed', '$10.1M', 'Crosslink and Threshold', NULL, NULL, NULL, 37, 'Warm'),
    (arch_voice_ai_conversational_agents, 'Simple AI', 'AI Applications', 'Voice-AI platform Simple AI', 'seed', '$14M', 'First Harmonic', NULL, NULL, NULL, 35, 'Warm'),
    (arch_voice_ai_conversational_agents, 'Synthflow', 'AI Applications', 'Synthflow, a German easy-to-setup enterprise-grade conversational AI platform', 'Series A', '$20M', 'Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_voice_ai_conversational_agents, 'Lace AI', 'AI Applications', 'Lace AI, an AI-powered customer service software for home services', 'seed', '$14M', 'Bek Ventures', NULL, NULL, NULL, 31, 'Warm'),
    (arch_voice_ai_conversational_agents, 'Cactus', 'AI Applications', 'Cactus, an AI copilot to automate calls and bookings for home service businesses', 'seed', '$7M', 'Wellington Management and Y Combinator', NULL, NULL, NULL, 31, 'Warm'),
    (arch_voice_ai_conversational_agents, 'Solda.AI', 'AI Applications', 'Solda.AI, a German AI-driven telesales automation startup', 'seed', '$4M', 'Accel', NULL, NULL, NULL, 26, 'Cool'),
    (arch_voice_ai_conversational_agents, 'Flai', 'AI Applications', 'Car dealership AI startup Flai', 'seed', '$4.5M', 'First Round Capital', NULL, NULL, NULL, 23, 'Cool');

  -- Developer & AI Infrastructure (12 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_developer_ai_infrastructure, 'Onyx', 'Enterprise SaaS', 'Onyx, an open-source solution for enterprise search', 'seed', '$10M', 'Khosla Ventures and First Round Capital', NULL, NULL, NULL, 36, 'Warm'),
    (arch_developer_ai_infrastructure, 'WisdomAI', 'Data Infrastructure', 'AI data analytics startup WisdomAI', 'Series A', '$50M', 'Kleiner Perkins', NULL, NULL, NULL, 35, 'Warm'),
    (arch_developer_ai_infrastructure, 'Tsuga', 'Data Infrastructure', 'French observability platform Tsuga', 'seed', '$10M', 'General Catalyst', NULL, NULL, NULL, 35, 'Warm'),
    (arch_developer_ai_infrastructure, 'Tavily', 'Frontier AI / ML', 'Tavily, a startup connecting AI agents to the web', 'Series A', '$20M', 'Insight Partners', NULL, NULL, NULL, 33, 'Warm'),
    (arch_developer_ai_infrastructure, 'Supper', 'Frontier AI / ML', 'AI-native data platform Supper', 'seed', '$11M', 'Union Square Ventures', NULL, NULL, NULL, 33, 'Warm'),
    (arch_developer_ai_infrastructure, 'Braintrust', 'Data Infrastructure', 'AI observability startup Braintrust', 'Series B', '$80M', 'ICONIQ', NULL, NULL, NULL, 32, 'Warm'),
    (arch_developer_ai_infrastructure, 'Protege', 'Data Infrastructure', 'AI data platform Protege', 'Series A', '$30M', 'a16z', NULL, NULL, NULL, 32, 'Warm'),
    (arch_developer_ai_infrastructure, 'Crash Override', 'Mobility / Transport', 'Crash Override, an Engineering Relationship Management platform', 'seed', '$28M', 'GV and SYN Ventures', NULL, NULL, NULL, 32, 'Warm'),
    (arch_developer_ai_infrastructure, 'AgileRL', 'Frontier AI / ML', 'AgileRL, a reinforcement-learning software startup', 'seed', '$7.5M', 'Fusion Fund', NULL, NULL, NULL, 32, 'Warm'),
    (arch_developer_ai_infrastructure, 'Polars', 'Data Infrastructure', 'Open-source data platform Polars', 'Series A', '$21M', 'Accel', NULL, NULL, NULL, 30, 'Warm'),
    (arch_developer_ai_infrastructure, 'Definite', 'Data Infrastructure', 'Definite, a startup reducing the time it takes to set up an analytics stack', 'seed', '$10M', 'Costanoa Ventures', NULL, NULL, NULL, 30, 'Warm'),
    (arch_developer_ai_infrastructure, 'Blaxel', 'Frontier AI / ML', 'Blaxel, a cloud infrastructure company designed specifically for AI agents', 'seed', '$7.3M', 'First Round Capital', NULL, NULL, NULL, 30, 'Warm');

  -- AI-Powered Professional Services (9 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_ai_powered_professional_services, 'Enter', 'Legal Tech', 'LatAm legal AI startup Enter', 'Series A', '$35M', 'Founders Fund and Sequoia', NULL, NULL, NULL, 33, 'Warm'),
    (arch_ai_powered_professional_services, 'Adaptive Security', 'AI Applications', 'Adaptive Security, an AI-powered social engineering prevention solutions', 'Series A', '$43M', 'a16z and OpenAI', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_powered_professional_services, 'Campfire', 'AI Applications', 'AI-powered accounting startup Campfire', 'Series A', '$35M', 'Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_powered_professional_services, 'Conveo', 'AI Applications', 'Conveo, an AI-powered research coworker', 'seed', '$5.3M', 'Y Combinator, 6 Degrees Capital, Entourage, and more', NULL, NULL, NULL, 31, 'Warm'),
    (arch_ai_powered_professional_services, 'Prophet Security', 'Enterprise SaaS', 'Prophet Security, a startup using AI to automate security operations', 'Series A', '$30M', 'Accel', NULL, NULL, NULL, 29, 'Cool'),
    (arch_ai_powered_professional_services, 'Stuut Technologies', 'Enterprise SaaS', 'Stuut Technologies, an AI accounts-receivable automation startup', 'Series A', '$29.5M', 'a16z', NULL, NULL, NULL, 29, 'Cool'),
    (arch_ai_powered_professional_services, 'Pantomath', 'AI Applications', 'Pantomath, an AI-powered data operations platform', 'Series B', '$30M', 'General Catalyst', NULL, NULL, NULL, 28, 'Cool'),
    (arch_ai_powered_professional_services, 'Wordsmith AI', 'Legal Tech', 'Scottish legal tech startup Wordsmith AI', 'Series A', '$25M', 'Index Ventures', NULL, NULL, NULL, 28, 'Cool'),
    (arch_ai_powered_professional_services, 'Wexler.ai', 'AI Applications', 'Wexler.ai, a European AI platform for complex litigation', 'seed', '$5.3M', 'Pear VC', NULL, NULL, NULL, 26, 'Cool');

  -- Consumer AI Products (9 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_consumer_ai_products, 'Mindstate Design Labs', 'Wellness / Fitness', 'AI psychedelics without hallucinations', 'Series A', '$24.3M', 'YC, OpenAI/Neuralink founders', 'Pre-revenue', '70K+ trip reports analyzed', 'AI psychedelics w/o hallucinations', 48, 'HOT'),
    (arch_consumer_ai_products, 'Oura', 'Wellness / Fitness', 'Smart ring; 5.5M+ sold; $1B+ projected rev', 'Series E', '$900M', 'Fidelity, ICONIQ', '$1B+ proj 2025', '5.5M+ rings sold', '$900M Series E at $11B valuation', 42, 'HOT'),
    (arch_consumer_ai_products, 'Kindred', 'Consumer / Social', 'Kindred, a community-driven home-swapping platform', 'Series B', '$125M', 'NEA and Figma CEO Dylan Field and an $85M Series C led by Index Ventures', NULL, NULL, NULL, 38, 'Warm'),
    (arch_consumer_ai_products, 'Turnout', 'Frontier AI / ML', 'Turnout, an AI-powered consumer service that reimagines how Americans navigate complex government and financial processes', 'seed', '$21M', 'Shine Capital and LGVP', NULL, NULL, NULL, 38, 'Warm'),
    (arch_consumer_ai_products, 'Human Behavior', 'AI Applications', 'Human Behavior, a startup using AI to study online behavior', 'seed', '$5M', 'General Catalyst, Y Combinator, and others', NULL, NULL, NULL, 36, 'Warm'),
    (arch_consumer_ai_products, 'Lovable', 'AI Applications', 'Lovable, a Swedish AI startup enabling users to build full stack web apps from simple prompts', NULL, '$150M', 'simple prompts, raised a $150M+ round at a ~$2B valuation led by Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_consumer_ai_products, 'Bliss Aesthetics', 'AI Applications', 'Bliss Aesthetics, an AI platform for cosmetic enhancement', 'seed', '$17.5M', 'Shine Capital', NULL, NULL, NULL, 31, 'Warm'),
    (arch_consumer_ai_products, 'Rocket.new', 'AI Applications', 'Rocket.new, an Indian AI-powered app development platform', 'seed', '$15M', 'Salesforce Ventures', NULL, NULL, NULL, 31, 'Warm'),
    (arch_consumer_ai_products, 'Continua', 'AI Applications', 'Continua, a startup building a consumer-facing AI chatbot', 'seed', '$8M', 'GV', NULL, NULL, NULL, 31, 'Warm');

  -- Niche/Unique Bets (40 startups)
  INSERT INTO reference_startups (archetype_id, company, industry, one_liner, stage, amount_raised, key_investors, arr_revenue, key_traction, latest_news, score, interest)
  VALUES
    (arch_niche_unique_bets, 'Beacon Software', 'AI Applications', 'Beacon Software, an AI-driven software for various industries', 'Series B', '$250M', 'General Catalyst, Lightspeed Venture Partners, and D1 Capital', NULL, NULL, NULL, 43, 'HOT'),
    (arch_niche_unique_bets, 'Proxima', 'AI Applications', 'Proxima, an AI-driven proximity therapeutics startup', 'seed', '$80M', 'DCVC', NULL, NULL, NULL, 43, 'HOT'),
    (arch_niche_unique_bets, 'Mirelo', 'Other', 'AI audio startup Mirelo', 'seed', '$41M', 'Index Ventures and a16z', NULL, NULL, NULL, 41, 'HOT'),
    (arch_niche_unique_bets, 'Viven', 'AI Applications', 'Viven, an AI digital twin startup', 'seed', '$35M', 'Khosla Ventures, Foundation Capital, FPV Ventures, and others', NULL, NULL, NULL, 41, 'HOT'),
    (arch_niche_unique_bets, 'The Mobile-First Company', 'AI Applications', 'The Mobile-First Company, a mobile AI suite for SMB teams', 'seed', '$12M', 'Base10 Partners and Lightspeed Venture Partners', NULL, NULL, NULL, 38, 'Warm'),
    (arch_niche_unique_bets, 'Descope', 'Other', 'No-code IAM startup Descope', 'seed', '$35M', 'Notable Capital, Lightspeed, Dell Technologies Capital, and others', NULL, NULL, NULL, 36, 'Warm'),
    (arch_niche_unique_bets, 'Context', 'AI Applications', 'AI-powered office suite startup Context', 'seed', '$11M', 'Lux Capital', NULL, NULL, NULL, 36, 'Warm'),
    (arch_niche_unique_bets, 'Skyramp', 'AI Applications', 'Skyramp, an AI-driven testing platform', 'seed', '$10M', 'Sequoia Capital', NULL, NULL, NULL, 36, 'Warm'),
    (arch_niche_unique_bets, 'Datafy', 'Cloud / Infrastructure', 'Cloud storage management platform Datafy', 'seed', '$20M', 'Bessemer Venture Partners', NULL, NULL, NULL, 34, 'Warm'),
    (arch_niche_unique_bets, 'Venice', 'Cybersecurity', 'Identity-and-access management startup Venice', 'Series A', '$20M', 'IVP', NULL, NULL, NULL, 33, 'Warm'),
    (arch_niche_unique_bets, 'Poseidon', 'Crypto / Web3', 'Poseidon, a decentralized AI data layer', 'seed', '$15M', 'a16z Crypto', NULL, NULL, NULL, 33, 'Warm'),
    (arch_niche_unique_bets, 'nunu.ai', 'Frontier AI / ML', 'nunu.ai, a startup building AI agents capable of testing and playing games', 'seed', '$6M', 'Tirta Ventures and a16z', NULL, NULL, NULL, 33, 'Warm'),
    (arch_niche_unique_bets, 'd-Matrix', 'Frontier AI / ML', 'd-Matrix, a startup building an inference platform for data centers', 'Series C', '$275M', 'BullhoundCapital, Triatomic Capital and Temasek', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Linear', 'Enterprise SaaS', 'Project management Enterprise software startup Linear', 'Series C', '$82M', 'Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Nexos.ai', 'AI Applications', 'European AI startup Nexos.ai', 'Series A', '$35M', 'Index Ventures and Evantic Capital', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Maisa AI', 'AI Applications', 'Maisa AI, a startup building an accountable, non-black box AI platform', 'seed', '$25M', 'Creandum', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Vinyl Equity', 'Other', 'Vinyl Equity, a transfer agent for listed companies', 'seed', '$11.5M', 'Index Ventures and Spark Capital', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Generation Lab', 'Other', 'Generation Lab, a startup using DNA methylation to predict biological age', 'seed', '$11M', 'Accel', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Julius', 'Other', 'AI data analyst startup Julius', 'seed', '$10M', 'Bessemer Venture Partners', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Spacial', 'AI Applications', 'Spacial, an AI-powered platform for automating residential engineering and permitting', 'seed', '$10M', 'TLV Partners', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Sphinx', 'AI Applications', 'Sphinx, a startup building AI for data', 'seed', '$9.5M', 'Lightspeed', NULL, NULL, NULL, 31, 'Warm'),
    (arch_niche_unique_bets, 'Depthfirst', 'Other', 'AI security startup Depthfirst', 'Series A', '$40M', 'Accel Partners', NULL, NULL, NULL, 30, 'Warm'),
    (arch_niche_unique_bets, 'CustoMED', 'Longevity / Anti-Aging', 'CustoMED, a startup using AI to create personalized surgical tools and implants', 'seed', '$6M', 'Longevity Venture Partners, Varana Capital, and more', NULL, NULL, NULL, 30, 'Warm'),
    (arch_niche_unique_bets, 'Better Auth', 'Developer Tools', 'Better Auth, an open source framework for devs to simplify user authentication', 'seed', '$5M', 'Peak XV, Y Combinator, P1 Ventures, and Chapter One', NULL, NULL, NULL, 30, 'Warm'),
    (arch_niche_unique_bets, 'Goodfire', 'Enterprise SaaS', 'Interpretability-focused AI lab Goodfire', 'Series B', '$150M', 'B Capital', NULL, NULL, NULL, 29, 'Cool'),
    (arch_niche_unique_bets, 'Exa', 'Other', 'AI search infrastructure startup Exa', 'Series B', '$85M', 'Benchmark', NULL, NULL, NULL, 29, 'Cool'),
    (arch_niche_unique_bets, 'Fastbreak AI', 'Enterprise SaaS', 'Youth and amateur sports operations startup Fastbreak AI', 'Series A', '$40M', 'Greycroft and GTMfund', NULL, NULL, NULL, 29, 'Cool'),
    (arch_niche_unique_bets, 'QFX', 'Quantum Computing', 'UK-based quantum startup QFX', 'seed', '$2.5M', 'Y Combinator co-founder Paul Graham', NULL, NULL, NULL, 28, 'Cool'),
    (arch_niche_unique_bets, 'Motive Technologies', 'Mobility / Transport', 'Fleet tracking and driver safety startup Motive Technologies', NULL, '$150M', 'Kleiner Perkins ahead of a potential IPO', NULL, NULL, NULL, 27, 'Cool'),
    (arch_niche_unique_bets, 'Hedra', 'Media / Entertainment', 'AI video generator startup Hedra', 'Series A', '$32M', 'a16z', NULL, NULL, NULL, 27, 'Cool'),
    (arch_niche_unique_bets, 'Zed', 'Developer Tools', 'Collaborative coding startup Zed', 'Series B', '$32M', 'Sequoia', NULL, NULL, NULL, 27, 'Cool'),
    (arch_niche_unique_bets, 'Sweep', 'Space / Aerospace', 'Sweep, an agentic workspace for business systems', 'Series B', '$22.5M', 'Insight Partners', NULL, NULL, NULL, 27, 'Cool'),
    (arch_niche_unique_bets, 'Alta', 'Real Estate / PropTech', 'Alta, a startup building a personal stylist using AI', 'seed', '$11M', 'Menlo Ventures', NULL, NULL, NULL, 27, 'Cool'),
    (arch_niche_unique_bets, 'Shield', 'Fintech', 'IT services and AI automation platform Shield', NULL, '$100M', 'Thrive Holdings', NULL, NULL, NULL, 26, 'Cool'),
    (arch_niche_unique_bets, 'Unframe', 'AI Applications', 'Unframe, an all-in-one turnkey AI platform for global enterprises', NULL, '$50M', 'Bessemer Venture Partners, TLV Partners, and more', NULL, NULL, NULL, 26, 'Cool'),
    (arch_niche_unique_bets, 'Ankar', 'AI Applications', 'Ankar, a UK AI platform for inventors', 'seed', '$4M', 'Index Ventures', NULL, NULL, NULL, 26, 'Cool'),
    (arch_niche_unique_bets, 'Intangible AI', 'Other', 'Intangible AI, a no-code 3D creation tool for filmmakers and game designers', 'seed', '$4M', 'a16z Speedrun, Crosslink Capital, and angels', NULL, NULL, NULL, 21, 'Cool'),
    (arch_niche_unique_bets, 'OpenFX', 'Fintech', 'OpenFX, an FX infrastructure platform for cross-border payments', NULL, '$23M', 'Accel', NULL, NULL, NULL, 19, 'Low'),
    (arch_niche_unique_bets, 'Hello Soju', 'E-Commerce / Marketplace', 'Hello Soju, a ready-to-drink sparkling soju brand', NULL, '$6.8M', 'Kleiner Perkins and Ballistic Ventures', NULL, NULL, NULL, 18, 'Low'),
    (arch_niche_unique_bets, 'Zoca', 'Other', 'AI startup Zoca raised a $6M round led by Accel', NULL, '$6M', 'Accel', NULL, NULL, NULL, 16, 'Low');

END $$;