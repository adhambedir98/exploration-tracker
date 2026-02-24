# Exploration Tracker

Internal tool for Caddy's 3-person team (Adham, Aly, Youssif) to track a 2-week structured industry exploration process before YC decisions (Mar 13) and SF trip (Mar 14).

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Database**: Supabase (Postgres + real-time)
- **Deployment**: Vercel

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Database Migration

Open the SQL Editor in your Supabase dashboard and run the entire contents of:

```
supabase/migration.sql
```

This creates all tables, enables RLS with permissive policies (internal tool), enables real-time, and seeds initial data (3 verticals + 7 tasks).

### 3. Configure Environment Variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Fill in your Supabase credentials (found in Settings > API):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Select your name on the first visit.

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the same two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings.

## Pages

- **Dashboard** (`/`) - Phase indicator, stats, timeline, task progress, recent activity
- **Verticals** (`/verticals`) - List view with sorting/filtering + Comparison view for scoring
- **Conversations** (`/conversations`) - Customer discovery conversation log
- **Tasks** (`/tasks`) - Kanban board (To Do / In Progress / Done) with drag-and-drop
- **SF Meetings** (`/meetings`) - Pipeline view for spring break meetings

## Features

- Real-time sync across all team members via Supabase subscriptions
- Scoring system with side-by-side comparison view (the key decision-making tool)
- CSV export on the comparison view
- Drag-and-drop Kanban boards for tasks and meetings
- No auth required - simple name selector stored in localStorage
