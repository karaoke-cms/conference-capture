# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first conference sensemaking system for Metaphorum 2026. Participants open a session URL/QR code and submit an anonymous photo and/or short observation. A worker enriches contributions with AI and produces traceable syntheses (themes, tensions, weak signals, sentiment) at session, track, and conference scope, plus World Café questions. See `README.md` for full product and environment-variable documentation.

## Commands

```bash
bun install               # install all workspaces
cp .env.example .env      # local env (no external credentials required)
bun run seed               # idempotently add sample conference data

bun run dev                 # start api + worker + web together (managed, combined logs)
bun run stop                 # stop all managed dev services started by `bun run dev`
bun run dev:api / dev:worker / dev:web   # start one service standalone, for troubleshooting

bun test                    # all tests (root + every workspace)
bun test <path/to/file>     # single test file, e.g. bun test test/smoke.test.ts
bun run typecheck            # strict tsc/nuxt typecheck across every workspace (bun run --filter '*' typecheck)
bun run build                 # production build of every workspace

bun run worker:once           # process a single queued job then exit
bun run scheduler              # fire one scheduler tick (POST /api/scheduler/tick)
bun run import:metaphorum       # idempotent import of the Metaphorum programme (see README)
```

Per-workspace scripts (`test`, `typecheck`, `build`) exist in every `apps/*` and `packages/*` package and can be run directly, e.g. `cd packages/domain && bun test`.

`apps/web` is excluded from the root `tsconfig.json`; it has its own tsconfig/Nuxt typecheck (`nuxt typecheck`) instead of `tsc --noEmit`.

## Architecture

Bun workspaces monorepo: `apps/*` are the three deployable services, `packages/*` are shared libraries consumed via `workspace:*`.

```
apps/web (Nuxt 4 / Vue 3)  --HTTP-->  apps/api (Hono)
                                            |
                                    packages/database (ConferenceRepository)
                                            |
                                     SQLite (Bun driver, WAL) locally
                                     PostgreSQL client boundary for production
                                            |
                              apps/worker  <-- claims jobs from the same repository
                                            |
                                    packages/ai (AiProvider: mock | openai)
```

- **packages/contracts** — the single source of truth for the data model: zod schemas + inferred types (`Conference`, `Track`, `Session`, `Contribution`, `Synthesis`, `ProcessingJob`, etc.) shared by every other package and app. Change data shapes here first.
- **packages/domain** — pure business logic with no I/O: synthesis composition (`synthesis.ts`), World Café question generation (`questions.ts`), and scheduling due-time rules (`scheduling.ts`).
- **packages/database** — defines the `ConferenceRepository` interface (`repository.ts`) that both `apps/api` and `apps/worker` depend on, plus the only current implementation (`sqlite.ts`) and a separate PostgreSQL client boundary (`postgres.ts`) that is not yet wired into a repository. The canonical schema lives in `packages/database/migrations/0000_initial.sql`, written to be Postgres-compatible even though SQLite is what actually runs today. When changing persisted shapes, update the migration, `schema.ts`, and the SQLite implementation together.
- **packages/storage** — `ObjectStorage` interface with `local.ts` (filesystem) and `s3.ts` (private bucket, presigned URLs, SSE) adapters, selected at runtime via `STORAGE_DRIVER`.
- **packages/ai** — `AiProvider` interface (`provider.ts`) with `mock.ts` (deterministic, no credentials — the default) and `openai.ts` (falls back to mock on request failure) implementations, selected via `AI_PROVIDER`.
- **apps/api** — Hono service. `dependencies.ts` wires the repository/storage adapters from env vars (dependency injection, no framework/DI container); `app.ts` assembles routes and error handling; `routes/public.ts`, `routes/organizer.ts`, `routes/scheduler.ts` split endpoints by auth: public, organizer-bearer-token, and cron-bearer-token respectively.
- **apps/worker** — polls `repository.claimNextJob()` in a loop (`worker.ts`), dispatches by job type in `handlers.ts`, and can run continuously or in `--once` mode. AI failures never block contribution capture — enrichment is best-effort and asynchronous.
- **apps/web** — Nuxt 4 participant + organizer UI, following the conventions used by `karaoke5` (see `~/dev/karaoke/CLAUDE.md`). Talks to the API only through `app/utils/api.ts`; `app/utils/` holds the other client-side logic (dashboard aggregation, session directory, session QR PDF generation via `jspdf`+`qrcode`) with matching tests in `apps/web/test/`.

### Cross-cutting conventions

- **Dependency direction**: `contracts` → `domain`/`database`/`storage`/`ai` → `apps/*`. Apps depend on package interfaces (`ConferenceRepository`, `ObjectStorage`, `AiProvider`), never on a specific adapter directly except in their own `dependencies.ts`/wiring code — this is what lets storage/AI/database backends swap via env vars without touching route or worker logic.
- **Provenance**: every synthesis stores the exact `sourceContributionIds` it was derived from — preserve this when touching synthesis code.
- **Scheduling**: session synthesis is due 10 minutes after a session ends; conference synthesis and World Café generation are due 1 hour before the conference ends (`packages/domain/src/scheduling.ts`). The scheduler endpoint (`POST /api/scheduler/tick`, cron-bearer-token protected) and `bun run scheduler` are how this gets triggered externally (no in-process cron).
- **`bun run dev`** is a process manager (`scripts/dev.ts` + `scripts/dev-processes.ts`), not just a task runner — it tracks PIDs in `.data/`, kills any previously-managed run before starting, and stops all three services together on Ctrl+C or `bun run stop`. Prefer it over ad hoc `bun --watch` invocations unless isolating one service for debugging.
- **Docker**: `Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.web` are separate images built from `docker-compose.yml`; API and worker share a named volume for SQLite + uploads.
