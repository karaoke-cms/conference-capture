import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { submissionMessage } from "../app/utils/contribution-form";

test("provides accessible success and error status text", () => {
  expect(submissionMessage("success")).toContain("added");
  expect(submissionMessage("error")).toContain("not");
  expect(submissionMessage("idle")).toBe("");
});

test("routes participants through the session directory to contribution pages", async () => {
  const home = await readFile(new URL("../app/pages/index.vue", import.meta.url), "utf8");
  const directory = await readFile(new URL("../app/pages/sessions/index.vue", import.meta.url), "utf8");

  expect(home).toContain('to="/sessions"');
  expect(directory).toContain("Contribute");
  expect(directory).toContain(":to=\"session.contributeUrl\"");
});

test("provides a working home link from an individual session", async () => {
  const header = await readFile(new URL("../app/components/SessionHeader.vue", import.meta.url), "utf8");

  expect(header).toContain('<NuxtLink to="/"');
  expect(header).toContain('aria-label="Metaphorum home"');
});
