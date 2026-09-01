import { afterEach, expect, test } from "bun:test";
import type { ConferenceRepository } from "@conference/database";
import { fixture } from "./helpers";

let repository: ConferenceRepository | undefined;
afterEach(() => repository?.close());

test("protects organizer data and enqueues manual synthesis", async () => {
  const value = fixture(); repository = value.repository;
  expect((await value.app.request("/api/organizer/dashboard")).status).toBe(401);
  const headers = { authorization: "Bearer organizer" };
  expect((await value.app.request("/api/organizer/dashboard", { headers })).status).toBe(200);
  const response = await value.app.request("/api/organizer/synthesis", {
    method: "POST", headers: { ...headers, "content-type": "application/json" },
    body: JSON.stringify({ scopeType: "conference", scopeId: "c1" }),
  });
  expect(response.status).toBe(202);
  expect(repository.listJobs()[0]?.type).toBe("synthesize-conference");
});

test("imports the shipped programme behind the organizer token, with start times", async () => {
  const value = fixture(); repository = value.repository;
  expect((await value.app.request("/api/organizer/import-sessions", { method: "POST" })).status).toBe(401);

  const headers = { authorization: "Bearer organizer" };
  const response = await value.app.request("/api/organizer/import-sessions", { method: "POST", headers });
  expect(response.status).toBe(200);
  const result = await response.json() as { sessions: number; tracks: number; scheduled: number };
  expect(result.sessions).toBeGreaterThan(0);
  expect(result.scheduled).toBeGreaterThan(0);

  // Upsert, not replace: the fixture's own session survives alongside the imported programme.
  const sessions = repository.listHierarchy().sessions;
  const imported = sessions.filter((session) => session.id.startsWith("metaphorum:"));
  expect(imported).toHaveLength(result.sessions);
  expect(imported.filter((session) => session.startsAt)).toHaveLength(result.scheduled);
  expect(sessions.some((session) => session.id === "s1")).toBe(true);
});
