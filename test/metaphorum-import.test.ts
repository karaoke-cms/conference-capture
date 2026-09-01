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
  // Counts come from the source programme, which grows as talks are added.
  const expected = {
    tracks: programme.tracks.length,
    sessions: programme.sessions.length,
    scheduled: programme.sessions.filter((session) => session.startsAt).length,
    removedDemoSessions: 0,
  };
  expect(importMetaphorumProgramme(repository, programme)).toEqual(expected);
  expect(importMetaphorumProgramme(repository, programme)).toEqual(expected);
  const hierarchy = repository.listHierarchy();
  expect(hierarchy.conferences).toHaveLength(1);
  expect(hierarchy.tracks).toHaveLength(expected.tracks);
  expect(hierarchy.sessions).toHaveLength(expected.sessions);
  expect(hierarchy.sessions.filter((session) => session.startsAt)).toHaveLength(expected.scheduled);
});
