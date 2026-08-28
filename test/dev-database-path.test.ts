import { expect, test } from "bun:test";
import packageJson from "../package.json";

test("development services start from the repository root", () => {
  expect(packageJson.scripts.dev).toBe("bun scripts/dev.ts");
  expect(packageJson.scripts.stop).toBe("bun scripts/stop-dev.ts");
  expect(packageJson.scripts["dev:api"]).toBe("bun --watch apps/api/src/index.ts");
  expect(packageJson.scripts["dev:worker"]).toBe("bun --watch apps/worker/src/index.ts");
  expect(packageJson.scripts["worker:once"]).toBe("bun apps/worker/src/index.ts --once");
});
