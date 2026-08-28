import { createSqliteRepository, type ConferenceRepository } from "@conference/database";
import { createLocalStorage, createS3Storage, type ObjectStorage } from "@conference/storage";
import type { ApiConfig } from "./config";

export interface ApiDependencies { repository: ConferenceRepository; storage: ObjectStorage; config: ApiConfig }

export function loadDependencies(config: ApiConfig, env = process.env): ApiDependencies {
  const databasePath = (env.DATABASE_URL ?? "sqlite://.data/conference.db").replace(/^sqlite:\/\//, "");
  const repository = createSqliteRepository(databasePath);
  const storage = env.STORAGE_DRIVER === "s3"
    ? createS3Storage({
        bucket: required(env.S3_BUCKET, "S3_BUCKET"),
        region: env.S3_REGION ?? "eu-central-1",
        endpoint: env.S3_ENDPOINT,
        forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
        prefix: env.S3_PREFIX ?? "metaphorum-2026/contributions",
      })
    : createLocalStorage({
        directory: env.STORAGE_LOCAL_DIR ?? ".data/uploads",
        publicBaseUrl: env.PUBLIC_MEDIA_BASE_URL ?? "http://localhost:8787/media",
        prefix: env.S3_PREFIX ?? "metaphorum-2026/contributions",
      });
  return { repository, storage, config };
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required for S3 storage`);
  return value;
}
