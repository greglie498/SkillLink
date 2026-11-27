# SkillLink Kenya

A skills-based web marketplace that connects university students, recent graduates and early-career professionals (Talent) with small and medium businesses (SMEs) in Kenya for paid short-term projects, internships, apprenticeships and entry-level work.

Built as the SWE 4900A capstone project at USIU-Africa. The project supports SDG 8 (Decent Work and Economic Growth), SDG 4 (Quality Education) and SDG 10 (Reduced Inequalities).

## The problem

Students and recent graduates struggle to get practical work experience, while many SMEs need affordable access to skilled people without hiring full time. SkillLink gives talent a credible skills profile and a path to real work, and gives SMEs a verified, moderated place to publish clearly defined opportunities.

## What the prototype does

**Talent**
- Skills profile with headline, bio, location, availability, skills from a managed catalogue, education and portfolio links
- Browse, search and filter published opportunities, with the business's rating shown before applying
- Skills match score for every opportunity, with matched and missing skills (a transparent skills-overlap calculation, not AI)
- Recommended opportunities, applications with status tracking, and project tracking
- Feedback after a completed project, and in-platform notifications

**Business**
- Business profile and verification (a link to a registration document, reviewed by an administrator)
- Create, publish and close opportunities (publishing requires verification)
- Review applicants ranked by skills match, view their profiles and ratings, then shortlist, reject or select
- Project tracking, feedback, a hiring report and notifications

**Administrator**
- Dashboard with items needing attention, platform totals and a date-range activity report
- Verification queue, user management (suspend and restore), opportunity moderation (unpublish with a recorded reason)
- Skills catalogue management, analytics, an audit log and CSV exports

**Platform**
- Role-based access, password hashing, token authentication, rate limiting, server-side validation
- A PostgreSQL database normalised to third normal form, with database-level integrity rules
- Multi-step actions written in single transactions together with their audit entry

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript, Zod, bcryptjs, jsonwebtoken, helmet, express-rate-limit |
| Database | PostgreSQL with Prisma ORM and versioned migrations |

## Repository structure

```
Skill-Link/
  frontend/   React web application (see frontend/README.md)
  backend/    REST API, database schema, migrations and seed scripts (see backend/README.md)
```

## Quick start

Prerequisites: Node.js (LTS) and PostgreSQL.

1. Create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE skilllink;"
   ```
2. Set up and start the API (details in `backend/README.md`):
   ```bash
   cd backend
   npm install
   cp .env.example .env      # then edit .env
   npx prisma migrate dev
   npx prisma db seed
   npm run seed:demo
   npm run dev               # http://localhost:4000
   ```
3. In a second terminal, set up and start the web app (details in `frontend/README.md`):
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev               # http://localhost:5173
   ```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Demo accounts (development only)

The seed scripts create demonstration data. Every demo account uses the password `Password123`. These accounts exist for local development and demonstration only and must never be created in a real deployment.

| Role | Email |
|---|---|
| Administrator | `admin@skilllink.test` |
| Business (verified) | `owner@nairobicrafts.test`, `quickbook@example.test` |
| Business (awaiting verification) | `mamamboga@example.test`, `urbanroots@example.test` |
| Talent | `jane@example.com`, `amina@example.com`, `brian@example.com`, `carol@example.com`, `david@example.com` |

## Scope

Designed but not part of this prototype (future work): password reset and email verification, in-app messaging, payments and escrow, machine-learning matching, recommended talent for businesses, and native mobile apps. Verification documents are submitted as links, not file uploads.

## Status

Academic prototype under active development. It runs in a local development environment and has not been deployed.