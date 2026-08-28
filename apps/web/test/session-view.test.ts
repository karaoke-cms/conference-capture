import { expect, test } from "bun:test";
import { submissionMessage } from "../app/utils/contribution-form";

test("provides accessible success and error status text", () => {
  expect(submissionMessage("success")).toContain("added");
  expect(submissionMessage("error")).toContain("not");
  expect(submissionMessage("idle")).toBe("");
});
