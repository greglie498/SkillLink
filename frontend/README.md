# SkillLink Frontend

React + TypeScript web app for SkillLink, a skills-based marketplace connecting university students and early-career professionals with SMEs for paid short-term projects, internships, and entry-level work.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router

## Getting Started

1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev` (runs on http://localhost:5173)
3. Type check: `npx tsc --noEmit`
4. Production build: `npm run build`

The backend API lives in the `backend/` folder and runs on http://localhost:4000. See its README for setup.

## Current Status

This is a work in progress for the SWE 4900A capstone.

| Area | Status |
|---|---|
| Landing page | Built |
| Register / Login forms with client-side validation | Built (not yet connected to the API) |
| Talent dashboard | Built (mock data) |
| Browse opportunities with search and skill filter | Built (mock data) |
| Opportunity details | Built (mock data) |
| Talent profile editing with skills add/remove | Built (mock data, saves to local state only) |
| Connection to backend API | In progress |
| Business and admin screens | Not started |

## Routes

| Path | Page |
|---|---|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register (Talent or Business) |
| `/dashboard` | Talent dashboard |
| `/opportunities` | Browse opportunities |
| `/opportunities/:id` | Opportunity details |
| `/profile` | Edit talent profile |

## Project Structure

```
src/
  components/   Reusable UI (Sidebar, TopNav, OpportunityCard, FormField, SkillsInput, ...)
  pages/        One file per route
  data/         Mock data used until the API is connected
  utils/        Shared helpers, including form validation
```

## Design System

- Font: Inter
- Primary accent: coral `#FF6B4A`; dark slate `#2D3142` for navigation
- Spacing on an 8px base unit
- Colors are defined as Tailwind tokens in `tailwind.config.js`
