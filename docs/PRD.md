# PRD — Intelligent Hiring System
**Version:** 1.0 | **Date:** 2026-03-27 | **Status:** Approved

---

## 1. Problem Statement (Simplified)

Traditional hiring relies on resumes, rigid interviews, and gut-feel decisions.
This system replaces that with:
- **Signal-based candidate scoring** beyond the resume
- **AI-adaptive interviews** that evolve with each response
- **Multi-stakeholder simulation** where conflicting priorities surface fair decisions

---

## 2. Target Users

| User | Role |
|------|------|
| Recruiter | Uploads candidate data, triggers assessments |
| Hiring Manager | Reviews AI interview results |
| Panelist (Tech / HR / Exec) | Participates in decision simulator |
| Candidate | Completes AI-powered adaptive interview |

---

## 3. Assumptions

- Users have a modern browser (Chrome 120+)
- Backend is Node.js with Claude AI access (Anthropic API)
- No authentication required for MVP (single-tenant demo mode)
- Supabase used as hosted PostgreSQL + realtime layer

---

## 4. Modules & Features

### Module 1 — Talent Discovery Engine (P0)
| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| M1-01 | Candidate profile form | Submit name, role, GitHub URL, portfolio URL, skills[] |
| M1-02 | Signal scoring engine | Returns score 0–100 across 5 dimensions |
| M1-03 | GitHub activity analyzer | Hits GitHub API; extracts commit frequency, repo quality score |
| M1-04 | Score radar chart | Renders 5-axis radar for each candidate |
| M1-05 | Candidate list dashboard | Table with sort by score, filter by role |

**Validation Rules:**
- GitHub URL must match `github.com/[username]` pattern
- Skills list: min 1, max 15 items
- Score dimensions: Communication, Technical, Creativity, Culture Fit, Growth Potential

**Edge Cases:**
- GitHub API rate limit → show cached/estimated score with warning
- Empty portfolio → skip portfolio scoring, flag as incomplete
- Duplicate candidate (same email) → show merge prompt

**Out of Scope (MVP):** LinkedIn scraping, resume PDF parsing, ATS integration

---

### Module 2 — Adaptive Interview Engine (P0)
| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| M2-01 | Start interview session | Select candidate, select role type → initialize session |
| M2-02 | AI question generation | Claude generates Q based on candidate profile + prior answers |
| M2-03 | Candidate response input | Textarea with 300-word limit, submit triggers next question |
| M2-04 | Thinking pattern analysis | Claude scores: depth, clarity, creativity, honesty per response |
| M2-05 | Real-time score panel | Live updating bar chart of 4 dimensions across questions |
| M2-06 | Session summary | After 5 questions: full AI narrative summary + final score |

**Validation Rules:**
- Response: min 20 chars, max 1500 chars
- Session: exactly 5 adaptive questions (configurable)
- Claude prompt must include: role context, candidate profile, prior Q&A chain

**Edge Cases:**
- Claude API timeout (>10s) → show retry button, don't lose prior answers
- Empty response submission → validation error, block submit
- User refreshes mid-session → restore from sessionStorage

**Out of Scope:** Video interviews, emotion detection, multi-language support

---

### Module 3 — Hiring Decision Simulator (P0)
| ID | Feature | Acceptance Criteria |
|----|---------|---------------------|
| M3-01 | Stakeholder panel setup | Pre-configured 3 personas: Tech Lead, HR Director, CEO |
| M3-02 | Per-stakeholder scoring | Each stakeholder scores candidate on their priority axes |
| M3-03 | Priority weight config | Each stakeholder has weighted importance (Tech:40%, HR:35%, CEO:25%) |
| M3-04 | Conflict surface | Highlight dimensions where stakeholders disagree by >20 pts |
| M3-05 | AI mediation | Claude analyses conflicts, generates consensus recommendation |
| M3-06 | Final verdict display | Hire / Hold / Reject with full reasoning |

**Validation Rules:**
- Each stakeholder must score all 5 dimensions (0–10)
- Weights must sum to 100%
- Conflict threshold: ≥20 point difference on any axis triggers AI mediation

**Edge Cases:**
- All stakeholders agree → skip mediation, fast-path to verdict
- 3-way tie on final score → Claude breaks tie with narrative justification
- Stakeholder submits all 10s or all 0s → flag as potentially biased, prompt review

**Out of Scope:** Real email notifications, calendar invites, ATS export

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load (LCP) | < 2.5s |
| AI response latency | < 8s with streaming |
| Concurrent sessions | 50 (MVP load) |
| Browser support | Chrome 120+, Firefox 122+, Edge 120+ |
| Accessibility | WCAG 2.1 AA target |
