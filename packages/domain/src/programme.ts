import type { Conference, Session, Track } from "@conference/contracts";
import snapshot from "./metaphorum-programme.json";

export interface Programme {
  conference: Conference;
  tracks: Track[];
  sessions: Session[];
}

// Only the repository methods the import needs, so this stays free of a database dependency.
export interface ProgrammeRepository {
  upsertConference(value: Conference): Conference;
  upsertTrack(value: Track): Track;
  upsertSession(value: Session): Session;
  removeSessionsWithoutContributions(ids: readonly string[]): number;
  removeTracksWithoutSessions(ids: readonly string[]): number;
}

export interface ProgrammeImportResult { tracks: number; sessions: number; scheduled: number; removedDemoSessions: number }

// Shipped with the app so the import works where the Metaphorum source checkout isn't available.
export const metaphorumProgramme = snapshot as Programme;

const demoSessionIds = ["session-ai-vsm", "session-governance"] as const;
const demoTrackIds = ["track-emerging", "track-practice"] as const;

export function importProgramme(repository: ProgrammeRepository, programme: Programme): ProgrammeImportResult {
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
  return {
    tracks: programme.tracks.length,
    sessions: programme.sessions.length,
    scheduled: programme.sessions.filter((session) => session.startsAt).length,
    removedDemoSessions,
  };
}
