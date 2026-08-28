import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ObjectStorage } from "./types";
import { objectKey, safeKey } from "./types";

export function createLocalStorage(config: { directory: string; publicBaseUrl: string; prefix?: string }): ObjectStorage {
  return {
    async put(input) {
      const key = objectKey(input.contentType, config.prefix);
      const path = join(config.directory, safeKey(key));
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, input.bytes);
      return { key };
    },
    async url(key) {
      return `${config.publicBaseUrl.replace(/\/$/, "")}/${safeKey(key)}`;
    },
    async get(key) {
      try {
        return { bytes: new Uint8Array(await readFile(join(config.directory, safeKey(key)))) };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
      }
    },
  };
}
