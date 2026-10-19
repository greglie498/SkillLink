## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` (sets the API URL)
3. Start the backend first (see `backend/README.md`), then start the dev server: `npm run dev` (runs on http://localhost:5173)
4. Type check: `npx tsc --noEmit`
5. Production build: `npm run build`

Seeded demo accounts (password `Password123`): `jane@example.com` (talent), `owner@nairobicrafts.test` (business).

## Current Status

This is a work in progress for the SWE 4900A capstone.

| Area | Status |
|---|---|
| Landing page | Built |
| Register / Login | Connected to the API (JWT session, server-side validation errors shown in the form) |
| Route protection and logout | Built (usability gate; the API enforces real access control) |
| Browse opportunities (search + skill filter) | Connected to the API |
| Opportunity details | Connected to the API |
| Talent profile (update, add and remove skills) | Connected to the API |
| Talent dashboard | Latest opportunities from the API; profile completion and applications are still mock data |
| Apply for opportunity, applications, projects | Not started |
| Business and admin screens | Not started |

## Routes

| Path | Page | Login required |
|---|---|---|
| `/` | Landing page | No |
| `/login` | Login | No |
| `/register` | Register (Talent or Business) | No |
| `/dashboard` | Talent dashboard | Yes |
| `/opportunities` | Browse opportunities | Yes |
| `/opportunities/:id` | Opportunity details | Yes |
| `/profile` | Edit talent profile | Yes |

## Project Structure

```
src/
  components/   Reusable UI (Sidebar, TopNav, OpportunityCard, FormField, SkillsInput, RequireAuth, ...)
  pages/        One file per route
  lib/          API client (api.ts), session helpers (auth.ts), API-to-UI mappers (opportunities.ts)
  data/         Mock data for parts not yet connected to the API
  utils/        Shared helpers, including form validation
```

## Notes

- Client-side validation is for quick feedback only. The backend re-validates every request.
- The session token is kept in `localStorage`. This is simple but readable by any script on the page, so a cross-site scripting bug would expose it. HttpOnly cookies are the stronger option and a candidate for the security phase.
- Messaging, payments, and other later-phase features are designed in the wireframes but are not part of this MVP build.