import type { AiProvider } from "./provider";
import { createMockAiProvider } from "./mock";

export function createOpenAiProvider(config: { apiKey: string; model?: string }): AiProvider {
  const fallback = createMockAiProvider();
  const request = async (task: string, input: unknown) => {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${config.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: config.model ?? "gpt-5-mini",
        input: [{ role: "system", content: [{ type: "input_text", text: "Return only valid JSON. Ground every claim in the supplied contribution data." }] }, { role: "user", content: [{ type: "input_text", text: JSON.stringify({ task, input }) }] }],
      }),
    });
    if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
    const payload = await response.json() as { output_text?: string };
    if (!payload.output_text) throw new Error("AI provider returned no structured output");
    return JSON.parse(payload.output_text) as Record<string, unknown>;
  };
  return {
    name: "openai",
    async analyzeContribution(input) {
      try { return await request("Analyze the contribution into description, tags, sentiment, and an 8-number embedding.", input) as unknown as Awaited<ReturnType<AiProvider["analyzeContribution"]>>; }
      catch { return fallback.analyzeContribution(input); }
    },
    async synthesize(input) {
      try { return await request("Synthesize themes, tensions, weakSignals, sentiment, summary, and exact sourceContributionIds.", input) as unknown as Awaited<ReturnType<AiProvider["synthesize"]>>; }
      catch { return fallback.synthesize(input); }
    },
    async generateQuestions(input) {
      try {
        const result = await request("Generate four grounded World Cafe questions: convergence, tension, blind spot, action.", input);
        return Array.isArray(result.questions) ? result.questions.filter((item): item is string => typeof item === "string").slice(0, 4) : fallback.generateQuestions(input);
      } catch { return fallback.generateQuestions(input); }
    },
  };
}
