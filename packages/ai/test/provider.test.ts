import { expect, test } from "bun:test";
import { createAiProvider } from "../src";

test("selects safe mock provider when credentials are absent", () => {
  expect(createAiProvider({ provider: "openai" }).name).toBe("mock");
  expect(createAiProvider({ provider: "mock" }).name).toBe("mock");
});
