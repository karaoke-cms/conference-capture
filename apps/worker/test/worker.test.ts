import { afterEach, describe, expect, test } from "bun:test";
import { createMockAiProvider } from "@conference/ai";
import { createSqliteRepository, type ConferenceRepository } from "@conference/database";
import { processNextJob } from "../src/worker";

let repository: ConferenceRepository | undefined;
afterEach(() => repository?.close());

function fixture() {
  repository = createSqliteRepository(":memory:");
  repository.createConference({ id: "c1", slug: "m", title: "Metaphorum", description: "", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
  repository.createTrack({ id: "t1", conferenceId: "c1", title: "Practice", order: 1 });
  repository.createSession({ id: "s1", trackId: "t1", slug: "session", title: "Session", description: "", startsAt: "2026-09-17T10:00:00Z", endsAt: "2026-09-17T11:00:00Z" });
  return repository;
}

describe("processing worker", () => {
  test("enriches a contribution and completes its job", async () => {
    const repo = fixture();
    const contribution = repo.createContribution({ sessionId: "s1", caption: "Autonomy and accountability", type: "insight", signal: "challenged" });
    repo.enqueueJob({ type: "analyze-contribution", scopeId: contribution.id });
    expect(await processNextJob(repo, createMockAiProvider())).toBe(true);
    expect(repo.listContributions()[0]?.processingStatus).toBe("processed");
    expect(repo.listJobs()[0]?.status).toBe("completed");
  });

  test("generates syntheses at every recursive scope with source IDs", async () => {
    const repo = fixture();
    const contribution = repo.createContribution({ sessionId: "s1", caption: "Autonomy and accountability", type: "insight", signal: "challenged" });
    repo.updateContributionAnalysis(contribution.id, { aiDescription: "Autonomy", tags: ["autonomy", "accountability"], inferredSentiment: "challenged", embedding: [0] });
    for (const [type, scopeId] of [["synthesize-session", "s1"], ["synthesize-track", "t1"], ["synthesize-conference", "c1"]] as const) {
      repo.enqueueJob({ type, scopeId });
      await processNextJob(repo, createMockAiProvider());
    }
    expect(repo.listSyntheses()).toHaveLength(3);
    expect(repo.latestSynthesis("conference", "c1")?.sourceContributionIds).toEqual([contribution.id]);
  });

  test("generates four World Cafe questions and records failures", async () => {
    const repo = fixture();
    const contribution = repo.createContribution({ sessionId: "s1", caption: "Agency remains unresolved", type: "question", signal: "curious" });
    repo.updateContributionAnalysis(contribution.id, { aiDescription: "Agency", tags: ["agency"], inferredSentiment: "curious", embedding: [0] });
    repo.enqueueJob({ type: "synthesize-conference", scopeId: "c1" });
    await processNextJob(repo, createMockAiProvider());
    repo.enqueueJob({ type: "generate-world-cafe", scopeId: "c1" });
    await processNextJob(repo, createMockAiProvider());
    expect(repo.latestSynthesis("conference", "c1")?.questions).toHaveLength(4);

    repo.enqueueJob({ type: "synthesize-session", scopeId: "missing" });
    await processNextJob(repo, createMockAiProvider());
    expect(repo.listJobs().find((job) => job.scopeId === "missing")?.status).toBe("failed");
  });
});
