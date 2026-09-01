import type { ScopeType } from "@conference/contracts";

interface Hierarchy {
  tracks: readonly { id: string; conferenceId: string }[];
  sessions: readonly { id: string; trackId: string }[];
  contributions: readonly { id: string; sessionId: string }[];
}

export function normalizeSourceIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort();
}

export function contributionIdsForScope(scope: ScopeType, scopeId: string, data: Hierarchy): string[] {
  if (scope === "session") {
    return normalizeSourceIds(data.contributions.filter((item) => item.sessionId === scopeId).map((item) => item.id));
  }
  const trackIds = scope === "track"
    ? new Set([scopeId])
    : new Set(data.tracks.filter((track) => track.conferenceId === scopeId).map((track) => track.id));
  const sessionIds = new Set(data.sessions.filter((session) => trackIds.has(session.trackId)).map((session) => session.id));
  return normalizeSourceIds(data.contributions.filter((item) => sessionIds.has(item.sessionId)).map((item) => item.id));
}

const PLACEHOLDER_TEXT = new Set(["noop", "asdf", "test", "n/a", "lorem ipsum"]);

export function isPlaceholderContribution(contribution: { caption?: string; tags: readonly string[] }): boolean {
  const caption = contribution.caption?.trim().toLowerCase();
  if (caption && PLACEHOLDER_TEXT.has(caption)) return true;
  return contribution.tags.length > 0 && contribution.tags.every((tag) => PLACEHOLDER_TEXT.has(tag.trim().toLowerCase()));
}
