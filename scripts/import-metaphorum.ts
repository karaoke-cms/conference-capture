import type { ConferenceRepository } from "../packages/database/src";
import { createSqliteRepository } from "../packages/database/src";
import { loadMetaphorumProgramme, type MetaphorumProgramme } from "./metaphorum-programme";

const demoSessionIds = ["session-ai-vsm", "session-governance"] as const;
const demoTrackIds = ["track-emerging", "track-practice"] as const;

export function importMetaphorumProgramme(repository: ConferenceRepository, programme: MetaphorumProgramme) {
  repository.upsertConference(programme.conference);
  for (const track of programme.tracks) {
    repository.upsertTrack({ id: track.id, conferenceId: track.conferenceId, title: track.title, order: track.order });
  }
  for (const session of programme.sessions) {
    repository.upsertSession({
      id: session.id, trackId: session.trackId, slug: session.slug, title: session.title,
      description: session.description, startsAt: session.startsAt, endsAt: session.endsAt,
    });
  }
  const removedDemoSessions = repository.removeSessionsWithoutContributions(demoSessionIds);
  repository.removeTracksWithoutSessions(demoTrackIds);
  return { tracks: programme.tracks.length, sessions: programme.sessions.length, removedDemoSessions };
}

if (import.meta.main) {
  const sourceFlag = process.argv.indexOf("--source");
  const source = sourceFlag >= 0 && process.argv[sourceFlag + 1]
    ? process.argv[sourceFlag + 1]!
    : "/Users/mathis/dev/metaphorum/metaphorum";
  const databasePath = (process.env.DATABASE_URL ?? "sqlite://.data/conference.db").replace(/^sqlite:\/\//, "");
  const repository = createSqliteRepository(databasePath);
  try {
    const result = importMetaphorumProgramme(repository, loadMetaphorumProgramme(source));
    console.log(`Imported ${result.tracks} tracks and ${result.sessions} sessions from ${source}.`);
    if (result.removedDemoSessions) console.log(`Removed ${result.removedDemoSessions} unreferenced demo sessions.`);
  } finally {
    repository.close();
  }
}
