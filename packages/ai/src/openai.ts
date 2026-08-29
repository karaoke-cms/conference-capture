import type { AiProvider } from "./provider";
import { createMockAiProvider } from "./mock";

export function extractOpenAiOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("AI provider returned no structured output");
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string" && record.output_text.trim()) return record.output_text;
  if (!Array.isArray(record.output)) throw new Error("AI provider returned no structured output");
  const chunks: string[] = [];
  for (const item of record.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string" && text.trim()) chunks.push(text);
    }
  }
  const text = chunks.join("\n").trim();
  if (!text) throw new Error("AI provider returned no structured output");
  return text;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI provider returned no structured output");
  return parsed as Record<string, unknown>;
}

export function createOpenAiProvider(config: { apiKey: string; model?: string }): AiProvider {
  const fallback = createMockAiProvider();
  const request = async (task: string, input: unknown) => {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model ?? "gpt-5-mini",
        input: [
          { role: "system", content: [{ type: "input_text", text: "Return only valid JSON. Ground every claim in the supplied contribution data. A single contribution is enough. Use an empty-material response only when contributions is empty." }] },
          { role: "user", content: [{ type: "input_text", text: JSON.stringify({ task, input }) }] },
        ],
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    return parseJsonObject(extractOpenAiOutputText(await response.json()));
  };
  return {
    name: "openai",
    async analyzeContribution(input) {
      try { return await request("Analyze the contribution into description, tags, sentiment, and an 8-number embedding.", input) as unknown as Awaited<ReturnType<AiProvider["analyzeContribution"]>>; }
      catch { return fallback.analyzeContribution(input); }
    },
    async synthesize(input) {
      try {
        const result = await request("Synthesize themes, tensions, weakSignals, sentiment, summary, and exact sourceContributionIds.", input) as unknown as Awaited<ReturnType<AiProvider["synthesize"]>>;
        if (input.contributions.length > 0 && (!result.sourceContributionIds || result.sourceContributionIds.length === 0)) {
          return fallback.synthesize(input);
        }
        return result;
      } catch { return fallback.synthesize(input); }
    },
    async generateQuestions(input) {
      try {
        const result = await request("Generate four grounded World Cafe questions: convergence, tension, blind spot, action.", input);
        return Array.isArray(result.questions) ? result.questions.filter((item): item is string => typeof item === "string").slice(0, 4) : fallback.generateQuestions(input);
      } catch { return fallback.generateQuestions(input); }
    },
  };
}
