# SkillLink Kenya: Backend

REST API for SkillLink Kenya, built with Node.js, Express, TypeScript and Prisma on PostgreSQL.

## Setup

Prerequisites: Node.js (LTS) and PostgreSQL.

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your values (see below)
3. Create the database: `psql -U postgres -c "CREATE DATABASE skilllink;"`
4. Apply the migrations: `npx prisma migrate dev`
5. Load the base data (skills, categories, types and three accounts): `npx prisma db seed`
6. Load the demonstration data (more accounts, opportunities, applications, finished projects with feedback): `npm run seed:demo`
7. Start the API: `npm run dev` (http://localhost:4000)

Run the base seed before the demo seed. Both can be run again safely.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign login tokens. At least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `FRONTEND_ORIGIN` | The one origin allowed by CORS. Default `http://localhost:5173` |
| `PORT` | Port the API listens on. Default `4000` |
| `AUTH_RATE_LIMIT` | Login and registration requests allowed per address per 15 minutes. Default `20` |

Never commit `.env`. Only `.env.example` is tracked.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the API with automatic restart |
| `npm run seed:demo` | Loads the demonstration data |
| `npx prisma db seed` | Loads the base data |
| `npx prisma migrate dev` | Applies migrations and regenerates the Prisma client |
| `npx prisma studio` | Opens a browser view of the database |
| `npx tsc --noEmit` | Type-checks the code |

## Demo accounts

Every demo account uses the password `Password123`. They exist for local development only.

| Role | Email |
|---|---|
| Administrator | `admin@skilllink.test` |
| Business (verified) | `owner@nairobicrafts.test`, `quickbook@example.test` |
| Business (awaiting verification) | `mamamboga@example.test`, `urbanroots@example.test` |
| Talent | `jane@example.com`, `amina@example.com`, `brian@example.com`, `carol@example.com`, `david@example.com` |

## API overview

Protected endpoints expect `Authorization: Bearer <token>`. Tokens come from the login or register endpoints.

| Access | Endpoints | Purpose |
|---|---|---|
| Public | `GET /api/health`, `/api/skills`, `/api/meta/categories`, `/api/meta/types` | Health check and form options |
| Public | `GET /api/opportunities` (optional `q` and `skill`), `GET /api/opportunities/:id` | Published opportunities, with the business rating |
| Public | `POST /api/auth/register`, `POST /api/auth/login` | Create an account and log in |
| Talent | `GET`, `PUT /api/talent/profile` | View and update the profile, with rating and reviews |
| Talent | `POST`, `DELETE` on `/api/talent/skills`, `/api/talent/education`, `/api/talent/portfolio` | Manage skills, education and portfolio links |
| Talent | `GET /api/talent/recommendations`, `GET /api/talent/opportunities/:id/match` | Skills-based matches |
| Talent | `GET`, `POST /api/applications` | Own applications and applying |
| Business | `GET`, `PUT /api/business/profile`, `POST /api/business/verification` | Profile, rating and verification document |
| Business | `GET`, `POST /api/business/opportunities`, `PUT /api/business/opportunities/:id`, `PATCH /api/business/opportunities/:id/status` | Manage opportunities |
| Business | `GET /api/business/opportunities/:id/applications`, `PATCH /api/business/applications/:id/status` | Review applicants and decide |
| Business | `GET /api/business/report` | Hiring report |
| Talent and Business | `GET /api/projects`, `GET /api/projects/:id`, `PATCH /api/projects/:id/status` | Projects the user takes part in |
| Talent and Business | `GET`, `POST /api/projects/:id/feedback` | Feedback on a completed project |
| Any signed-in user | `GET /api/notifications`, `GET /api/notifications/unread-count`, `POST /api/notifications/read-all`, `PATCH /api/notifications/:id/read` | Own notifications |
| Administrator | `GET /api/admin/users`, `PATCH /api/admin/users/:id/status` | User management |
| Administrator | `GET /api/admin/businesses`, `PATCH /api/admin/businesses/:id/verification` | Verification queue |
| Administrator | `GET /api/admin/opportunities`, `PATCH /api/admin/opportunities/:id/status` | Opportunity moderation |
| Administrator | `GET`, `POST /api/admin/skills`, `PATCH /api/admin/skills/:id` | Skills catalogue |
| Administrator | `GET /api/admin/reports/summary`, `/period`, `/analytics`, `/export`, `GET /api/admin/audit-logs` | Reports and audit log |

## Security and data integrity

- Passwords are hashed with bcrypt (cost 12). A password needs at least 8 characters, one uppercase letter and one number, and is limited to 72 bytes, the most bcrypt uses.
- Login tokens are signed with HS256 and expire after one hour. The algorithm is pinned when a token is verified.
- On every protected request the server re-checks the user's role and account status in the database, so a suspended account loses access immediately.
- Role checks guard every route group. Ownership is checked in the query itself, and a record that belongs to someone else returns 404, the same as one that does not exist.
- Requests are validated with Zod. Unknown fields are dropped, which prevents setting fields such as `verification` through a profile update.
- Login and registration are rate limited. Login failures take the same time and give the same message whether or not the email exists.
- `helmet` sets security headers, CORS allows one origin, and request bodies are limited to 100 KB.
- Administrator accounts cannot be created through registration. They come from the seed.
- Links (portfolio and verification documents) must start with `http://` or `https://`.
- CSV exports neutralise cells that start with `=`, `+`, `-` or `@`.
- Multi-step actions (registration, applications, hiring decisions, project changes, feedback, administrator actions) run in one transaction together with their audit entry.
- The audit log records logins, decisions and administrator actions. It never stores feedback text or passwords.
- Feedback is hidden until both sides submit or the 14 day window ends, and the server never sends hidden text.

## Database

PostgreSQL with Prisma. The schema has 18 tables and is normalised to third normal form. Many-to-many relationships use junction tables, and categories and opportunity types are lookup tables.

- Primary keys, foreign keys and unique constraints (one account per email, one application per talent per opportunity, one feedback entry per author per project)
- CHECK constraints in the migration SQL, which Prisma cannot express in its schema: lowercase email and length limits, education year range and order, compensation of zero or more, duration above zero, rating from 1 to 5
- Delete rules: dependent data cascades, business history is protected from deletion, and audit and reviewer references are cleared if a user is removed
- Skills are deactivated, never deleted

## Project structure

```
backend/
  prisma/
    schema.prisma        Models and relationships
    migrations/          Versioned migrations (commit this folder)
    seed.ts              Base data
    seed-demo.ts         Demonstration data
  src/
    server.ts            App setup, middleware and route mounting
    lib/                 Prisma client, config, audit, CSV, matching, feedback, validation helpers
    middleware/          Authentication, role checks, rate limiting
    routes/              One file per route group
```

## Notes

- Matching is a transparent skills-overlap score: the share of an opportunity's required skills that a talent has. It supports a decision and never makes one.
- Ratings are computed from visible feedback and are not stored.
- The rate limiter keeps its counts in memory, so they reset when the server restarts.