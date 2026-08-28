import { z } from "zod";

export const contributionTypes = ["capture", "insight", "question", "algedonic"] as const;
export const contributionSignals = ["curious", "excited", "challenged", "concerned", "confused"] as const;
export const scopeTypes = ["session", "track", "conference"] as const;

export const contributionTypeSchema = z.enum(contributionTypes);
export const contributionSignalSchema = z.enum(contributionSignals);
export const scopeSchema = z.enum(scopeTypes);

export const contributionInputSchema = z.object({
  sessionId: z.string().min(1),
  caption: z.string().trim().max(2_000).optional(),
  type: contributionTypeSchema,
  signal: contributionSignalSchema,
  hasMedia: z.boolean().optional(),
}).refine((value) => Boolean(value.caption || value.hasMedia), {
  message: "Add a photo or a written observation.",
});

export const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional() }),
});

export const synthesisSchema = z.object({
  id: z.string(),
  scopeType: scopeSchema,
  scopeId: z.string(),
  generatedAt: z.string().datetime(),
  summary: z.string(),
  themes: z.array(z.string()),
  tensions: z.array(z.string()),
  weakSignals: z.array(z.string()),
  sentiment: z.record(z.string(), z.number()),
  sourceContributionIds: z.array(z.string()),
  questions: z.array(z.string()).max(4),
});

export type ContributionInput = z.infer<typeof contributionInputSchema>;
export type ContributionType = z.infer<typeof contributionTypeSchema>;
export type ContributionSignal = z.infer<typeof contributionSignalSchema>;
export type ScopeType = z.infer<typeof scopeSchema>;
export type Synthesis = z.infer<typeof synthesisSchema>;

export interface Conference {
  id: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export interface Track {
  id: string;
  conferenceId: string;
  title: string;
  order: number;
}

export interface Session {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
}

export interface Contribution {
  id: string;
  sessionId: string;
  createdAt: string;
  caption?: string;
  type: ContributionType;
  signal: ContributionSignal;
  mediaUrl?: string;
  mediaKey?: string;
  aiDescription?: string;
  tags: string[];
  inferredSentiment?: string;
  embedding?: number[];
  processingStatus: "pending" | "processed" | "failed";
}

export type JobType = "analyze-contribution" | "synthesize-session" | "synthesize-track" | "synthesize-conference" | "generate-world-cafe";

export interface ProcessingJob {
  id: string;
  type: JobType;
  scopeId: string;
  status: "pending" | "processing" | "completed" | "failed";
  scheduledAt: string;
  attempts: number;
  error?: string;
}
