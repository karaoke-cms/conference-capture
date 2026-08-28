# Metaphorum Programme Import Design

## Goal

Import the programme maintained in `/Users/mathis/dev/metaphorum/metaphorum/src/data` into conference-capture without inventing schedule information.

## Source mapping

- `config.json` supplies conference title, description, and known conference dates.
- `tracks.json` maps one-to-one to capture tracks and preserves each source track ID.
- `talks.json` maps one-to-one to capture sessions and preserves each source talk ID, title, abstract, track relationship, and duration.
- `speakers.json` enriches each session description with the linked speaker name and affiliation.
- `schedule.json` supplies timestamps only where a schedule row references a real talk. Its current four day-level rows reference no talk records, so all 74 talks import as explicitly unscheduled.

## Persistence

Session start/end timestamps become optional in the domain contract. SQLite continues to store empty strings for unscheduled values so existing databases do not require a destructive table rebuild; the repository maps empty strings to `undefined` at its boundary. Upsert methods make the import idempotent and allow future source edits to update tracks and sessions.

Imported IDs are namespaced as `metaphorum:<source-id>` to avoid collisions. Session slugs are generated from titles with a source-ID suffix for uniqueness and stable QR URLs.

## Import behavior

`bun run import:metaphorum` accepts `--source <repository-path>`, defaulting to `/Users/mathis/dev/metaphorum/metaphorum`. It seeds the conference if necessary, upserts all source tracks and talks, and reports counts. Demo programme records are removed only when they have no contribution records; source contributions are never deleted.

The importer reads source files at execution time rather than copying them, making the Metaphorum repository the programme system of record.

## UI behavior

Participant and organizer pages show “Schedule to be confirmed” for unscheduled sessions. The organizer dashboard continues to generate QR links and synthesis actions for every imported talk.

## Verification

Tests cover source parsing, speaker/track joins, stable slugs, missing schedule data, idempotent upserts, preservation of contributed sessions, and the real source dataset count of six tracks and 74 talks.
