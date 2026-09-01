import { describe, expect, test } from "bun:test";
import { contributionIdsForScope, isPlaceholderContribution, normalizeSourceIds } from "../src";

const hierarchy = {
  tracks: [{ id: "t1", conferenceId: "c1" }, { id: "t2", conferenceId: "c1" }],
  sessions: [{ id: "s1", trackId: "t1" }, { id: "s2", trackId: "t2" }],
  contributions: [{ id: "a", sessionId: "s1" }, { id: "b", sessionId: "s2" }],
};

describe("synthesis scope", () => {
  test("resolves recursive source contributions", () => {
    expect(contributionIdsForScope("session", "s1", hierarchy)).toEqual(["a"]);
    expect(contributionIdsForScope("track", "t1", hierarchy)).toEqual(["a"]);
    expect(contributionIdsForScope("conference", "c1", hierarchy)).toEqual(["a", "b"]);
  });

  test("deduplicates and sorts provenance", () => {
    expect(normalizeSourceIds(["b", "a", "b"])).toEqual(["a", "b"]);
  });

  test("flags contributions whose caption or tags are just placeholder text", () => {
    expect(isPlaceholderContribution({ caption: "noop", tags: [] })).toBe(true);
    expect(isPlaceholderContribution({ caption: " ASDF ", tags: [] })).toBe(true);
    expect(isPlaceholderContribution({ caption: undefined, tags: ["noop"] })).toBe(true);
    expect(isPlaceholderContribution({ caption: "Felt like a solution looking for a problem.", tags: [] })).toBe(false);
    expect(isPlaceholderContribution({ caption: undefined, tags: [] })).toBe(false);
  });
});
