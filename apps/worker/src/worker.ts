import type { AiProvider } from "@conference/ai";
import type { ConferenceRepository } from "@conference/database";
import { handleJob } from "./handlers";

export async function processNextJob(repository: ConferenceRepository, ai: AiProvider): Promise<boolean> {
  const job = repository.claimNextJob();
  if (!job) return false;
  try {
    await handleJob(repository, ai, job.type, job.scopeId);
    repository.completeJob(job.id);
  } catch (error) {
    repository.failJob(job.id, error instanceof Error ? error.message : "Unknown processing failure");
  }
  return true;
}

export async function runWorker(repository: ConferenceRepository, ai: AiProvider, options: { once?: boolean; intervalMs?: number } = {}) {
  do {
    const worked = await processNextJob(repository, ai);
    if (options.once) return worked;
    if (!worked) await Bun.sleep(options.intervalMs ?? 2_000);
  } while (true);
}
