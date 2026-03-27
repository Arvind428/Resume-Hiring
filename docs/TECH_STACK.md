# TECH_STACK.md — Intelligent Hiring System

## Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| Vite | 5.4.2 | Build tool / dev server |
| React Router DOM | 6.26.1 | Client-side routing |
| Recharts | 2.12.7 | Radar + bar charts |
| Lucide React | 0.441.0 | Icon system |
| Axios | 1.7.7 | HTTP client |
| Framer Motion | 11.3.31 | Micro-animations |

## Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20.x | Runtime |
| Express | 4.19.2 | HTTP server |
| @anthropic-ai/sdk | 0.27.3 | Claude AI integration |
| @supabase/supabase-js | 2.45.4 | Supabase client |
| node-fetch | 3.3.2 | GitHub API calls |
| cors | 2.8.5 | Cross-origin headers |
| dotenv | 16.4.5 | Env vars |
| express-rate-limit | 7.4.1 | Rate limiting |

## Database
| Technology | Version | Purpose |
|---|---|---|
| Supabase (PostgreSQL 15) | hosted | Primary DB + realtime |

## AI
| Model | Provider | Usage |
|---|---|---|
| claude-sonnet-4-5 | Anthropic | Interview Q generation, scoring, mediation |

## Infrastructure (Local DEV)
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:3001 (Express)
- **DB**: Supabase cloud (free tier)

## Environment Variables

```env
# Backend (.env)
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
GITHUB_TOKEN=ghp_...         # Optional, increases rate limit
PORT=3001

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3001
```
