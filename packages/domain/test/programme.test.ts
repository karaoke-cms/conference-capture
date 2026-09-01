import { describe, expect, test } from "bun:test";
import type { Conference, Session, Track } from "@conference/contracts";
import { importProgramme, metaphorumProgramme } from "../src";

function recordingRepository() {
  const conferences: Conference[] = []; const tracks: Track[] = []; const sessions: Session[] = [];
  return {
    conferences, tracks, sessions,
    upsertConference(value: Conference) { conferences.push(value); return value; },
    upsertTrack(value: Track) { tracks.push(value); return value; },
    upsertSession(value: Session) { sessions.push(value); return value; },
    removeSessionsWithoutContributions(ids: readonly string[]) { return ids.length; },
    removeTracksWithoutSessions(ids: readonly string[]) { return ids.length; },
  };
}

describe("programme import", () => {
  test("ships the Metaphorum programme with the app, so the import needs no source checkout", () => {
    expect(metaphorumProgramme.conference.id).toBe("metaphorum-2026");
    expect(metaphorumProgramme.tracks.length).toBeGreaterThan(0);
    expect(metaphorumProgramme.sessions.length).toBeGreaterThan(0);
  });

  test("carries scheduled start times, which is the point of re-importing", () => {
    const scheduled = metaphorumProgramme.sessions.filter((session) => session.startsAt);
    expect(scheduled.length).toBeGreaterThan(0);
    expect(scheduled[0]?.startsAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(scheduled[0]?.endsAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("upserts every track and session and reports what it wrote", () => {
    const repository = recordingRepository();
    const result = importProgramme(repository, metaphorumProgramme);

    expect(repository.conferences).toHaveLength(1);
    expect(repository.tracks).toHaveLength(metaphorumProgramme.tracks.length);
    expect(repository.sessions).toHaveLength(metaphorumProgramme.sessions.length);
    expect(result.sessions).toBe(metaphorumProgramme.sessions.length);
    expect(result.scheduled).toBe(metaphorumProgramme.sessions.filter((session) => session.startsAt).length);
  });

  test("passes the scheduled times through to the repository", () => {
    const repository = recordingRepository();
    importProgramme(repository, {
      conference: metaphorumProgramme.conference,
      tracks: [{ id: "t1", conferenceId: "metaphorum-2026", title: "Track", order: 1 }],
      sessions: [{ id: "s1", trackId: "t1", slug: "s1", title: "A talk", description: "", startsAt: "2026-09-17T11:00:00.000Z", endsAt: "2026-09-17T11:45:00.000Z" }],
    });
    expect(repository.sessions[0]?.startsAt).toBe("2026-09-17T11:00:00.000Z");
    expect(repository.sessions[0]?.endsAt).toBe("2026-09-17T11:45:00.000Z");
  });
});
