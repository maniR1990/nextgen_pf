# NextGen PF

Principal Engineer architecture — **Next.js 15** + **MongoDB** (Prisma) + **TypeScript**.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | MongoDB via Prisma |
| Auth | NextAuth.js (JWT) |
| Styling | Tailwind CSS 4 |
| State | Zustand + SWR |
| Lint | Biome |
| Format | oxfmt |
| Monorepo tooling | Nx (caching) |
| Tests | Vitest + Playwright |
| UI docs | Storybook + Chromatic |

## Architecture

```
HTTP Route → Middleware → Service → Repository → Prisma → MongoDB
```

Feature modules live in `src/modules/` — each owns router, service, repository, schema, types, and tests.

## Getting Started

```bash
cp .env.example .env.local
# Edit DATABASE_URL, NEXTAUTH_SECRET

pnpm install
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm lint` | Biome check |
| `pnpm format` | oxfmt format |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm storybook` | Storybook dev server |
| `pnpm build-storybook` | Static Storybook build (`storybook:build` alias) |
| `pnpm chromatic` | Visual regression (Chromatic CLI) |
| `pnpm chromatic:ci` | Chromatic in CI (`--exit-zero-on-changes`) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness probe |
| GET/POST | `/api/users` | List / create users (admin) |
| GET/PUT/DELETE | `/api/users/[id]` | User CRUD |
| POST | `/api/auth/register` | Public registration |
| GET/POST | `/api/transactions` | Transactions |
| GET | `/api/docs` | OpenAPI JSON |
| GET | `/api/docs/ui` | Swagger UI |
| GET | `/api/flags/[key]` | Feature flag status |

## Folder Structure

See architecture doc — key directories:

- `src/app/` — Next.js routes (thin delegates)
- `src/modules/` — Feature modules (users, auth, transactions)
- `src/lib/` — Infra (api, db, events, flags, rules-engine, openapi)
- `src/components/` — UI primitives + feature components
- `src/jobs/` — Weekly token cleanup (Vercel Cron)
- `prisma/` — Schema + seed

## Deploy (Vercel + MongoDB Atlas)

Personal/small-team deploy — no Redis or background workers required.

1. Create a MongoDB Atlas cluster and copy the connection string into `DATABASE_URL`.
2. Import the repo in Vercel and set env vars from `.env.example`.
3. Set `NEXTAUTH_URL` to your Vercel domain and `AUTO_VERIFY_EMAIL=true`.
4. Run `pnpm db:push` and `pnpm db:seed` once against Atlas (locally).
5. Optional: enable Vercel Cron (Pro) for weekly `/api/jobs/cleanup`.

Auth links (password reset, verification) are logged via Pino when `AUTO_VERIFY_EMAIL=false` — check Vercel function logs.

## Principal Engineer Rules

- One Prisma client singleton (`global.__prisma`)
- Route handlers ≤ 30 lines — delegate to modules
- Never import Prisma/models in client components
- Zod schemas = validation + OpenAPI source of truth
- Barrel exports (`index.ts`) on every folder
