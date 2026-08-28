export interface StoredObject { key: string }
export interface PutObjectInput { bytes: Uint8Array; contentType: string }
export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StoredObject>;
  url(key: string): Promise<string>;
  get?(key: string): Promise<{ bytes: Uint8Array; contentType?: string } | undefined>;
}

export const allowedMediaTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/heic", "heic"],
]);

export function safeKey(key: string): string {
  if (!key || key.startsWith("/") || key.includes("..") || key.includes("\\")) throw new Error("Unsafe object key");
  return key;
}

export function objectKey(contentType: string, prefix = "metaphorum-2026/contributions"): string {
  const extension = allowedMediaTypes.get(contentType);
  safeKey(prefix);
  if (!extension) throw new Error("Unsupported media type");
  const date = new Date();
  return `${prefix.replace(/\/$/, "")}/${date.getUTCFullYear()}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${extension}`;
}
