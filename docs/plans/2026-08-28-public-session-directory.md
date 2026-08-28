# Public Session Directory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide a searchable public `/sessions` directory with a “Contribute” action for every imported session.

**Architecture:** Extend the public API with a hierarchy-only sessions endpoint. Keep grouping and filtering in a pure Nuxt utility, then render it from a mobile-first page using the existing visual system and session routes.

**Tech Stack:** Bun, Hono, Nuxt 4, Vue 3, TypeScript, `bun:test`.

---

### Task 1: Public programme endpoint

**Files:**
- Modify: `apps/api/src/routes/public.ts`
- Modify: `apps/api/test/public.test.ts`

1. Write a failing test for `GET /api/sessions` that verifies conferences, tracks, and sessions are returned without contributions, syntheses, or jobs.
2. Run the focused API test and confirm the endpoint returns 404.
3. Implement the hierarchy-only endpoint.
4. Run the focused API tests and commit as `feat: expose public session directory data`.

### Task 2: Searchable grouped session model

**Files:**
- Create: `apps/web/app/utils/session-directory.ts`
- Create: `apps/web/test/session-directory.test.ts`

1. Write failing tests for track-order grouping, case-insensitive title/description search, removal of empty groups, and contribution URLs.
2. Run the focused test and confirm the module is missing.
3. Implement the minimal pure grouping/filtering functions.
4. Run the focused tests and commit as `feat: model searchable session directory`.

### Task 3: Participant directory page and home navigation

**Files:**
- Create: `apps/web/app/pages/sessions/index.vue`
- Modify: `apps/web/app/pages/index.vue`
- Modify: `apps/web/test/session-view.test.ts`

1. Add a failing source-level regression check that the home primary action links to `/sessions` and the directory renders “Contribute” links.
2. Implement the mobile-first directory with loading, API error, no-results, search, track groups, schedule status, and contribution links.
3. Run web tests and type checks.
4. Commit as `feat: add participant session directory`.

### Task 4: Verification and documentation

**Files:**
- Modify: `README.md`

1. Add the public session-directory URL to the README.
2. Run `bun test`, `bun run typecheck`, `bun run build`, and `git diff --check`.
3. Start the combined dev stack, verify `/sessions`, the public API, and a contribution link, then stop it.
4. Commit as `docs: add public session directory` and merge the verified branch into `main`.
