# Exploration Tracker — Architecture & Flow Documentation

> Internal tool for Caddy's 3-person team (Adham, Aly, Youssif) to run a structured
> 2-week industry exploration sprint before YC W25 decisions (Mar 13) and SF trip (Mar 14).

---

## 1. What This Tool Does

Caddy's core product is CV analytics for surgical operating rooms. Before committing to a
direction at YC, the team is running a rapid exploration process to evaluate alternative
startup ideas across industries. This tool manages the entire pipeline:

1. **Generate** ideas by crossing industry verticals with startup archetypes
2. **Score** each idea across 8 criteria using AI
3. **Filter** ideas through a cascading funnel with adjustable thresholds
4. **Research** comparable startups from a 2,848-company reference database
5. **Validate** top ideas through customer discovery conversations
6. **Coordinate** work via tasks and meeting scheduling for the SF trip

---

## 2. Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | Next.js 14.2.35 (App Router, `force-dynamic`)   |
| Styling      | Tailwind CSS                                     |
| Database     | Supabase (Postgres + Realtime subscriptions)     |
| AI           | Claude Sonnet 4 (`claude-sonnet-4-20250514`) via Anthropic API |
| Deployment   | Vercel                                           |
| Auth         | None — localStorage name picker (Adham/Aly/Youssif) |

### Key IDs

- **Vercel project**: `prj_sPGmpqX0zHSg6LYYa3DVaBbO1pDJ` (team `team_e2cCdHD67MFSfKdCSW1h1kcf`)
- **Supabase project**: `vznijwxjvegczqhcgnji` (us-east-1, "Surgo.co CRM")
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`

---

## 3. Database Schema (Supabase)

All tables have RLS enabled with permissive policies (internal tool, no real auth).

### Core Tables

```
ideas
├── id (uuid, PK)
├── name (text)
├── description (text)
├── vertical (text)
├── archetype_id (uuid, FK → archetypes)
├── status (text: 'new' | 'scoring' | 'scored' | 'selected' | 'rejected')
├── created_by (text: team member name)
├── created_at (timestamptz)
│
├── SCORES (all integer, nullable — null means not yet scored)
│   ├── tam_score           — Total Addressable Market (1-10)
│   ├── competition_score   — Competition level (text: 'Low'/'Medium'/'High')
│   ├── problem_severity    — How painful is the problem (1-10)
│   ├── market_founder_fit  — Team-market alignment (1-10)
│   ├── execution_difficulty — How hard to build (1-10, lower is easier)
│   ├── time_to_100m_arr    — Months to $100M ARR (integer)
│   ├── second_buyer        — Would a 2nd buyer type pay? (1-10)
│   └── passion             — Team passion for this space (1-10)
│
├── total_score (integer) — Computed: severity + mf_fit + (11 - exec) + 2nd_buyer + passion (max 50)
├── score_reasoning (jsonb) — Per-criterion AI explanations
├── notes (text)
└── comps (text) — Cached comparable companies
```

```
archetypes (13 rows)
├── id (uuid, PK)
├── name (text) — e.g., "Vertical SaaS", "AI-First Workflow Automation"
├── investor_thesis (text)
├── why_hot (text)
├── relevance_to_caddy (text)
└── sort_order (integer)
```

```
reference_startups (2,848 rows)
├── id (uuid, PK)
├── archetype_id (uuid, FK → archetypes)
├── company (text)
├── industry (text)
├── one_liner (text)
├── stage (text)
├── amount_raised (text)
├── key_investors (text)
├── is_standout (boolean)
├── interest (text: 'interested' | 'not_interested' | null)
└── notes (text)
```

```
verticals_list (35 rows)
├── id (uuid, PK)
├── name (text) — e.g., "Healthcare", "Construction", "Legal"
├── created_at (timestamptz)
└── is_active (boolean)
```

### Tracking Tables

```
conversations (customer discovery logs)
├── id, idea_id (FK), contact_name, contact_role, contact_org
├── date, conducted_by, signal_strength (1-5)
├── summary, key_quotes, next_steps
└── created_at
```

```
tasks (kanban board)
├── id, title, description
├── status ('todo' | 'in_progress' | 'done')
├── phase ('desktop_research' | 'talk_to_users' | 'sf_prep')
├── assigned_to, due_date, sort_order
└── created_at
```

```
sf_meetings (SF trip pipeline)
├── id, company, contact_name, contact_role
├── meeting_type ('vc' | 'angel' | 'operator' | 'accelerator' | 'other')
├── status ('need_intro' | 'intro_sent' | 'replied' | 'scheduled' | 'confirmed' | 'completed' | 'no_response')
├── date, time, location, intro_through
├── notes, assigned_to, sort_order
└── created_at
```

### Scoring / Legacy Tables

```
idea_scores     — Individual team member scores (currently unused, 0 rows)
vertical_scores — Vertical scoring (currently unused, 0 rows)
verticals       — Legacy verticals table (4 rows, superseded by verticals_list)
```

---

## 4. Application Flow (Page by Page)

### 4.1 Layout & Navigation

**File**: `src/app/layout.tsx`, `src/components/Sidebar.tsx`, `src/lib/UserContext.tsx`

- Root layout wraps everything in `UserProvider`
- If no user in localStorage → shows name picker screen (Adham / Aly / Youssif)
- Fixed sidebar (w-56) with 7 nav items + user avatar at bottom
- Main content area scrolls independently

### 4.2 Dashboard (`/`) — Funnel Visualization

**File**: `src/app/page.tsx` (~516 lines)

**Purpose**: Bird's-eye view of the entire idea pipeline as a cascading funnel.

**Flow**:
1. Fetches all ideas via `useIdeas()` hook
2. Applies funnel filters sequentially — each step narrows the previous set
3. Renders horizontal bars showing how many ideas pass each filter
4. Two sections: **Desktop Research** (5 filters) and **Talk to Users** (3 filters)
5. Expandable rows show which specific ideas pass/fail at each step
6. Stats row at top: Total Ideas → Scored → Passing Desktop → Passing All → Selected
7. Filter thresholds are adjustable via a settings panel (persisted to localStorage)
8. Clicking a funnel step count links to `/ideas?filter=<step_key>`

**Funnel Steps** (from `filterConfig.ts`):
1. TAM > $1B
2. Competition = Low or Medium
3. Problem Severity ≥ 8
4. Market-Founder Fit ≥ 8
5. Execution Difficulty ≤ 5
--- phase boundary ---
6. Time to $100M ARR ≤ 60 months
7. Second Buyer ≥ 8
8. Passion ≥ 8

### 4.3 Idea Generator (`/generate`)

**File**: `src/app/generate/page.tsx` (~395 lines)

**Purpose**: Create new startup ideas via AI or manual input.

**Flow (AI Generation)**:
1. User selects verticals (from 35) and archetypes (from 13) via checkbox grids
2. Can add new verticals/archetypes inline (saved to DB)
3. Clicks "Generate Ideas" → POST `/api/generate` with selected verticals + archetypes
4. Claude generates 10 ideas as JSON array
5. Ideas appear in a results list with name, description, vertical, archetype
6. User clicks "Add to Pipeline" on any idea → inserts to `ideas` table → auto-triggers scoring via `/api/score`
7. While scoring, shows spinner; on completion, redirects to `/ideas`

**Flow (Manual Input)**:
1. User types freeform idea text in textarea
2. Clicks "Add & Score" → POST `/api/score` with `raw_input`
3. Claude first extracts name/description/vertical, then scores
4. Result inserted into `ideas` table with scores

### 4.4 Ideas Pipeline (`/ideas`)

**File**: `src/app/ideas/page.tsx` (~767 lines)

**Purpose**: Main working table for reviewing and managing scored ideas.

**Features**:
- Full table with columns: Name, Vertical, TAM, Competition, Severity, MF Fit, Exec Difficulty, $100M ARR, 2nd Buyer, Passion, Total Score
- All score columns are sortable (click header to toggle asc/desc)
- Funnel step filter buttons at top (synced with URL `?filter=` param from dashboard links)
- Color-coded scores: green (good) → yellow → red (bad)
- Click any score cell → popover showing AI reasoning for that criterion
- **Re-score button**: Sends idea back to `/api/score` for fresh AI evaluation
- **Comps button**: Opens modal, calls `/api/comps` to find comparable startups from reference DB
- **Click idea name**: Opens detail modal with full score breakdown, reasoning, notes, delete option
- **CSV Export**: Downloads all visible ideas as CSV
- **Status management**: Ideas can be marked as selected/rejected

### 4.5 Reference Database (`/reference`)

**File**: `src/app/reference/page.tsx` (~342 lines)

**Purpose**: Browse the 2,848-startup reference database organized by archetype.

**Features**:
- Top section: Grid of 13 archetype cards showing count + total capital raised
- Click archetype card → filters table below to that archetype
- Filters: text search, standout toggle, industry dropdown, stage dropdown, interest filter
- Startup table: company name, industry, one-liner, stage, amount raised, key investors
- Star/standout toggle per startup (persisted to DB)
- Interest marking (interested / not interested)
- Click archetype name → modal with investor thesis, why it's hot, relevance to Caddy
- Click startup row → modal with full details

### 4.6 Conversations (`/conversations`)

**File**: `src/app/conversations/page.tsx`

**Purpose**: Log customer discovery conversations to validate top ideas.

**Features**:
- Table: date, contact name, role/org, linked idea, conducted by, signal strength (1-5), summary
- Add/edit modals with form fields
- Signal strength color coding

### 4.7 Tasks (`/tasks`)

**File**: `src/app/tasks/page.tsx`

**Purpose**: Kanban board for coordinating team work.

**Features**:
- 3 columns: To Do, In Progress, Done
- Filter by team member and phase (desktop_research, talk_to_users, sf_prep)
- Drag-and-drop to change status
- Add/edit task modals with assignee, due date, phase

### 4.8 SF Meetings (`/meetings`)

**File**: `src/app/meetings/page.tsx`

**Purpose**: Track meeting pipeline for San Francisco trip.

**Features**:
- 7 columns: Need Intro → Intro Sent → Replied → Scheduled → Confirmed → Completed → No Response
- Meeting types: VC, Angel, Operator, Accelerator, Other
- Filter by type and assigned team member
- Drag-and-drop to advance through pipeline stages
- Add/edit meeting modals

---

## 5. API Routes

### POST `/api/generate`

**File**: `src/app/api/generate/route.ts`

**Input**: `{ verticals: string[], archetypes: string[] }`

**Process**:
1. Builds system prompt with Caddy's thesis and team expertise
2. Calls Claude Sonnet 4 with instruction to generate 10 ideas
3. Parses JSON response

**Output**: `{ ideas: Array<{ name, description, vertical, archetype }> }`

### POST `/api/score`

**File**: `src/app/api/score/route.ts` (~220 lines)

**Input**: Either `{ name, description, vertical }` OR `{ raw_input }` (freeform text)

**Process**:
1. If `raw_input`: first Claude call extracts name, description, vertical from freeform text
2. Fetches all archetypes from DB for classification context
3. Calls Claude with detailed scoring rubrics for 8 criteria
4. Parses JSON scores + reasoning
5. Computes `total_score = severity + mf_fit + (11 - exec_difficulty) + second_buyer + passion`

**Output**: Full idea object with all scores, total_score, score_reasoning, and archetype_id

**Scoring Scale**:
- TAM: $500M (1) → $50B+ (10)
- Competition: "Low" / "Medium" / "High" (text, not numeric)
- Problem Severity: 1-10 (how painful)
- Market-Founder Fit: 1-10 (team alignment)
- Execution Difficulty: 1-10 (lower = easier = better for funnel)
- Time to $100M ARR: months (lower = better)
- Second Buyer: 1-10 (would another buyer type pay?)
- Passion: 1-10 (team excitement)

### POST `/api/comps`

**File**: `src/app/api/comps/route.ts`

**Input**: `{ ideaName, ideaDescription, ideaVertical }`

**Process**:
1. Extracts keywords from idea name, description, vertical
2. Searches all `reference_startups` rows for keyword matches
3. Boosts scores for industry/vertical matches
4. Returns top 10 by relevance score

**Output**: `{ comps: Array<ReferenceStartup> }`

---

## 6. Real-Time Data Layer

**File**: `src/lib/useSupabase.ts`

### `useRealtimeTable<T>(tableName)`
- Sets up Supabase real-time subscription on the table
- Also polls every 5 seconds as fallback (real-time can be flaky)
- Returns `{ data, loading, error, refetch }`
- Used for: ideas, conversations, tasks, sf_meetings, verticals_list, idea_scores

### `useStaticTable<T>(tableName)`
- Single fetch, no real-time (for reference data that doesn't change)
- Used for: archetypes

### `useReferenceStartups()`
- Special pagination logic: fetches in 1000-row pages until all 2,848 rows loaded
- Returns all startups as a flat array

---

## 7. File Structure

```
src/
├── app/
│   ├── layout.tsx              — Root layout with UserProvider + Sidebar
│   ├── page.tsx                — Dashboard (funnel visualization)
│   ├── generate/page.tsx       — AI idea generator
│   ├── ideas/page.tsx          — Ideas pipeline table
│   ├── reference/page.tsx      — Reference startup database
│   ├── conversations/page.tsx  — Customer discovery log
│   ├── tasks/page.tsx          — Kanban task board
│   ├── meetings/page.tsx       — SF meetings pipeline
│   └── api/
│       ├── generate/route.ts   — Claude idea generation
│       ├── score/route.ts      — Claude idea scoring
│       └── comps/route.ts      — Comparable startup search
├── components/
│   └── Sidebar.tsx             — Navigation sidebar
└── lib/
    ├── types.ts                — TypeScript interfaces for all data models
    ├── supabase.ts             — Supabase client init
    ├── useSupabase.ts          — Real-time data hooks
    ├── filterConfig.ts         — Funnel thresholds & filter logic
    └── UserContext.tsx          — Simple user context (no auth)
```

---

## 8. Key Design Decisions

1. **No auth**: Internal 3-person team, speed over security. localStorage name picker only.
2. **Real-time + polling**: Supabase subscriptions are primary, 5s polling is fallback.
3. **AI scoring**: Claude handles both structured and freeform input, returns scores + reasoning.
4. **Cascading funnel**: Each filter step narrows from the previous step's output, not from all ideas.
5. **Total score formula**: Deliberately excludes TAM and competition (text field) — focuses on qualitative criteria.
6. **Comps search**: Keyword-based, not AI-based — fast but less semantic.
7. **Reference DB**: Pre-loaded 2,848 startups, paginated on load (not on-demand).
8. **Filter thresholds**: Stored in localStorage per-browser, not per-user in DB.

---

## 9. Common Tasks for Developers

### Add a new scoring criterion
1. Add field to `Idea` type in `types.ts`
2. Add column to Supabase `ideas` table
3. Update scoring prompt in `api/score/route.ts`
4. Update `total_score` computation formula
5. Add to funnel config in `filterConfig.ts` if it's a filter
6. Add column to ideas table in `ideas/page.tsx`
7. Update dashboard funnel in `page.tsx`

### Add a new page
1. Create `src/app/<route>/page.tsx`
2. Add nav item to `Sidebar.tsx` with icon
3. If it needs data: create hook in `useSupabase.ts`
4. If it needs a new table: create in Supabase, add type to `types.ts`

### Modify AI behavior
- Generation prompt: `api/generate/route.ts` (system prompt)
- Scoring rubrics: `api/score/route.ts` (system prompt with criteria descriptions)
- Both use `claude-sonnet-4-20250514` model
