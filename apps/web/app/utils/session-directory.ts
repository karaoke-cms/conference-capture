import type { Session, Track } from "@conference/contracts";

export interface DirectorySession extends Session {
  contributeUrl: string;
}

export interface SessionDirectoryGroup {
  track: Track;
  sessions: DirectorySession[];
}

export function buildSessionDirectory(tracks: Track[], sessions: Session[], query: string): SessionDirectoryGroup[] {
  const search = query.trim().toLocaleLowerCase();
  return [...tracks]
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
    .map((track) => ({
      track,
      sessions: sessions
        .filter((session) => session.trackId === track.id && matches(session, search))
        .sort((left, right) => left.title.localeCompare(right.title))
        .map((session) => ({ ...session, contributeUrl: `/session/${session.slug}` })),
    }))
    .filter((group) => group.sessions.length > 0);
}

function matches(session: Session, search: string): boolean {
  if (!search) return true;
  return `${session.title}\n${session.description}`.toLocaleLowerCase().includes(search);
}
