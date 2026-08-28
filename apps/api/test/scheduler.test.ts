import { afterEach, expect, test } from "bun:test";
import type { ConferenceRepository } from "@conference/database";
import { fixture } from "./helpers";

let repository: ConferenceRepository | undefined;
afterEach(() => repository?.close());

test("requires cron secret and enqueues due session synthesis", async () => {
  const value = fixture(); repository = value.repository;
  expect((await value.app.request("/api/scheduler/tick", { method: "POST" })).status).toBe(401);
  const response = await value.app.request("/api/scheduler/tick?now=2026-09-17T11:15:00Z", {
    method: "POST", headers: { authorization: "Bearer cron" },
  });
  expect(response.status).toBe(202);
  expect(repository.listJobs().some((job) => job.type === "synthesize-session")).toBe(true);
});
