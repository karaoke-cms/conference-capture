import type { Session, Track } from "@conference/contracts";

export type QrSort = "alphabetical" | "time" | "track";
export interface QrSession extends Session { speaker: string; track: Track; url: string }
export type QrPrintPage = { type: "track"; track: Track } | { type: "session"; session: QrSession };

export function sessionSpeaker(description: string): string {
  return description.match(/(?:^|\n)Speaker:\s*(.+)$/m)?.[1]?.trim() || "Speaker to be confirmed";
}

export function sortQrSessions(sessions: Session[], tracks: Track[], sort: QrSort, origin: string): QrSession[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const rows = sessions.flatMap((session) => {
    const track = trackById.get(session.trackId);
    return track ? [{ ...session, track, speaker: sessionSpeaker(session.description), url: `${origin.replace(/\/$/, "")}/session/${session.slug}` }] : [];
  });
  return rows.sort((left, right) => {
    if (sort === "time") return timeValue(left) - timeValue(right) || left.title.localeCompare(right.title);
    if (sort === "track") return left.track.order - right.track.order || left.title.localeCompare(right.title);
    return left.title.localeCompare(right.title);
  });
}

export function buildQrPrintPages(sessions: QrSession[], sort: QrSort): QrPrintPage[] {
  if (sort !== "track" || new Set(sessions.map((session) => session.track.id)).size < 2) {
    return sessions.map((session) => ({ type: "session", session }));
  }
  const pages: QrPrintPage[] = [];
  let previousTrack = "";
  for (const session of sessions) {
    if (session.track.id !== previousTrack) {
      pages.push({ type: "track", track: session.track });
      previousTrack = session.track.id;
    }
    pages.push({ type: "session", session });
  }
  return pages;
}

function timeValue(session: Session): number {
  return session.startsAt ? new Date(session.startsAt).getTime() : Number.POSITIVE_INFINITY;
}
