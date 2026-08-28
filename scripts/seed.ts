import type { ConferenceRepository } from "../packages/database/src";
import { createSqliteRepository } from "../packages/database/src";

export function seedMetaphorum(repository: ConferenceRepository): void {
  if (repository.listHierarchy().conferences.some((item) => item.id === "metaphorum-2026")) return;
  repository.createConference({
    id: "metaphorum-2026", slug: "metaphorum-2026", title: "Metaphorum 2026",
    description: "A living conversation in cybernetics and systems practice.",
    startsAt: "2026-09-17T08:00:00.000Z", endsAt: "2026-09-19T17:00:00.000Z",
  });
  repository.createTrack({ id: "track-emerging", conferenceId: "metaphorum-2026", title: "Emerging methods & tools", order: 1 });
  repository.createTrack({ id: "track-practice", conferenceId: "metaphorum-2026", title: "Cybernetics in practice", order: 2 });
  repository.createSession({
    id: "session-ai-vsm", trackId: "track-emerging", slug: "ai-and-vsm", title: "AI, agency & the viable system",
    description: "How does AI alter operational autonomy, accountability, and the meaning of participation?",
    startsAt: "2026-09-17T10:00:00.000Z", endsAt: "2026-09-17T11:00:00.000Z",
  });
  repository.createSession({
    id: "session-governance", trackId: "track-practice", slug: "governance-in-action", title: "Governance in action",
    description: "What practices help communities sense, decide, and adapt without losing their plurality?",
    startsAt: "2026-09-17T13:00:00.000Z", endsAt: "2026-09-17T14:00:00.000Z",
  });
}

if (import.meta.main) {
  const path = (process.env.DATABASE_URL ?? "sqlite://.data/conference.db").replace(/^sqlite:\/\//, "");
  const repository = createSqliteRepository(path);
  seedMetaphorum(repository);
  repository.close();
  console.log("Metaphorum 2026 sample conference is ready.");
}
