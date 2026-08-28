export interface ApiConfig {
  organizerToken: string;
  cronSecret: string;
  webOrigin: string;
  maxUploadBytes: number;
}

export function loadApiConfig(env = process.env): ApiConfig {
  return {
    organizerToken: env.ORGANIZER_TOKEN ?? "change-me",
    cronSecret: env.CRON_SECRET ?? "change-me-too",
    webOrigin: env.WEB_ORIGIN ?? "http://localhost:3000",
    maxUploadBytes: Number(env.MAX_UPLOAD_BYTES ?? 10_000_000),
  };
}
