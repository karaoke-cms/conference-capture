import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMockAiProvider } from "../packages/ai/src";
import { createSqliteRepository, type ConferenceRepository } from "../packages/database/src";
import { createLocalStorage } from "../packages/storage/src";
import { createApp } from "../apps/api/src/app";
import { processNextJob } from "../apps/worker/src/worker";
import { seedMetaphorum } from "../scripts/seed";

let directory: string | undefined;
let repository: ConferenceRepository | undefined;
afterEach(async () => { repository?.close(); if (directory) await rm(directory, { recursive: true, force: true }); });

describe("local conference flow", () => {
  test("captures, enriches, synthesizes, and generates grounded questions", async () => {
    directory = await mkdtemp(join(tmpdir(), "conference-smoke-"));
    repository = createSqliteRepository(join(directory, "conference.db"));
    seedMetaphorum(repository);
    const storage = createLocalStorage({ directory: join(directory, "uploads"), publicBaseUrl: "http://localhost:8787/media" });
    const app = createApp({ repository, storage, config: { organizerToken: "organizer", cronSecret: "cron", webOrigin: "http://localhost:3000", maxUploadBytes: 5_000_000 } });

    const session = await (await app.request("/api/sessions/ai-and-vsm")).json();
    expect(session.session.id).toBe("session-ai-vsm");
    const created = await app.request("/api/contributions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "session-ai-vsm", caption: "AI changes autonomy and accountability.", type: "insight", signal: "challenged" }),
    });
    expect(created.status).toBe(201);
    while (await processNextJob(repository, createMockAiProvider())) {}

    const auth = { authorization: "Bearer organizer", "content-type": "application/json" };
    for (const body of [
      { scopeType: "session", scopeId: "session-ai-vsm" },
      { scopeType: "track", scopeId: "track-emerging" },
      { scopeType: "conference", scopeId: "metaphorum-2026" },
    ]) {
      expect((await app.request("/api/organizer/synthesis", { method: "POST", headers: auth, body: JSON.stringify(body) })).status).toBe(202);
      await processNextJob(repository, createMockAiProvider());
    }
    expect((await app.request("/api/organizer/synthesis", { method: "POST", headers: auth, body: JSON.stringify({ scopeType: "world-cafe", scopeId: "metaphorum-2026" }) })).status).toBe(202);
    await processNextJob(repository, createMockAiProvider());

    const result = repository.latestSynthesis("conference", "metaphorum-2026");
    expect(result?.sourceContributionIds).toHaveLength(1);
    expect(result?.questions.length).toBeGreaterThanOrEqual(3);
    expect(result?.questions.length).toBeLessThanOrEqual(4);
  });

  test("can reopen an initialized database and seed idempotently", async () => {
    directory = await mkdtemp(join(tmpdir(), "conference-restart-"));
    const path = join(directory, "conference.db");
    const first = createSqliteRepository(path); seedMetaphorum(first); first.close();
    repository = createSqliteRepository(path); seedMetaphorum(repository);
    expect(repository.listHierarchy().conferences).toHaveLength(1);
  });
});
