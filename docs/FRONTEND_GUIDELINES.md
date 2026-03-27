# FRONTEND_GUIDELINES.md — Intelligent Hiring System

## Design System

### Color Palette
```css
/* Primary */
--color-primary: #6366F1;        /* Indigo 500 */
--color-primary-dark: #4F46E5;   /* Indigo 600 */
--color-primary-glow: rgba(99,102,241,0.2);

/* Backgrounds */
--color-bg: #0A0B14;             /* Deep dark navy */
--color-surface: #12131F;        /* Card surface */
--color-surface-2: #1A1B2E;      /* Elevated surface */
--color-border: rgba(255,255,255,0.08);

/* Text */
--color-text: #F1F5F9;           /* Primary text */
--color-text-muted: #94A3B8;     /* Secondary text */
--color-text-dim: #475569;       /* Tertiary */

/* Semantic */
--color-success: #10B981;        /* Emerald */
--color-warning: #F59E0B;        /* Amber */
--color-danger: #EF4444;         /* Red */
--color-info: #3B82F6;           /* Blue */

/* Module accents */
--color-module-1: #8B5CF6;       /* Talent — Purple */
--color-module-2: #06B6D4;       /* Interview — Cyan */
--color-module-3: #F59E0B;       /* Decision — Amber */
```

### Typography
- **Font**: `Inter` (Google Fonts) — weights 400, 500, 600, 700
- **Heading**: `Sora` (Google Fonts) — weights 600, 700
- **Mono**: `JetBrains Mono` — for code/scores

### Scale
| Name | Size | Use |
|---|---|---|
| xs | 12px | Labels, captions |
| sm | 14px | Body secondary |
| base | 16px | Body |
| lg | 18px | Lead text |
| xl | 20px | Section heads |
| 2xl | 24px | Page subheads |
| 3xl | 30px | Page titles |
| 4xl | 36px | Hero numbers |

### Spacing
- Base unit: 4px
- Common: 8, 12, 16, 20, 24, 32, 40, 48, 64px

### Border Radius
- Card: `12px`
- Button: `8px`
- Badge: `6px`
- Input: `8px`
- Full pill: `9999px`

---

## Component Patterns

### Cards
```
background: var(--color-surface)
border: 1px solid var(--color-border)
border-radius: 12px
padding: 24px
box-shadow: 0 4px 24px rgba(0,0,0,0.3)
```
Hover: `border-color` lifts to module accent color, `transform: translateY(-2px)`

### Buttons
- **Primary**: `bg: --color-primary`, white text, hover glow
- **Secondary**: transparent, `border: 1px solid --color-border`, hover fill
- **Danger**: `bg: --color-danger`
- All buttons: 44px min height (accessibility), `cursor: pointer`

### Score Badges
```
Hire (85+):   bg #10B981 / text white
Strong (70+): bg #6366F1 / text white
Maybe (50+):  bg #F59E0B / text black
Reject (<50): bg #EF4444 / text white
```

### Inputs
- Dark bg (`--color-surface-2`), subtle border
- Focus: `border-color: --color-primary`, `box-shadow: 0 0 0 3px --color-primary-glow`
- Error state: red border + error message below

---

## Animation Conventions
- Page transitions: `framer-motion` `fadeIn` 200ms ease
- Card hover: `transition: all 0.2s ease`
- Score bars: animate width from 0 to target on mount
- Question typing indicator: CSS keyframe pulse on 3 dots
- Loading skeletons: shimmer gradient animation

---

## Responsive Breakpoints
```css
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
```

---

## File Structure (Frontend)
```
frontend/src/
├── pages/
│   ├── Dashboard.jsx
│   ├── TalentDiscovery.jsx
│   ├── CandidateDetail.jsx
│   ├── Interview.jsx
│   ├── InterviewSession.jsx
│   ├── InterviewSummary.jsx
│   ├── DecisionSimulator.jsx
│   └── SimulationDetail.jsx
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── Layout.jsx
│   ├── talent/
│   │   ├── CandidateForm.jsx
│   │   ├── CandidateCard.jsx
│   │   └── ScoreRadar.jsx
│   ├── interview/
│   │   ├── QuestionBubble.jsx
│   │   ├── AnswerInput.jsx
│   │   ├── ScorePanel.jsx
│   │   └── TypingIndicator.jsx
│   └── decision/
│       ├── StakeholderCard.jsx
│       ├── ConflictAlert.jsx
│       └── VerdictBadge.jsx
├── lib/
│   ├── api.js
│   └── utils.js
├── styles/
│   └── globals.css
└── App.jsx
```
