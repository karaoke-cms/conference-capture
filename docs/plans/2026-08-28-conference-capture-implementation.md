# Metaphorum Conference Capture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a working split-service MVP for anonymous conference contributions, asynchronous AI enrichment, recursive synthesis, organizer controls, and World Café question generation.

**Architecture:** A Bun workspace contains a Nuxt 4 frontend, a TypeScript API, and a separately runnable worker. Shared domain, contracts, database, storage, and AI packages enforce provider boundaries and keep PostgreSQL/S3/external-AI production configuration compatible with zero-credential local fallbacks.

**Tech Stack:** Bun 1.3, TypeScript 5.9, Nuxt 4, Vue 3, Hono, Zod 4, Drizzle ORM, PostgreSQL, SQLite, S3-compatible storage, scoped CSS, Bun test.

---

### Task 1: Workspace and shared contracts

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`
- Create: `packages/contracts/package.json`, `packages/contracts/src/index.ts`
- Test: `packages/contracts/test/contracts.test.ts`

**Steps:**
1. Write failing schema tests for contribution input, scope types, signals, synthesis output, API error shape, and environment-independent identifiers.
2. Run `bun test packages/contracts/test/contracts.test.ts`; expect failure because the schemas do not exist.
3. Add the Bun workspace, strict shared TypeScript configuration, and minimal Zod schemas/types.
4. Re-run the focused test; expect all contract tests to pass.
5. Commit with `git commit -m "feat: establish workspace contracts"`.

### Task 2: Domain model and recursive synthesis rules

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/src/index.ts`, `packages/domain/src/synthesis.ts`, `packages/domain/src/questions.ts`, `packages/domain/src/scheduling.ts`
- Test: `packages/domain/test/synthesis.test.ts`, `packages/domain/test/questions.test.ts`, `packages/domain/test/scheduling.test.ts`

**Steps:**
1. Write failing tests proving scope membership, source-contribution deduplication, empty-scope behavior, question count/diversity, and due-job calculations.
2. Run `bun test packages/domain/test`; expect missing-module failures.
3. Implement pure domain functions only: resolve contribution IDs for session/track/conference, normalize synthesis provenance, rank three or four distinct questions, and determine scheduled jobs.
4. Run focused tests; expect all domain tests to pass.
5. Commit with `git commit -m "feat: model recursive conference synthesis"`.

### Task 3: Database schema and repository contracts

**Files:**
- Create: `packages/database/package.json`, `packages/database/drizzle.config.ts`
- Create: `packages/database/src/schema.ts`, `packages/database/src/repository.ts`, `packages/database/src/sqlite.ts`, `packages/database/src/postgres.ts`, `packages/database/src/index.ts`
- Create: `packages/database/migrations/0000_initial.sql`
- Test: `packages/database/test/repository.test.ts`

**Steps:**
1. Write repository contract tests for conference/track/session hierarchy, slug lookup, timestamped contribution creation, processing-job lifecycle, synthesis provenance, and latest-synthesis lookup.
2. Run `bun test packages/database/test`; expect failure because adapters are absent.
3. Define Drizzle tables for conferences, tracks, sessions, contributions, processing jobs, syntheses, synthesis sources, and questions. Implement the SQLite local adapter and PostgreSQL factory behind the same repository interface.
4. Run repository tests against a temporary SQLite database; expect passes with isolated test data.
5. Commit with `git commit -m "feat: add conference persistence layer"`.

### Task 4: Object-storage adapters

**Files:**
- Create: `packages/storage/package.json`
- Create: `packages/storage/src/types.ts`, `packages/storage/src/local.ts`, `packages/storage/src/s3.ts`, `packages/storage/src/index.ts`
- Test: `packages/storage/test/storage.test.ts`

**Steps:**
1. Write failing adapter-contract tests for safe generated keys, byte persistence, content type, public URL resolution, and path traversal rejection.
2. Run `bun test packages/storage/test`; expect failure.
3. Implement local storage and an S3-compatible adapter selected by environment configuration.
4. Run focused tests; expect passes.
5. Commit with `git commit -m "feat: abstract contribution media storage"`.

### Task 5: AI provider and deterministic fallback

**Files:**
- Create: `packages/ai/package.json`
- Create: `packages/ai/src/provider.ts`, `packages/ai/src/mock.ts`, `packages/ai/src/openai.ts`, `packages/ai/src/index.ts`
- Test: `packages/ai/test/mock.test.ts`, `packages/ai/test/provider.test.ts`

**Steps:**
1. Write failing tests for image understanding, tags, sentiment, embeddings, scoped synthesis, empty input, grounded source IDs, and final question generation.
2. Run `bun test packages/ai/test`; expect failure.
3. Implement the provider interface, deterministic fallback, optional credential-backed provider, and provider selection with no network calls in fallback mode.
4. Run focused tests; expect passes and deterministic snapshots.
5. Commit with `git commit -m "feat: add safe AI processing abstraction"`.

### Task 6: API service

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`
- Create: `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/config.ts`, `apps/api/src/errors.ts`, `apps/api/src/dependencies.ts`
- Create: `apps/api/src/routes/public.ts`, `apps/api/src/routes/organizer.ts`, `apps/api/src/routes/scheduler.ts`
- Test: `apps/api/test/public.test.ts`, `apps/api/test/organizer.test.ts`, `apps/api/test/scheduler.test.ts`

**Steps:**
1. Write failing HTTP tests for health, session-by-slug, multipart anonymous contribution creation, text-only contribution creation, validation errors, upload limits, organizer authorization, dashboard payloads, manual synthesis enqueueing, scheduler-secret enforcement, and due-job enqueueing.
2. Run `bun test apps/api/test`; expect missing-app failures.
3. Implement Hono routes and dependency injection. Make contribution writes and job creation consistent, return typed errors, enforce media safety, and add CORS configuration for the web app.
4. Run API tests; expect passes.
5. Commit with `git commit -m "feat: expose conference capture API"`.

### Task 7: Independent worker

**Files:**
- Create: `apps/worker/package.json`, `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`, `apps/worker/src/worker.ts`, `apps/worker/src/handlers.ts`
- Test: `apps/worker/test/worker.test.ts`, `apps/worker/test/handlers.test.ts`

**Steps:**
1. Write failing tests for safe job claiming, contribution enrichment, retry/failure recording, session/track/conference synthesis, provenance retention, and three-to-four-question output.
2. Run `bun test apps/worker/test`; expect failure.
3. Implement polling and one-shot modes, contribution and synthesis handlers, graceful shutdown, retry limits, and deterministic fallback behavior.
4. Run worker tests; expect passes.
5. Commit with `git commit -m "feat: process enrichment and synthesis jobs"`.

### Task 8: Nuxt participant experience

**Files:**
- Create: `apps/web/package.json`, `apps/web/nuxt.config.ts`, `apps/web/tsconfig.json`
- Create: `apps/web/app/app.vue`, `apps/web/app/assets/css/main.css`
- Create: `apps/web/app/pages/index.vue`, `apps/web/app/pages/session/[slug].vue`
- Create: `apps/web/app/components/ContributionForm.vue`, `apps/web/app/components/SignalPicker.vue`, `apps/web/app/components/SessionHeader.vue`
- Create: `apps/web/app/utils/contribution-form.ts`, `apps/web/app/utils/api.ts`
- Test: `apps/web/test/contribution-form.test.ts`, `apps/web/test/session-view.test.ts`

**Steps:**
1. Write failing pure view-state tests for required/optional fields, signal selection, multipart serialization, accessible error messages, and success reset.
2. Run `bun test apps/web/test`; expect missing-module failures.
3. Implement the mobile-first session page and contribution form in Nuxt 4/Vue 3 with scoped CSS, semantic HTML, large touch targets, reduced-motion handling, camera-friendly upload, and no authentication prompt.
4. Run web tests and `bun --cwd apps/web typecheck`; expect passes.
5. Commit with `git commit -m "feat: add anonymous mobile capture flow"`.

### Task 9: Organizer dashboard and QR links

**Files:**
- Create: `apps/web/app/pages/organizer/index.vue`
- Create: `apps/web/app/components/ScopePanel.vue`, `apps/web/app/components/SentimentChart.vue`, `apps/web/app/components/ContributionCard.vue`, `apps/web/app/components/QuestionList.vue`, `apps/web/app/components/SessionQr.vue`
- Create: `apps/web/app/utils/dashboard.ts`
- Test: `apps/web/test/dashboard.test.ts`

**Steps:**
1. Write failing view-model tests for grouping contributions, newest synthesis selection, sentiment proportions, tension/theme rendering, action availability, QR URL construction, and question count.
2. Run the dashboard tests; expect failure.
3. Implement the responsive organizer dashboard, bearer-token entry stored only for the browser session, contribution gallery, scope summaries, theme/tension/sentiment/weak-signal views, manual triggers, retry feedback, QR presentation, and World Café questions.
4. Run web tests and type checking; expect passes.
5. Commit with `git commit -m "feat: add organizer sensemaking dashboard"`.

### Task 10: Seed data, scheduling, and local operation

**Files:**
- Create: `scripts/seed.ts`, `scripts/scheduler.ts`
- Create: `docker-compose.yml`, `Dockerfile.api`, `Dockerfile.worker`, `Dockerfile.web`
- Test: `test/smoke.test.ts`

**Steps:**
1. Write a failing smoke test that seeds a conference, fetches a public session, submits a contribution, runs the worker once, triggers each synthesis scope, and verifies four or fewer grounded World Café questions.
2. Run `bun test test/smoke.test.ts`; expect failure.
3. Add Metaphorum sample data, scheduler command, container definitions, and root scripts for development and one-shot processing.
4. Run the smoke test; expect the full local flow to pass.
5. Commit with `git commit -m "feat: make the local conference flow runnable"`.

### Task 11: Documentation and final verification

**Files:**
- Create: `README.md`
- Modify: `.env.example`

**Steps:**
1. Document prerequisites, Bun commands, zero-config local mode, PostgreSQL migration, S3 variables, AI-provider variables, organizer/cron secrets, service topology, routes, data flow, scheduled/manual synthesis, deployment, and fallback behavior.
2. Run `bun test`; expect zero failures.
3. Run `bun run typecheck`; expect all workspace packages and applications to pass.
4. Run `bun run build`; expect API, worker, and Nuxt production builds to succeed.
5. Start the local stack and run the smoke flow; verify participant submission, contribution enrichment, dashboard loading, all synthesis levels, and three or four final questions.
6. Run `git diff --check` and `git status --short`; inspect every remaining change.
7. Commit with `git commit -m "docs: explain conference capture operation"`.
