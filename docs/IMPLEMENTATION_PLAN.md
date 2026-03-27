# IMPLEMENTATION_PLAN.md — Intelligent Hiring System

## Phase 1: Project Initialization
- [ ] Create `frontend/` with Vite + React 18
- [ ] Create `backend/` with Express
- [ ] Setup `.env.example` for both
- [ ] Create Supabase tables (SQL migrations)

## Phase 2: Backend Core
- [ ] Express server with CORS + rate limiting
- [ ] Supabase client setup
- [ ] GitHub service (fetch user + repos)
- [ ] Signal scoring engine
- [ ] Claude service (question gen + scoring + mediation)
- [ ] Candidates routes (CRUD + analyze)
- [ ] Interviews routes (start + respond + summary)
- [ ] Simulations routes (create + score + decide)

## Phase 3: Frontend Core
- [ ] Vite + React Router setup
- [ ] Global CSS design system (dark theme)
- [ ] Navbar + Layout component
- [ ] `api.js` Axios client

## Phase 4: Module 1 UI
- [ ] Dashboard page (with module cards)
- [ ] TalentDiscovery page (candidate table)
- [ ] CandidateForm modal
- [ ] ScoreRadar chart (Recharts)
- [ ] CandidateDetail page with full breakdown

## Phase 5: Module 2 UI
- [ ] Interview page (select candidate + config)
- [ ] InterviewSession page (chat-style, Q/A flow)
- [ ] TypingIndicator component
- [ ] Real-time ScorePanel (bar chart, updates per Q)
- [ ] InterviewSummary page

## Phase 6: Module 3 UI
- [ ] DecisionSimulator page
- [ ] StakeholderCard with 5-dimension sliders
- [ ] ConflictAlert display
- [ ] AI Mediation loading + result
- [ ] VerdictBadge (Hire/Hold/Reject)

## Phase 7: Polish
- [ ] Framer Motion page transitions
- [ ] Skeleton loading states
- [ ] Error boundaries + retry
- [ ] Responsive layouts
- [ ] Final README.md

---

## Setup Commands

```bash
# 1. Clone / navigate to project
cd hiring

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
node src/index.js
# → Listening on http://localhost:3001

# 3. Setup Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3001
npm run dev
# → http://localhost:5173
```

## Supabase SQL Setup
Run in Supabase SQL Editor:
```sql
-- candidates
create table candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  role text not null,
  github_url text,
  portfolio_url text,
  skills text[] default '{}',
  score_technical int2 default 0,
  score_communication int2 default 0,
  score_creativity int2 default 0,
  score_culture_fit int2 default 0,
  score_growth int2 default 0,
  total_score int2 default 0,
  github_data jsonb,
  created_at timestamptz default now()
);

-- interview_sessions
create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  role_type text,
  difficulty text default 'medium',
  status text default 'active',
  questions jsonb default '[]',
  scores jsonb default '{}',
  summary text,
  recommendation text,
  created_at timestamptz default now()
);

-- simulations
create table simulations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  interview_session_id uuid references interview_sessions(id),
  stakeholder_scores jsonb default '{}',
  conflicts jsonb default '[]',
  mediation_result text,
  final_score numeric default 0,
  verdict text,
  reasoning text,
  created_at timestamptz default now()
);
```
