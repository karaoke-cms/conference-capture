import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSqliteRepository, type ConferenceRepository } from "../src";

let repository: ConferenceRepository | undefined;
afterEach(() => repository?.close());

describe("conference repository", () => {
  test("creates a missing parent directory for a file database", () => {
    const root = mkdtempSync(join(tmpdir(), "conference-repository-"));
    const path = join(root, "nested", "conference.db");
    try {
      repository = createSqliteRepository(path);
      expect(repository.listHierarchy().conferences).toEqual([]);
    } finally {
      repository?.close();
      repository = undefined;
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("stores hierarchy and resolves a public session slug", () => {
    repository = createSqliteRepository(":memory:");
    repository.createConference({ id: "c1", slug: "metaphorum", title: "Metaphorum 2026", description: "Living conversation", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
    repository.createTrack({ id: "t1", conferenceId: "c1", title: "Recursive practice", order: 1 });
    repository.createSession({ id: "s1", trackId: "t1", slug: "ai-and-vsm", title: "AI and VSM", description: "Agency and autonomy", startsAt: "2026-09-17T10:00:00Z", endsAt: "2026-09-17T11:00:00Z" });
    expect(repository.getSessionContext("ai-and-vsm")?.conference.title).toBe("Metaphorum 2026");
  });

  test("creates timestamped contributions and processing jobs", () => {
    repository = createSqliteRepository(":memory:");
    repository.createConference({ id: "c1", slug: "m", title: "M", description: "", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
    repository.createTrack({ id: "t1", conferenceId: "c1", title: "T", order: 1 });
    repository.createSession({ id: "s1", trackId: "t1", slug: "s", title: "S", description: "", startsAt: "2026-09-17T10:00:00Z", endsAt: "2026-09-17T11:00:00Z" });
    const contribution = repository.createContribution({ sessionId: "s1", caption: "An insight", type: "insight", signal: "curious" });
    const job = repository.enqueueJob({ type: "analyze-contribution", scopeId: contribution.id });
    expect(contribution.createdAt).toMatch(/^\d{4}-/);
    expect(repository.listContributions({ sessionId: "s1" })).toHaveLength(1);
    expect(repository.claimNextJob()?.id).toBe(job.id);
  });

  test("retains synthesis source IDs", () => {
    repository = createSqliteRepository(":memory:");
    const synthesis = repository.saveSynthesis({
      scopeType: "session", scopeId: "s1", summary: "Summary", themes: ["agency"],
      tensions: [], weakSignals: [], sentiment: { curious: 1 }, sourceContributionIds: ["b", "a"], questions: [],
    });
    expect(repository.latestSynthesis("session", "s1")?.sourceContributionIds).toEqual(["a", "b"]);
    expect(synthesis.generatedAt).toMatch(/^\d{4}-/);
  });
});
