# Session QR Selection and PDF Printing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let organizers select and sort sessions, then open a polished QR-code PDF with one session per page and conditional track dividers.

**Architecture:** Pure TypeScript functions derive speaker names, sorted rows, and a deterministic print-page plan. A browser-only jsPDF adapter renders that plan with generated QR images, while a Vue component owns checkbox state and dashboard interaction.

**Tech Stack:** Bun, Nuxt 4, Vue 3, TypeScript, `bun:test`, qrcode, jsPDF.

---

### Task 1: Sortable QR print model

**Files:**
- Create: `apps/web/app/utils/session-qr-print.ts`
- Create: `apps/web/test/session-qr-print.test.ts`

1. Write failing tests for speaker extraction; alphabetical, chronological, and track ordering; unscheduled sessions last; and public contribution URLs.
2. Run the focused test and confirm the module is missing.
3. Implement the minimal sort/view-model functions.
4. Run focused tests and commit as `feat: model sortable QR session selection`.

### Task 2: Deterministic PDF page planning

**Files:**
- Modify: `apps/web/app/utils/session-qr-print.ts`
- Modify: `apps/web/test/session-qr-print.test.ts`

1. Write failing tests for one session page per selected session, no dividers for alphabetical/time sorting, no divider for one selected track, and one divider per included track when track-sorted across multiple tracks.
2. Implement the page-plan function.
3. Run focused tests and commit as `feat: plan session QR PDF pages`.

### Task 3: Browser PDF renderer

**Files:**
- Modify: `apps/web/package.json`
- Modify: `bun.lock`
- Create: `apps/web/app/utils/session-qr-pdf.client.ts`
- Create: `apps/web/test/session-qr-pdf.test.ts`

1. Add jsPDF through Bun.
2. Write failing tests around an injected document adapter for A4 page count, wrapped title/speaker placement, QR placement in the lower third, and Blob output.
3. Implement the browser-only renderer and separate-tab opening behavior.
4. Run focused tests and type checks; commit as `feat: generate printable session QR PDFs`.

### Task 4: Selectable dashboard list

**Files:**
- Create: `apps/web/app/components/SessionQrPrintList.vue`
- Modify: `apps/web/app/pages/organizer/index.vue`
- Remove: `apps/web/app/components/SessionQr.vue`
- Modify: `apps/web/test/dashboard.test.ts`

1. Write failing source/view-model checks for all-selected initialization, synchronized top/bottom All controls, indeterminate state, sort controls, selected count, and print action.
2. Implement the accessible selectable list and replace the old QR-card grid.
3. Run web tests and type checks; commit as `feat: add selectable session QR printing`.

### Task 5: PDF visual verification and merge

**Files:**
- Modify: `README.md`

1. Document organizer QR selection and PDF behavior.
2. Run `bun test`, `bun run typecheck`, `bun run build`, and `git diff --check`.
3. Generate a representative PDF containing long/short titles and multiple tracks, render every page to PNG, and inspect title wrapping, speaker hierarchy, divider pages, and QR placement.
4. Run the live dashboard flow and verify the PDF opens in a separate tab.
5. Commit documentation, merge into `main`, rerun tests, and clean the feature worktree.
