import { describe, expect, test } from "bun:test";
import type { Session, Track } from "@conference/contracts";
import { buildSessionDirectory } from "../app/utils/session-directory";

const tracks: Track[] = [
  { id: "t2", conferenceId: "c1", title: "Second track", order: 2 },
  { id: "t1", conferenceId: "c1", title: "First track", order: 1 },
];
const sessions: Session[] = [
  { id: "s2", trackId: "t2", slug: "future-practice", title: "Future Practice", description: "Speaker: Maya" },
  { id: "s1", trackId: "t1", slug: "living-systems", title: "Living Systems", description: "Organisational cybernetics" },
];

describe("session directory", () => {
  test("groups sessions in track order with contribution URLs", () => {
    const groups = buildSessionDirectory(tracks, sessions, "");

    expect(groups.map((group) => group.track.id)).toEqual(["t1", "t2"]);
    expect(groups[0]?.sessions[0]?.contributeUrl).toBe("/session/living-systems");
  });

  test("searches titles and descriptions case-insensitively and removes empty groups", () => {
    expect(buildSessionDirectory(tracks, sessions, "MAYA").map((group) => group.track.id)).toEqual(["t2"]);
    expect(buildSessionDirectory(tracks, sessions, "cybernetics")[0]?.sessions[0]?.id).toBe("s1");
    expect(buildSessionDirectory(tracks, sessions, "missing")).toEqual([]);
  });
});
