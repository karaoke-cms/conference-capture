import { createAiProvider } from "@conference/ai";
import { createSqliteRepository } from "@conference/database";
import { runWorker } from "./worker";

const databasePath = (process.env.DATABASE_URL ?? "sqlite://.data/conference.db").replace(/^sqlite:\/\//, "");
const repository = createSqliteRepository(databasePath);
const ai = createAiProvider({ provider: process.env.AI_PROVIDER, apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL });
const once = process.argv.includes("--once");

process.on("SIGTERM", () => { repository.close(); process.exit(0); });
process.on("SIGINT", () => { repository.close(); process.exit(0); });

await runWorker(repository, ai, { once });
if (once) repository.close();
