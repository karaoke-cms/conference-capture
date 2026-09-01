import { expect, test } from "bun:test";
import { createOpenAiProvider, extractOpenAiOutputText, tallySentiment, toStringArray } from "../src/openai";

test("reads Responses API message text when output_text is absent", () => {
  const text = extractOpenAiOutputText({
    output: [
      { type: "reasoning", content: [] },
      { type: "message", content: [{ type: "output_text", text: "{\"summary\":\"Grounded in one note.\",\"sourceContributionIds\":[\"c1\"]}" }] },
    ],
  });
  expect(JSON.parse(text).sourceContributionIds).toEqual(["c1"]);
});

test("prefers explicit output_text when present", () => {
  expect(extractOpenAiOutputText({ output_text: "{\"ok\":true}" })).toBe("{\"ok\":true}");
});

test("fails closed when the payload has no text", () => {
  expect(() => extractOpenAiOutputText({ output: [{ type: "reasoning", content: [] }] })).toThrow("no structured output");
});

test("tallies sentiment as a flat label-to-count map, regardless of what the model might return", () => {
  const sentiment = tallySentiment([
    { id: "c1", signal: "curious", tags: [] },
    { id: "c2", signal: "curious", tags: [] },
    { id: "c3", signal: "excited", tags: [] },
  ]);
  expect(sentiment).toEqual({ curious: 2, excited: 1 });
});

test("passes plain strings through untouched", () => {
  expect(toStringArray(["Community trust", "Slow onboarding"])).toEqual(["Community trust", "Slow onboarding"]);
});

test("coerces object items into a plain string so the UI never renders raw JSON", () => {
  expect(toStringArray([{ theme: "Community trust", description: "Recurs across sessions" }])).toEqual(["Community trust"]);
  expect(toStringArray([{ title: "Slow onboarding" }])).toEqual(["Slow onboarding"]);
  expect(toStringArray([{ foo: "A", bar: "B" }])).toEqual(["A — B"]);
});

test("drops non-array and empty values", () => {
  expect(toStringArray(undefined)).toEqual([]);
  expect(toStringArray([{}, null, 42])).toEqual([]);
});

test("falls back to the mock provider when the model returns no themes, tensions, or weakSignals for real contributions", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    output_text: JSON.stringify({ summary: "Nothing notable.", themes: [], tensions: [], weakSignals: [], sourceContributionIds: ["c1"] }),
  }), { status: 200 })) as unknown as typeof fetch;
  try {
    const provider = createOpenAiProvider({ apiKey: "test-key" });
    const result = await provider.synthesize({
      scopeType: "session", scopeId: "s1",
      contributions: [{ id: "c1", caption: "Felt like a solution looking for a problem.", signal: "curious", tags: ["solution", "problem"] }],
    });
    expect(result.themes).toEqual(["problem", "solution"]);
    expect(result.sourceContributionIds).toEqual(["c1"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps the model's synthesis when it names provenance exactSourceContributionIds", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({
      summary: "Curious skepticism about problem fit.",
      themes: ["problem-solution misalignment"], tensions: ["solution vs real user need"], weakSignals: ["unclear value proposition"],
      exactSourceContributionIds: ["c1"],
    }) }] }],
  }), { status: 200 })) as unknown as typeof fetch;
  try {
    const provider = createOpenAiProvider({ apiKey: "test-key" });
    const result = await provider.synthesize({
      scopeType: "session", scopeId: "s1",
      contributions: [{ id: "c1", caption: "Felt like a solution looking for a problem.", signal: "curious", tags: [] }],
    });
    expect(result.themes).toEqual(["problem-solution misalignment"]);
    expect(result.sourceContributionIds).toEqual(["c1"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
