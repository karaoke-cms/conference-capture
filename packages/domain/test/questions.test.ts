import { expect, test } from "bun:test";
import { selectWorldCafeQuestions } from "../src";

test("selects three or four distinct question perspectives", () => {
  const result = selectWorldCafeQuestions([
    { text: "What are we beginning to agree about?", kind: "convergence", score: 0.8 },
    { text: "Which tension most needs attention?", kind: "tension", score: 1 },
    { text: "What remains absent?", kind: "blind-spot", score: 0.9 },
    { text: "What will we do differently?", kind: "action", score: 0.95 },
    { text: "Another action?", kind: "action", score: 0.99 },
  ]);
  expect(result).toHaveLength(4);
  expect(result).toContain("Which tension most needs attention?");
  expect(result).not.toContain("Another action?");
});
