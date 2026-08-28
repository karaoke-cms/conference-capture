import type { JobType } from "@conference/contracts";

export interface SynthesisTrigger {
  type: JobType;
  scopeId: string;
  at: string;
}

export function dueSynthesisJobs(
  triggers: readonly SynthesisTrigger[],
  now: Date,
  existingKeys: ReadonlySet<string>,
): SynthesisTrigger[] {
  return triggers.filter((trigger) =>
    new Date(trigger.at).getTime() <= now.getTime()
    && !existingKeys.has(`${trigger.type}:${trigger.scopeId}`)
  );
}
