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
