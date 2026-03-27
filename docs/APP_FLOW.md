# APP_FLOW.md — Intelligent Hiring System

## Application Structure

```
/                          → Landing / Dashboard (all 3 modules)
/talent-discovery          → Module 1: Talent Discovery Engine
/talent-discovery/:id      → Candidate Score Detail
/interview                 → Module 2: Adaptive Interview Engine
/interview/:sessionId      → Active Interview Session
/interview/:sessionId/summary → Session Summary
/decision-simulator        → Module 3: Hiring Decision Simulator
/decision-simulator/:id    → Active Simulation
```

---

## Navigation

- **Top navbar**: Logo | Module 1 | Module 2 | Module 3 | (theme toggle)
- **Sidebar** (on module pages): Steps / progress tracker
- **Breadcrumbs** on detail pages

---

## Module 1 — Talent Discovery Flow

```
Dashboard → [+ Add Candidate] → Profile Form
         → Submit → Signal Scoring (loading)
         → Score Result (radar chart + breakdown)
         → Back to Candidate List
Candidate List → Click Row → Detail Page
```

### States:
- Empty State: "No candidates yet" + CTA
- Loading: skeleton cards
- Error: "GitHub API unavailable — showing estimated scores"
- Success: rendered radar chart + score table

---

## Module 2 — Interview Flow

```
/interview → Select Candidate from list
           → Configure Session (role type, difficulty)
           → [Start Interview] → Session begins
           
Session:
  Question 1 displayed → Candidate types answer → Submit
  → Claude analyzes → Next Q generated (adaptive)
  → Repeat × 5
  → [Complete Session] → Session Summary Page

Summary:
  - AI narrative paragraph
  - Dimension scores (bar chart)
  - Recommendation badge (Strong Yes / Yes / Maybe / No)
```

### States:
- Question loading: typing indicator (3-dot animation)
- Submit locked: validation (min 20 chars)
- API error: retry button, session preserved in sessionStorage
- Session complete: auto-redirect to summary after final Q

---

## Module 3 — Decision Simulator Flow

```
/decision-simulator → Select evaluated candidate
                    → Stakeholder Panel shown (3 personas pre-loaded)
                    → Each stakeholder scores 5 dimensions
                    → [Run Simulation] → Conflict detection
                    
If conflicts detected:
  → AI Mediation loading
  → Mediation result displayed
  
Final:
  → Weighted aggregate score computed
  → Verdict badge: HIRE / HOLD / REJECT
  → Full reasoning panel
  → [Export Decision] → JSON download
```

### States:
- Incomplete scoring: block [Run Simulation], show missing fields
- All agree: skip mediation step, fast-path to verdict
- Conflict: highlight diverging axes in red
- 3-way tie: Claude narrative tie-break shown

---

## Data Flow

```
Frontend (React)
    ↕ REST API (Express)
        ↕ Supabase (PostgreSQL)
        ↕ GitHub REST API (v3)
        ↕ Anthropic Claude (claude-sonnet-4-5)
```

### Key API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/candidates | Create candidate |
| GET | /api/candidates | List all candidates |
| GET | /api/candidates/:id | Get candidate + scores |
| POST | /api/candidates/:id/analyze | Trigger GitHub + signal scoring |
| POST | /api/interviews/start | Start interview session |
| POST | /api/interviews/:id/respond | Submit answer, get next Q |
| GET | /api/interviews/:id/summary | Get session summary |
| POST | /api/simulations | Create simulation |
| POST | /api/simulations/:id/score | Submit stakeholder scores |
| POST | /api/simulations/:id/decide | Run AI mediation + verdict |
