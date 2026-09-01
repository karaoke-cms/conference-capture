import type { ScopeType } from "@conference/contracts";

export function contributionGroups<T extends { sessionId: string }>(items: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.sessionId, [...(groups.get(item.sessionId) ?? []), item]);
  return groups;
}

export function latestSynthesis<T extends { scopeType: string; scopeId: string; generatedAt: string }>(
  items: readonly T[], scopeType: ScopeType, scopeId: string,
): T | undefined {
  return items.filter((item) => item.scopeType === scopeType && item.scopeId === scopeId)
    .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

export function sentimentPercentages(sentiment: Record<string, number>) {
  const total = Object.values(sentiment).reduce((sum, count) => sum + count, 0);
  return Object.entries(sentiment)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, percentage: total ? Math.round(count / total * 100) : 0 }));
}

export function qrUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/session/${encodeURIComponent(slug)}`;
}

// Session ids carry a colon ("metaphorum:talk74"), which is legal in an id but not in a CSS
// selector, so the router warns when it resolves the hash. Keep anchors selector-safe.
export function sessionAnchor(sessionId: string): string {
  return `session-${sessionId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}
