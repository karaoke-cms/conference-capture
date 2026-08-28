# Metaphorum Programme Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an idempotent importer that loads six tracks and 74 talks from the Metaphorum website repository as capture sessions without inventing schedule times.

**Architecture:** A pure parser converts source JSON into capture-domain records. Repository upserts persist normalized records, while optional schedule fields keep incomplete programme data explicit.

**Tech Stack:** Bun, TypeScript, Bun test, SQLite, JSON source files.

---

### Task 1: Normalize the external programme

**Files:**
- Create: `scripts/metaphorum-programme.ts`
- Test: `test/metaphorum-programme.test.ts`

1. Write failing tests for six track mappings, 74 talk mappings, speaker enrichment, stable unique slugs, and unscheduled talks.
2. Run `bun test test/metaphorum-programme.test.ts`; expect a missing-module failure.
3. Implement JSON parsing and pure normalization.
4. Re-run the focused test; expect all parser assertions to pass.
5. Commit `feat: normalize Metaphorum programme data`.

### Task 2: Support optional schedules and programme upserts

**Files:**
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/database/src/repository.ts`
- Modify: `packages/database/src/sqlite.ts`
- Test: `packages/database/test/repository.test.ts`

1. Write failing tests for optional session times, track/session upsert updates, and safe demo cleanup.
2. Run the repository tests; expect failures for missing repository methods.
3. Implement optional time mapping and transactional upserts without deleting sessions that have contributions.
4. Run contract and repository tests; expect passes.
5. Commit `feat: support imported programme records`.

### Task 3: Add the import command and UI fallback

**Files:**
- Create: `scripts/import-metaphorum.ts`
- Modify: `package.json`
- Modify: `apps/web/app/pages/session/[slug].vue`
- Test: `test/metaphorum-import.test.ts`

1. Write a failing integration test that imports fixtures twice and verifies stable counts.
2. Run the focused test; expect failure.
3. Implement the command, source-path option, upserts, safe demo cleanup, count reporting, and “Schedule to be confirmed” UI fallback.
4. Run importer, web, and smoke tests; expect passes.
5. Commit `feat: import Metaphorum sessions`.

### Task 4: Import real data and verify

**Files:**
- Modify: `README.md`
- Runtime data: `.data/conference.db` (ignored)

1. Document the import command and source-of-truth behavior.
2. Run the command against `/Users/mathis/dev/metaphorum/metaphorum`.
3. Verify the local database contains six imported tracks and 74 imported sessions.
4. Run `bun test`, `bun run typecheck`, and `bun run build`.
5. Commit `docs: explain Metaphorum programme import`.
