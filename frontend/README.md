# TalentOS — Intelligent Hiring System

> **3-module AI-powered hiring platform** | Claude Sonnet · Supabase · React · Express

---

## 🚀 Quick Start

### 1. Supabase Setup

Create a free project at [supabase.com](https://supabase.com) and run this SQL:

```sql
create table candidates (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text unique not null, role text not null,
  github_url text, portfolio_url text, skills text[] default '{}',
  score_technical int2 default 0, score_communication int2 default 0,
  score_creativity int2 default 0, score_culture_fit int2 default 0,
  score_growth int2 default 0, total_score int2 default 0,
  github_data jsonb, created_at timestamptz default now()
);

create table interview_sessions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  role_type text, difficulty text default 'medium', status text default 'active',
  questions jsonb default '[]', scores jsonb default '{}',
  summary text, recommendation text, created_at timestamptz default now()
);

create table simulations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  interview_session_id uuid references interview_sessions(id),
  stakeholder_scores jsonb default '{}', conflicts jsonb default '[]',
  mediation_result text, final_score numeric default 0,
  verdict text, reasoning text, created_at timestamptz default now()
);
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your keys
node src/index.js
# ✅ http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3001
npm run dev
# ✅ http://localhost:5173
```

---

## 🔑 Environment Variables

### backend/.env
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GITHUB_TOKEN=ghp_...   # optional
PORT=3001
```

### frontend/.env
```
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🧩 Modules

| # | Module | URL | AI Feature |
|---|--------|-----|-----------|
| 1 | Talent Discovery Engine | `/talent` | GitHub signal scoring |
| 2 | Adaptive Interview Engine | `/interview` | Claude adaptive Q generation |
| 3 | Hiring Decision Simulator | `/simulator` | Multi-stakeholder AI mediation |

---

## 🧪 Test Flow

1. **Add a candidate** at `/talent` → triggers GitHub analysis + scoring
2. **Start interview** at `/interview` → select candidate → 5 adaptive AI questions
3. **Run simulation** at `/simulator` → 3 stakeholders score → AI verdict

---

## 📐 Architecture

```
Frontend (React + Vite) → http://localhost:5173
    ↕ REST API
Backend (Express) → http://localhost:3001
    ↕ Supabase (PostgreSQL)
    ↕ GitHub REST API v3
    ↕ Anthropic Claude claude-sonnet-4-5
```
