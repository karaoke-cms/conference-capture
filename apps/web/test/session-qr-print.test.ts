import { describe, expect, test } from "bun:test";
import type { Session, Track } from "@conference/contracts";
import { buildQrPrintPages, sessionSpeaker, sortQrSessions } from "../app/utils/session-qr-print";

const tracks: Track[] = [
  { id: "t2", conferenceId: "c1", title: "Beta Track", order: 2 },
  { id: "t1", conferenceId: "c1", title: "Alpha Track", order: 1 },
];
const sessions: Session[] = [
  { id: "s3", trackId: "t1", slug: "zebra", title: "Zebra", description: "Body\n\nSpeaker: Zoe", startsAt: "2026-09-18T09:00:00Z", endsAt: "2026-09-18T10:00:00Z" },
  { id: "s2", trackId: "t2", slug: "alpha", title: "Alpha", description: "Speaker: Ada" },
  { id: "s1", trackId: "t1", slug: "middle", title: "Middle", description: "Body\n\nSpeaker: Max", startsAt: "2026-09-17T09:00:00Z", endsAt: "2026-09-17T10:00:00Z" },
];

describe("session QR print model", () => {
  test("extracts speakers and provides public URLs", () => {
    expect(sessionSpeaker(sessions[0]!.description)).toBe("Zoe");
    expect(sortQrSessions(sessions, tracks, "alphabetical", "https://example.test")[0]?.url).toBe("https://example.test/session/alpha");
  });

  test("sorts alphabetically, by time with unscheduled last, and by track", () => {
    expect(sortQrSessions(sessions, tracks, "alphabetical", "https://x").map((row) => row.id)).toEqual(["s2", "s1", "s3"]);
    expect(sortQrSessions(sessions, tracks, "time", "https://x").map((row) => row.id)).toEqual(["s1", "s3", "s2"]);
    expect(sortQrSessions(sessions, tracks, "track", "https://x").map((row) => row.id)).toEqual(["s1", "s3", "s2"]);
  });

  test("plans session pages without dividers for alphabetical or one track", () => {
    const rows = sortQrSessions(sessions, tracks, "alphabetical", "https://x");
    expect(buildQrPrintPages(rows, "alphabetical").map((page) => page.type)).toEqual(["session", "session", "session"]);
    expect(buildQrPrintPages(rows.filter((row) => row.track.id === "t1"), "track").map((page) => page.type)).toEqual(["session", "session"]);
  });

  test("adds one divider per included track when track sorted across tracks", () => {
    const rows = sortQrSessions(sessions, tracks, "track", "https://x");
    expect(buildQrPrintPages(rows, "track").map((page) => page.type === "track" ? `track:${page.track.title}` : `session:${page.session.id}`)).toEqual([
      "track:Alpha Track", "session:s1", "session:s3", "track:Beta Track", "session:s2",
    ]);
  });
});
