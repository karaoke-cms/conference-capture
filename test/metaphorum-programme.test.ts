import { describe, expect, test } from "bun:test";
import { loadMetaphorumProgramme, normalizeMetaphorumProgramme, stableSessionSlug } from "../scripts/metaphorum-programme";

const source = "/Users/mathis/dev/metaphorum/metaphorum";

describe("Metaphorum programme normalization", () => {
  test("loads all source tracks and talks, scheduling only what the source schedules", () => {
    const programme = loadMetaphorumProgramme(source);
    expect(programme.tracks).toHaveLength(6);
    expect(programme.sessions.length).toBeGreaterThan(0);
    // A time is only ever carried over from a schedule row, never invented.
    const scheduled = programme.sessions.filter((session) => session.startsAt);
    expect(scheduled.length).toBeGreaterThan(0);
    expect(scheduled.every((session) => Boolean(session.endsAt))).toBe(true);
    expect(programme.sessions.every((session) => session.startsAt !== null)).toBe(true);
  });

  test("preserves source relationships and enriches descriptions with speakers", () => {
    const programme = loadMetaphorumProgramme(source);
    const session = programme.sessions.find((item) => item.id === "metaphorum:talk1");
    expect(session?.trackId).toBe("metaphorum:t5");
    expect(session?.description).toContain("OpenSoma");
    expect(session?.description).toContain("Speaker:");
  });

  test("generates stable unique URL slugs", () => {
    expect(stableSessionSlug("AI, Agency & the VSM", "talk42")).toBe("ai-agency-the-vsm-talk42");
    const programme = loadMetaphorumProgramme(source);
    expect(new Set(programme.sessions.map((session) => session.slug)).size).toBe(programme.sessions.length);
  });

  test("uses matching schedule rows when supplied", () => {
    const programme = normalizeMetaphorumProgramme({
      config: { conference: { name: "M", description: "", dates: "September 17-19, 2026" } },
      tracks: [{ id: "t1", name: "Track", description: "" }],
      talks: [{ id: "talk1", title: "Talk", abstract: "Abstract", speaker_id: "s1", track_id: "t1", duration_minutes: 20 }],
      speakers: [{ id: "s1", full_name: "Speaker", affiliation: "Place" }],
      schedule: [{ id: "sch1", talk_id: "talk1", day: "2026-09-18", start_time: "10:00", end_time: "10:20", room: "Room A" }],
    });
    expect(programme.sessions[0]?.startsAt).toBe("2026-09-18T10:00:00.000Z");
    expect(programme.sessions[0]?.endsAt).toBe("2026-09-18T10:20:00.000Z");
  });
});
