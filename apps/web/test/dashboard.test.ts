import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { contributionGroups, latestSynthesis, qrUrl, sentimentPercentages, sessionAnchor } from "../app/utils/dashboard";

describe("organizer dashboard view model", () => {
  test("groups contributions by session", () => {
    const groups = contributionGroups([{ id: "a", sessionId: "s1" }, { id: "b", sessionId: "s2" }, { id: "c", sessionId: "s1" }]);
    expect(groups.get("s1")?.map((item) => item.id)).toEqual(["a", "c"]);
  });

  test("selects the newest synthesis and calculates sentiment proportions", () => {
    const items = [
      { scopeType: "session", scopeId: "s1", generatedAt: "2026-01-01T10:00:00Z" },
      { scopeType: "session", scopeId: "s1", generatedAt: "2026-01-01T11:00:00Z" },
    ];
    expect(latestSynthesis(items, "session", "s1")?.generatedAt).toContain("11:00");
    expect(sentimentPercentages({ curious: 3, concerned: 1 })).toEqual([
      { label: "curious", count: 3, percentage: 75 },
      { label: "concerned", count: 1, percentage: 25 },
    ]);
  });

  test("constructs a public session URL for QR encoding", () => {
    expect(qrUrl("https://capture.example/", "ai-and-vsm")).toBe("https://capture.example/session/ai-and-vsm");
  });

  test("builds a session anchor the router can use as a CSS selector", () => {
    expect(sessionAnchor("metaphorum:talk74")).toBe("session-metaphorum-talk74");
    expect(sessionAnchor("metaphorum:talk74")).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

test("links session panels and contribution deep links through the same anchor helper", async () => {
  const sessions = await readFile(new URL("../app/pages/organizer/sessions.vue", import.meta.url), "utf8");
  const contributions = await readFile(new URL("../app/pages/organizer/contributions.vue", import.meta.url), "utf8");

  expect(sessions).toContain(":id=\"sessionAnchor(session.id)\"");
  expect(contributions).toContain("hash: `#${sessionAnchor(item.sessionId)}`");
  expect(`${sessions}${contributions}`).not.toContain("session-${");
});

test("uses the selectable QR print list instead of individual QR cards", async () => {
  const dashboard = await readFile(new URL("../app/pages/organizer/qr-codes.vue", import.meta.url), "utf8");
  const printList = await readFile(new URL("../app/components/SessionQrPrintList.vue", import.meta.url), "utf8");

  expect(dashboard).toContain("<SessionQrPrintList");
  expect(printList.match(/>All</g)).toHaveLength(2);
  expect(printList).toContain("Print selected");
  expect(printList).toContain(":indeterminate=\"isPartial\"");
});
