import { describe, expect, test } from "bun:test";
import { createMockAiProvider } from "../src";

const provider = createMockAiProvider();

describe("deterministic AI fallback", () => {
  test("analyzes contribution text without credentials", async () => {
    const result = await provider.analyzeContribution({ caption: "AI autonomy creates concern about accountability.", signal: "concerned" });
    expect(result.tags).toContain("autonomy");
    expect(result.sentiment).toBe("concerned");
    expect(result.embedding).toHaveLength(8);
  });

  test("creates grounded synthesis and no fabricated findings for empty input", async () => {
    const empty = await provider.synthesize({ scopeType: "session", scopeId: "s0", contributions: [] });
    expect(empty.summary).toContain("Not enough");
    expect(empty.sourceContributionIds).toEqual([]);

    const result = await provider.synthesize({
      scopeType: "session", scopeId: "s1",
      contributions: [{ id: "c1", caption: "Control and autonomy are in tension.", signal: "challenged", tags: ["control", "autonomy"] }],
    });
    expect(result.sourceContributionIds).toEqual(["c1"]);
    expect(result.themes).toContain("autonomy");
  });

  test("generates exactly four perspectives when material exists", async () => {
    const result = await provider.generateQuestions({
      summary: "Agency and accountability remain unresolved.", themes: ["agency"], tensions: ["agency ↔ accountability"],
      sourceContributionIds: ["c1"],
    });
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
  });
});
