import type {
  Conference, Contribution, ContributionInput, JobType, ProcessingJob, ScopeType, Session, Synthesis, Track,
} from "@conference/contracts";

export interface SessionContext { conference: Conference; track: Track; session: Session }
export interface SynthesisInput extends Omit<Synthesis, "id" | "generatedAt"> {}

export interface ConferenceRepository {
  createConference(value: Conference): Conference;
  createTrack(value: Track): Track;
  createSession(value: Session): Session;
  upsertConference(value: Conference): Conference;
  upsertTrack(value: Track): Track;
  upsertSession(value: Session): Session;
  removeSessionsWithoutContributions(ids: readonly string[]): number;
  removeTracksWithoutSessions(ids: readonly string[]): number;
  getSessionContext(slug: string): SessionContext | undefined;
  listHierarchy(): { conferences: Conference[]; tracks: Track[]; sessions: Session[] };
  createContribution(value: ContributionInput & { mediaUrl?: string; mediaKey?: string }): Contribution;
  listContributions(filter?: { sessionId?: string }): Contribution[];
  updateContributionAnalysis(id: string, analysis: { aiDescription: string; tags: string[]; inferredSentiment: string; embedding: number[] }): void;
  enqueueJob(value: { type: JobType; scopeId: string; scheduledAt?: string }): ProcessingJob;
  claimNextJob(): ProcessingJob | undefined;
  completeJob(id: string): void;
  failJob(id: string, error: string): void;
  listJobs(): ProcessingJob[];
  saveSynthesis(value: SynthesisInput): Synthesis;
  latestSynthesis(scopeType: ScopeType, scopeId: string): Synthesis | undefined;
  listSyntheses(): Synthesis[];
  close(): void;
}
