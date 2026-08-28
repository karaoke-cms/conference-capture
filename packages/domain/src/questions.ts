export type QuestionKind = "convergence" | "tension" | "blind-spot" | "action";

export function selectWorldCafeQuestions(
  candidates: readonly { text: string; kind: QuestionKind; score: number }[],
): string[] {
  const selected: string[] = [];
  for (const kind of ["convergence", "tension", "blind-spot", "action"] as const) {
    const best = candidates
      .filter((candidate) => candidate.kind === kind)
      .sort((a, b) => b.score - a.score)[0];
    if (best && !selected.includes(best.text)) selected.push(best.text);
  }
  return selected.slice(0, 4);
}
