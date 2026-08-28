import type { ContributionSignal, ScopeType } from "@conference/contracts";

export interface AnalysisInput { caption?: string; signal: ContributionSignal; mediaUrl?: string }
export interface AnalysisResult { description: string; tags: string[]; sentiment: string; embedding: number[] }
export interface SynthesisContribution { id: string; caption?: string; signal: string; tags: string[]; aiDescription?: string }
export interface SynthesisInput { scopeType: ScopeType; scopeId: string; contributions: SynthesisContribution[] }
export interface SynthesisResult {
  summary: string; themes: string[]; tensions: string[]; weakSignals: string[];
  sentiment: Record<string, number>; sourceContributionIds: string[];
}
export interface QuestionInput { summary: string; themes: string[]; tensions: string[]; sourceContributionIds: string[] }

export interface AiProvider {
  name: string;
  analyzeContribution(input: AnalysisInput): Promise<AnalysisResult>;
  synthesize(input: SynthesisInput): Promise<SynthesisResult>;
  generateQuestions(input: QuestionInput): Promise<string[]>;
}
