import { describe, expect, test } from "bun:test";
import {
  contributionInputSchema,
  contributionSignals,
  contributionTypes,
  scopeSchema,
  synthesisSchema,
} from "../src/index";

describe("conference contracts", () => {
  test("accepts an anonymous text contribution", () => {
    expect(contributionInputSchema.parse({
      sessionId: "session-1",
      caption: "Control and autonomy remain in tension.",
      type: "insight",
      signal: "challenged",
    })).toEqual({
      sessionId: "session-1",
      caption: "Control and autonomy remain in tension.",
      type: "insight",
      signal: "challenged",
    });
  });

  test("rejects a contribution without media or text", () => {
    expect(() => contributionInputSchema.parse({
      sessionId: "session-1",
      type: "capture",
      signal: "curious",
    })).toThrow();
  });

  test("defines bounded contribution choices", () => {
    expect(contributionTypes).toEqual(["capture", "insight", "question", "algedonic"]);
    expect(contributionSignals).toContain("concerned");
  });

  test("supports all recursive scopes", () => {
    for (const scope of ["session", "track", "conference"] as const) {
      expect(scopeSchema.parse(scope)).toBe(scope);
    }
  });

  test("requires synthesis provenance", () => {
    expect(synthesisSchema.parse({
      id: "syn-1",
      scopeType: "session",
      scopeId: "session-1",
      generatedAt: "2026-08-28T10:00:00.000Z",
      summary: "A grounded summary.",
      themes: ["agency"],
      tensions: ["control ↔ autonomy"],
      weakSignals: [],
      sentiment: { curious: 1 },
      sourceContributionIds: ["contribution-1"],
      questions: [],
    }).sourceContributionIds).toEqual(["contribution-1"]);
  });
});
