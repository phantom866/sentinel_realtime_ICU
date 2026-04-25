# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Project Sentinel — ICU Monitoring

A real-time decentralized ICU monitoring web app at the `sentinel` artifact (path `/`).

- **Frontend**: React + Vite + TanStack Query + Recharts + framer-motion + shadcn/ui (deep-teal command-room theme).
- **Backend**: Express 5 + PostgreSQL + Drizzle. Vitals simulator runs every 2s (`startSimulator` in `artifacts/api-server/src/index.ts`) and writes synthetic vitals; classifier emits alerts on threshold breaches with a 5-minute per-(patient, type) dedup window.
- **"Real-time"**: TanStack Query `refetchInterval` polling (1.5s for vitals/alerts/dashboard, 3s for patient/bed lists). No WebSockets.
- **Auth**: Demo only — `localStorage["sentinel_auth"] === "true"` gate via `useAuth` in `artifacts/sentinel/src/hooks/use-auth.ts`. Login/Register accept any input.
- **Pages**: `/login`, `/register`, `/` (Dashboard), `/patients`, `/patients/:id`, `/beds`, `/alerts`. Layout sidebar in `artifacts/sentinel/src/components/layout.tsx`.
- **Domain logic** (`artifacts/api-server/src/lib/sentinel.ts`): `classifyVitals`, `computeRiskScore`, `simulateTick`, `maybeCreateAlerts`. Powers the `/api/patients/:id/predict-risk` endpoint.
- **Schema**: `lib/db/src/schema/patients.ts` — patients, vitals, beds, alerts. Seed in `lib/db/src/seed.ts` creates 12 beds and 7 patients across varied diagnoses (sepsis, ARDS, post-op, pneumonia, stroke, etc).
