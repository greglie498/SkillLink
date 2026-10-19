## API Overview

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/health` | Public |
| GET | `/api/skills` | Public |
| GET | `/api/opportunities` (optional `?q=` and `?skill=`) | Public |
| GET | `/api/opportunities/:id` | Public |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET, PUT | `/api/talent/profile` | Talent only |
| POST | `/api/talent/skills` | Talent only |
| DELETE | `/api/talent/skills/:skillId` | Talent only |

Protected endpoints expect an `Authorization: Bearer <token>` header. Passwords are hashed with bcrypt, and requests are validated server-side with Zod.

## Database

PostgreSQL, managed with Prisma. The schema is normalized to 3NF: many-to-many relationships use junction tables (`talent_skills`, `opportunity_skills`, `application_portfolio_links`), and lookup tables (`categories`, `opportunity_types`) avoid repeating values. Migrations are in `prisma/migrations/`.