import type { AiProvider } from "./provider";

const stopWords = new Set(["about", "after", "again", "also", "and", "are", "creates", "from", "into", "that", "the", "this", "with"]);
const words = (text: string) => text.toLowerCase().match(/[a-z][a-z-]{3,}/g) ?? [];
const tags = (text: string) => [...new Set(words(text).filter((word) => !stopWords.has(word)))].slice(0, 6);
const embedding = (text: string) => Array.from({ length: 8 }, (_, index) => {
  let value = 0;
  for (let cursor = index; cursor < text.length; cursor += 8) value = (value + text.charCodeAt(cursor) * 31) % 997;
  return Number((value / 997).toFixed(4));
});

export function createMockAiProvider(): AiProvider {
  return {
    name: "mock",
    async analyzeContribution(input) {
      const source = input.caption?.trim() || "A participant submitted a conference image for collective interpretation.";
      return { description: source, tags: tags(source), sentiment: input.signal, embedding: embedding(source) };
    },
    async synthesize(input) {
      if (input.contributions.length === 0) {
        return { summary: "Not enough participant material has been contributed for a grounded synthesis.", themes: [], tensions: [], weakSignals: [], sentiment: {}, sourceContributionIds: [] };
      }
      const frequency = new Map<string, number>();
      const sentiment: Record<string, number> = {};
      for (const item of input.contributions) {
        sentiment[item.signal] = (sentiment[item.signal] ?? 0) + 1;
        for (const tag of item.tags) frequency.set(tag, (frequency.get(tag) ?? 0) + 1);
      }
      const themes = [...frequency.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([tag]) => tag);
      const captions = input.contributions.map((item) => item.caption || item.aiDescription).filter(Boolean);
      return {
        summary: `Across ${input.contributions.length} contribution${input.contributions.length === 1 ? "" : "s"}, participants surfaced ${themes.slice(0, 3).join(", ") || "emerging observations"}. ${captions[0] ?? ""}`.trim(),
        themes,
        tensions: themes.length >= 2 ? [`${themes[0]} ↔ ${themes[1]}`] : [],
        weakSignals: input.contributions.filter((item) => item.signal === "concerned" || item.signal === "confused").flatMap((item) => item.tags).slice(0, 3),
        sentiment,
        sourceContributionIds: input.contributions.map((item) => item.id).sort(),
      };
    },
    async generateQuestions(input) {
      if (input.sourceContributionIds.length === 0) return [];
      const theme = input.themes[0] ?? "our shared inquiry";
      const tension = input.tensions[0] ?? `${theme} and what it asks of us`;
      return [
        `What are we beginning to agree about regarding ${theme}?`,
        `How might we work productively with the tension between ${tension}?`,
        `Whose perspective or experience is still missing from our conversation about ${theme}?`,
        `What will we do differently after this conference because of what we learned about ${theme}?`,
      ];
    },
  };
}
