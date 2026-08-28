import { createSqliteRepository } from "@conference/database";
import { createApp } from "../src/app";

export function fixture() {
  const repository = createSqliteRepository(":memory:");
  repository.createConference({ id: "c1", slug: "metaphorum", title: "Metaphorum 2026", description: "Living conversation", startsAt: "2026-09-17T08:00:00Z", endsAt: "2026-09-19T17:00:00Z" });
  repository.createTrack({ id: "t1", conferenceId: "c1", title: "Recursive practice", order: 1 });
  repository.createSession({ id: "s1", trackId: "t1", slug: "ai-and-vsm", title: "AI and VSM", description: "Agency and autonomy", startsAt: "2026-09-17T10:00:00Z", endsAt: "2026-09-17T11:00:00Z" });
  const storage = {
    async put() { return { key: "metaphorum-2026/contributions/test.jpg" }; },
    async url(key: string) { return `https://signed.example/${key}`; },
  };
  const app = createApp({ repository, storage, config: { organizerToken: "organizer", cronSecret: "cron", webOrigin: "http://localhost:3000", maxUploadBytes: 5_000_000 } });
  return { app, repository };
}
