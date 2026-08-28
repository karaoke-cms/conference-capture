import { afterEach, describe, expect, test } from "bun:test";
import type { ConferenceRepository } from "@conference/database";
import { fixture } from "./helpers";

let repository: ConferenceRepository | undefined;
afterEach(() => repository?.close());

describe("public API", () => {
  test("returns public programme hierarchy without organizer data", async () => {
    const value = fixture(); repository = value.repository;
    const response = await value.app.request("/api/sessions");

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.conferences).toHaveLength(1);
    expect(body.tracks).toHaveLength(1);
    expect(body.sessions[0]?.slug).toBe("ai-and-vsm");
    expect(body.contributions).toBeUndefined();
    expect(body.syntheses).toBeUndefined();
    expect(body.jobs).toBeUndefined();
  });

  test("returns health and session context", async () => {
    const value = fixture(); repository = value.repository;
    expect((await value.app.request("/health")).status).toBe(200);
    const response = await value.app.request("/api/sessions/ai-and-vsm");
    expect(response.status).toBe(200);
    expect((await response.json()).session.title).toBe("AI and VSM");
  });

  test("accepts anonymous text contribution and enqueues analysis", async () => {
    const value = fixture(); repository = value.repository;
    const response = await value.app.request("/api/contributions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "s1", caption: "A participant insight", type: "insight", signal: "curious" }),
    });
    expect(response.status).toBe(201);
    expect(repository.listContributions()).toHaveLength(1);
    expect(repository.listJobs()[0]?.type).toBe("analyze-contribution");
  });

  test("accepts a safe image and rejects an empty contribution", async () => {
    const value = fixture(); repository = value.repository;
    const form = new FormData();
    form.set("sessionId", "s1"); form.set("type", "capture"); form.set("signal", "excited");
    form.set("photo", new File([new Uint8Array([1, 2])], "capture.jpg", { type: "image/jpeg" }));
    expect((await value.app.request("/api/contributions", { method: "POST", body: form })).status).toBe(201);
    const invalid = await value.app.request("/api/contributions", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "s1", type: "capture", signal: "curious" }),
    });
    expect(invalid.status).toBe(422);
  });
});
