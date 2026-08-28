import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectStorage } from "./types";
import { objectKey, safeKey } from "./types";

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  prefix?: string;
  signedUrlExpiresSeconds?: number;
}

export function createS3Storage(config: S3StorageConfig, client = new S3Client({
  region: config.region,
  endpoint: config.endpoint,
  forcePathStyle: config.forcePathStyle ?? false,
})): ObjectStorage {
  return {
    async put(input) {
      const key = objectKey(input.contentType, config.prefix);
      await client.send(new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: input.bytes,
        ContentType: input.contentType,
        ServerSideEncryption: "AES256",
      }));
      return { key };
    },
    async url(key) {
      return getSignedUrl(client, new GetObjectCommand({ Bucket: config.bucket, Key: safeKey(key) }), {
        expiresIn: config.signedUrlExpiresSeconds ?? 1_800,
      });
    },
  };
}
