import { expect, test } from "bun:test";
import { extractOpenAiOutputText } from "../src/openai";

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
