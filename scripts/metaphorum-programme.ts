import { readFileSync } from "node:fs";
import { join } from "node:path";

interface SourceConfig { conference: { name: string; description: string; dates: string; fullName?: string; location?: string } }
interface SourceTrack { id: string; name: string; description: string }
interface SourceTalk { id: string; title: string; abstract: string; speaker_id: string; track_id: string; duration_minutes: number }
interface SourceSpeaker { id: string; full_name: string; affiliation: string }
interface SourceSchedule { id: string; talk_id: string; day: string; start_time: string; end_time: string; room: string }

export interface MetaphorumSource {
  config: SourceConfig;
  tracks: SourceTrack[];
  talks: SourceTalk[];
  speakers: SourceSpeaker[];
  schedule: SourceSchedule[];
}

export interface ProgrammeSession {
  id: string;
  sourceId: string;
  trackId: string;
  slug: string;
  title: string;
  description: string;
  startsAt?: string;
  endsAt?: string;
}

export interface MetaphorumProgramme {
  conference: { id: string; slug: string; title: string; description: string; startsAt: string; endsAt: string };
  tracks: { id: string; sourceId: string; conferenceId: string; title: string; order: number }[];
  sessions: ProgrammeSession[];
}

export function stableSessionSlug(title: string, sourceId: string): string {
  const base = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72).replace(/-$/g, "");
  return `${base || "session"}-${sourceId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function loadMetaphorumProgramme(repositoryPath: string): MetaphorumProgramme {
  const data = join(repositoryPath, "src", "data");
  const read = <T>(file: string) => JSON.parse(readFileSync(join(data, file), "utf8")) as T;
  return normalizeMetaphorumProgramme({
    config: read<SourceConfig>("config.json"),
    tracks: read<SourceTrack[]>("tracks.json"),
    talks: read<SourceTalk[]>("talks.json"),
    speakers: read<SourceSpeaker[]>("speakers.json"),
    schedule: read<SourceSchedule[]>("schedule.json"),
  });
}

export function normalizeMetaphorumProgramme(source: MetaphorumSource): MetaphorumProgramme {
  const conferenceId = "metaphorum-2026";
  const speakers = new Map(source.speakers.map((speaker) => [speaker.id, speaker]));
  const schedule = new Map(source.schedule.map((slot) => [slot.talk_id, slot]));
  const trackIds = new Set(source.tracks.map((track) => track.id));
  return {
    conference: {
      id: conferenceId,
      slug: conferenceId,
      title: source.config.conference.name,
      description: source.config.conference.description,
      startsAt: "2026-09-17T08:00:00.000Z",
      endsAt: "2026-09-19T16:00:00.000Z",
    },
    tracks: source.tracks.map((track, index) => ({
      id: `metaphorum:${track.id}`, sourceId: track.id, conferenceId, title: track.name, order: index + 1,
    })),
    sessions: source.talks.filter((talk) => trackIds.has(talk.track_id)).map((talk) => {
      const speaker = speakers.get(talk.speaker_id);
      const slot = schedule.get(talk.id);
      const speakerLine = speaker ? `Speaker: ${speaker.full_name}${speaker.affiliation ? ` — ${speaker.affiliation}` : ""}` : "";
      return {
        id: `metaphorum:${talk.id}`,
        sourceId: talk.id,
        trackId: `metaphorum:${talk.track_id}`,
        slug: stableSessionSlug(talk.title, talk.id),
        title: talk.title,
        description: [talk.abstract, speakerLine, slot?.room ? `Room: ${slot.room}` : ""].filter(Boolean).join("\n\n"),
        startsAt: slot ? scheduledTime(slot.day, slot.start_time) : undefined,
        endsAt: slot ? scheduledTime(slot.day, slot.end_time) : undefined,
      };
    }),
  };
}

function scheduledTime(day: string, time: string): string {
  return new Date(`${day}T${time}:00Z`).toISOString();
}
