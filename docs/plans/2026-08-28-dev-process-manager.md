# Development Process Manager Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add attached `bun run dev` and external `bun run stop` commands that reliably manage the API, worker, and web development services as one unit.

**Architecture:** A testable process-state module validates the `.data/dev-processes.json` file and stops only recorded positive process-group IDs. A foreground Bun manager restarts old managed services, launches all three services in separate process groups, forwards their output, and shuts the group down on signals or child failure; a second entry point invokes the shared stop logic.

**Tech Stack:** Bun, TypeScript, `bun:test`, POSIX process groups.

---

### Task 1: Process state and safe stop behavior

**Files:**
- Create: `scripts/dev-processes.ts`
- Create: `test/dev-processes.test.ts`

1. Write failing tests for valid state parsing, malformed/stale state handling, graceful group termination, and state-file cleanup using injected filesystem and signal functions.
2. Run `bun test test/dev-processes.test.ts` and confirm the missing module causes failure.
3. Implement the smallest state reader/writer and stop function that validates positive integer PIDs, ignores missing processes, and never signals unvalidated values.
4. Run the focused test and confirm it passes.
5. Commit as `feat: add safe dev process state management`.

### Task 2: Attached manager and stop commands

**Files:**
- Create: `scripts/dev.ts`
- Create: `scripts/stop-dev.ts`
- Modify: `package.json`
- Modify: `test/dev-database-path.test.ts`

1. Extend the package-script regression test to require `dev` and `stop` entry points while retaining root-working-directory assertions.
2. Run the focused test and confirm it fails because the scripts are absent.
3. Implement `scripts/dev.ts` to stop an earlier managed run, spawn the existing API/worker/web commands in detached process groups with inherited output, write state, wait while attached, and clean up on signals or child exit. Implement `scripts/stop-dev.ts` through the shared stop function. Add package scripts.
4. Run the focused process and package-script tests.
5. Commit as `feat: manage all development services together`.

### Task 3: Documentation and verification

**Files:**
- Modify: `README.md`

1. Document `bun run dev`, Ctrl+C, restart behavior, and `bun run stop`; retain individual service commands as troubleshooting alternatives.
2. Run `bun test`, `bun run typecheck`, and `bun run build`.
3. Start `bun run dev`, verify API health and an imported session, run `bun run stop` from another shell, and confirm all managed processes exit.
4. Run `git diff --check` and commit as `docs: explain combined development commands`.
