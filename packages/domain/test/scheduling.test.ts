import { expect, test } from "bun:test";
import { dueSynthesisJobs } from "../src";

test("returns only due, unscheduled triggers", () => {
  const result = dueSynthesisJobs([
    { type: "synthesize-session", scopeId: "s1", at: "2026-08-28T10:00:00Z" },
    { type: "synthesize-track", scopeId: "t1", at: "2026-08-28T12:00:00Z" },
  ], new Date("2026-08-28T11:00:00Z"), new Set(["synthesize-session:s1"]));
  expect(result).toEqual([]);
});
