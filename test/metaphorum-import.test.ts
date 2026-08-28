import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteRepository, type ConferenceRepository } from "../packages/database/src";
import { importMetaphorumProgramme } from "../scripts/import-metaphorum";
import { loadMetaphorumProgramme } from "../scripts/metaphorum-programme";

let repository: ConferenceRepository | undefined;
let root: string | undefined;
afterEach(() => { repository?.close(); if (root) rmSync(root, { recursive: true, force: true }); });

test("imports the real programme idempotently", () => {
  root = mkdtempSync(join(tmpdir(), "metaphorum-import-"));
  repository = createSqliteRepository(join(root, "conference.db"));
  const programme = loadMetaphorumProgramme("/Users/mathis/dev/metaphorum/metaphorum");
  expect(importMetaphorumProgramme(repository, programme)).toEqual({ tracks: 6, sessions: 74, removedDemoSessions: 0 });
  expect(importMetaphorumProgramme(repository, programme)).toEqual({ tracks: 6, sessions: 74, removedDemoSessions: 0 });
  const hierarchy = repository.listHierarchy();
  expect(hierarchy.conferences).toHaveLength(1);
  expect(hierarchy.tracks).toHaveLength(6);
  expect(hierarchy.sessions).toHaveLength(74);
});
