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

  test("upserts unscheduled programme records and updates source changes", () => {
    repository = createSqliteRepository(":memory:");
    repository.createConference({ id: "c1", slug: "m", title: "M", description: "", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
    repository.upsertTrack({ id: "source:t1", conferenceId: "c1", title: "Original", order: 1 });
    repository.upsertTrack({ id: "source:t1", conferenceId: "c1", title: "Updated", order: 2 });
    repository.upsertSession({ id: "source:s1", trackId: "source:t1", slug: "source-session", title: "Original", description: "Draft" });
    repository.upsertSession({ id: "source:s1", trackId: "source:t1", slug: "source-session", title: "Updated", description: "Final" });
    const hierarchy = repository.listHierarchy();
    expect(hierarchy.tracks).toHaveLength(1);
    expect(hierarchy.tracks[0]?.title).toBe("Updated");
    expect(hierarchy.sessions[0]?.title).toBe("Updated");
    expect(hierarchy.sessions[0]?.startsAt).toBeUndefined();
  });

  test("removes only demo sessions without contributions", () => {
    repository = createSqliteRepository(":memory:");
    repository.createConference({ id: "c1", slug: "m", title: "M", description: "", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
    repository.createTrack({ id: "demo-track", conferenceId: "c1", title: "Demo", order: 1 });
    repository.createSession({ id: "empty-demo", trackId: "demo-track", slug: "empty", title: "Empty", description: "" });
    repository.createSession({ id: "used-demo", trackId: "demo-track", slug: "used", title: "Used", description: "" });
    repository.createContribution({ sessionId: "used-demo", caption: "Keep this", type: "insight", signal: "curious" });
    expect(repository.removeSessionsWithoutContributions(["empty-demo", "used-demo"])).toBe(1);
    expect(repository.listHierarchy().sessions.map((session) => session.id)).toEqual(["used-demo"]);
  });
});
