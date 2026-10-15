# SkillLink Backend

Express + TypeScript API with Prisma and PostgreSQL.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in your values
3. Create the database: `psql -U postgres -c "CREATE DATABASE skilllink;"`
4. Apply migrations: `npx prisma migrate dev`
5. Seed sample data: `npx prisma db seed`
6. Start the server: `npm run dev` (runs on http://localhost:4000)

Seeded accounts all use the password `Password123`:
`jane@example.com` (talent), `owner@nairobicrafts.test` (business), `admin@skilllink.test` (admin).
