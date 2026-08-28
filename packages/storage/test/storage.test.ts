import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocalStorage, objectKey, type ObjectStorage } from "../src";

let directory: string | undefined;
afterEach(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

describe("object storage", () => {
  test("generates server-controlled, conference-prefixed keys", () => {
    const key = objectKey("image/jpeg", "metaphorum-2026/contributions");
    expect(key).toMatch(/^metaphorum-2026\/contributions\/\d{4}\/\d{2}\/[a-f0-9-]+\.jpg$/);
    expect(() => objectKey("text/html", "../escape")).toThrow();
  });

  test("stores bytes locally and resolves an API media URL", async () => {
    directory = await mkdtemp(join(tmpdir(), "conference-storage-"));
    const storage: ObjectStorage = createLocalStorage({ directory, publicBaseUrl: "http://localhost:8787/media" });
    const saved = await storage.put({ bytes: new Uint8Array([1, 2, 3]), contentType: "image/png" });
    expect(await readFile(join(directory, saved.key))).toEqual(Buffer.from([1, 2, 3]));
    expect(await storage.url(saved.key)).toBe(`http://localhost:8787/media/${saved.key}`);
  });
});
