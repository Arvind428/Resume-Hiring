# BACKEND_STRUCTURE.md — Intelligent Hiring System

## Directory Layout
```
backend/
├── src/
│   ├── index.js              ← Express app entry
│   ├── routes/
│   │   ├── candidates.js     ← Module 1 routes
│   │   ├── interviews.js     ← Module 2 routes
│   │   └── simulations.js    ← Module 3 routes
│   ├── services/
│   │   ├── signalScoring.js  ← Scoring engine
│   │   ├── githubService.js  ← GitHub API
│   │   ├── claudeService.js  ← Anthropic client
│   │   └── supabaseClient.js ← DB client
│   └── middleware/
│       └── errorHandler.js
├── .env
├── .env.example
└── package.json
```

---

## Database Schema (Supabase / PostgreSQL)

### Table: `candidates`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| email | text | UNIQUE NOT NULL |
| role | text | NOT NULL |
| github_url | text | |
| portfolio_url | text | |
| skills | text[] | |
| score_technical | int2 | 0–100 |
| score_communication | int2 | 0–100 |
| score_creativity | int2 | 0–100 |
| score_culture_fit | int2 | 0–100 |
| score_growth | int2 | 0–100 |
| total_score | int2 | computed |
| github_data | jsonb | raw GH analysis |
| created_at | timestamptz | default now() |

### Table: `interview_sessions`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| candidate_id | uuid | FK → candidates |
| role_type | text | |
| difficulty | text | easy/medium/hard |
| status | text | active/complete |
| questions | jsonb[] | array of {q, a} |
| scores | jsonb | {depth,clarity,creativity,honesty} |
| summary | text | AI narrative |
| recommendation | text | strong_yes/yes/maybe/no |
| created_at | timestamptz | |

### Table: `simulations`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| candidate_id | uuid | FK → candidates |
| interview_session_id | uuid | FK → interview_sessions |
| stakeholder_scores | jsonb | {tech_lead:{},hr:{},ceo:{}} |
| conflicts | jsonb | detected conflict axes |
| mediation_result | text | AI mediation output |
| final_score | numeric | weighted aggregate |
| verdict | text | hire/hold/reject |
| reasoning | text | full AI reasoning |
| created_at | timestamptz | |

---

## API Routes

### Candidates (Module 1)
```
POST   /api/candidates            → create candidate
GET    /api/candidates            → list (query: ?role=&sort=score)
GET    /api/candidates/:id        → get candidate detail
PUT    /api/candidates/:id        → update
DELETE /api/candidates/:id        → delete
POST   /api/candidates/:id/analyze → run signal scoring + GitHub analysis
```

### Interviews (Module 2)
```
POST   /api/interviews/start      → { candidateId, roleType, difficulty }
POST   /api/interviews/:id/respond → { answer } → returns next question
GET    /api/interviews/:id        → get session state
GET    /api/interviews/:id/summary → get final summary (must be complete)
```

### Simulations (Module 3)
```
POST   /api/simulations           → { candidateId, interviewSessionId }
POST   /api/simulations/:id/score → { stakeholder, scores{} }
POST   /api/simulations/:id/decide → run conflict detection + AI mediation + verdict
GET    /api/simulations/:id       → get simulation state
```

---

## Signal Scoring Logic (Module 1)

```
TECHNICAL (25 pts max):
  + GitHub repos count × 1   (max 10)
  + Recent commits (90d) × 0.5 (max 10)
  + Stars on repos × 0.1 (max 5)

COMMUNICATION (20 pts):
  + Portfolio URL present: +5
  + Skills count: 1pt per skill (max 10)
  + Role keyword match: +5

CREATIVITY (20 pts):
  + Unique repo topics > 3: +10
  + Portfolio present + GitHub: +10

CULTURE FIT (20 pts):
  Heuristic from role + skills alignment

GROWTH POTENTIAL (15 pts):
  + Account age > 1yr: +5
  + Recent activity (30d): +5
  + Contribution streak: +5
```

---

## Claude Prompt Strategy

### Interview Question Generation
```
System: You are a senior hiring interviewer conducting an adaptive interview
        for a [ROLE] position. Adapt your questions based on the candidate's
        profile and previous answers to probe deeper.

User:   Candidate Profile: [profile JSON]
        Previous Q&A: [array of {q,a}]
        This is question [N] of 5.
        Generate ONE probing question. Return JSON: { question: "..." }
```

### Answer Scoring
```
System: You are an expert interviewer scoring candidate responses.
        Score these 4 dimensions (0–10 each):
        - depth: analytical depth of answer
        - clarity: communication clarity
        - creativity: novel thinking
        - honesty: authentic self-awareness

User:   Question: [Q]
        Answer: [A]
        Return JSON: { depth:N, clarity:N, creativity:N, honesty:N, feedback:"..." }
```

### Mediation Prompt (Module 3)
```
System: You are a neutral hiring AI mediating between stakeholders.
        Analyze conflict areas and produce a fair consensus recommendation.

User:   Candidate: [name, scores]
        Stakeholder Scores: [JSON]
        Conflicts Detected: [axes with divergence]
        Return JSON: { recommendation:"hire|hold|reject", reasoning:"...", consensus_score:N }
```

---

## Error Handling
- All routes wrapped in try/catch → `next(err)`
- `errorHandler.js` middleware: logs + returns `{ error: message, code }`
- GitHub API 403 → return fallback estimated scores with `{ estimated: true }`
- Claude timeout (>15s) → 504 with retry hint
