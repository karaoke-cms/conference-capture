import type { ConferenceRepository } from "../packages/database/src";
import { createSqliteRepository } from "../packages/database/src";
import { importProgramme } from "../packages/domain/src";
import { loadMetaphorumProgramme, type MetaphorumProgramme } from "./metaphorum-programme";

export function importMetaphorumProgramme(repository: ConferenceRepository, programme: MetaphorumProgramme) {
  return importProgramme(repository, programme);
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
