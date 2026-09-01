import type { AiProvider } from "@conference/ai";
import type { JobType, ScopeType } from "@conference/contracts";
import type { ConferenceRepository } from "@conference/database";
import { contributionIdsForScope, isPlaceholderContribution } from "@conference/domain";

const scopeByJob: Partial<Record<JobType, ScopeType>> = {
  "synthesize-session": "session",
  "synthesize-track": "track",
  "synthesize-conference": "conference",
};

export async function handleJob(repository: ConferenceRepository, ai: AiProvider, type: JobType, scopeId: string): Promise<void> {
  if (type === "analyze-contribution") {
    const contribution = repository.listContributions().find((item) => item.id === scopeId);
    if (!contribution) throw new Error("Contribution not found");
    const analysis = await ai.analyzeContribution({ caption: contribution.caption, signal: contribution.signal, mediaUrl: contribution.mediaUrl });
    repository.updateContributionAnalysis(contribution.id, {
      aiDescription: analysis.description, tags: analysis.tags, inferredSentiment: analysis.sentiment, embedding: analysis.embedding,
    });
    return;
  }
  if (type === "generate-world-cafe") {
    const latest = repository.latestSynthesis("conference", scopeId);
    if (!latest || latest.sourceContributionIds.length === 0) throw new Error("Conference synthesis not found or empty");
    const questions = await ai.generateQuestions(latest);
    repository.saveSynthesis({ ...latest, questions: questions.slice(0, 4) });
    return;
  }
  const scopeType = scopeByJob[type];
  if (!scopeType) throw new Error(`Unsupported job type: ${type}`);
  const hierarchy = repository.listHierarchy();
  const exists = scopeType === "session"
    ? hierarchy.sessions.some((item) => item.id === scopeId)
    : scopeType === "track"
      ? hierarchy.tracks.some((item) => item.id === scopeId)
      : hierarchy.conferences.some((item) => item.id === scopeId);
  if (!exists) throw new Error(`${scopeType} scope not found`);
  const contributions = repository.listContributions();
  const sourceIds = contributionIdsForScope(scopeType, scopeId, { ...hierarchy, contributions });
  const synthesis = await ai.synthesize({
    scopeType,
    scopeId,
    contributions: contributions.filter((item) => sourceIds.includes(item.id)).map((item) => ({
      id: item.id, caption: item.caption, signal: item.signal, tags: item.tags, aiDescription: item.aiDescription,
    })).filter((item) => !isPlaceholderContribution(item)),
  });
  repository.saveSynthesis({ scopeType, scopeId, ...synthesis, questions: [] });
}
