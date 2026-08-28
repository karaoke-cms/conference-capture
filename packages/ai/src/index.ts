import type { AiProvider } from "./provider";
import { createMockAiProvider } from "./mock";
import { createOpenAiProvider } from "./openai";

export * from "./mock";
export * from "./openai";
export * from "./provider";

export function createAiProvider(config: { provider?: string; apiKey?: string; model?: string }): AiProvider {
  return config.provider === "openai" && config.apiKey
    ? createOpenAiProvider({ apiKey: config.apiKey, model: config.model })
    : createMockAiProvider();
}
