import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

describe("organizer session panel footer", () => {
  test("prints the contribution count outside the synthesis branch, so it survives an empty scope", async () => {
    const panel = await read("../app/components/ScopePanel.vue");
    const [, afterEmpty = ""] = panel.split("No synthesis has been generated for this scope.");

    expect(afterEmpty).toContain("contributionCount !== undefined");
    expect(afterEmpty).toContain("contribution{{ contributionCount === 1 ? \"\" : \"s\" }}");
  });

  test("shows a photo count only when photos are present", async () => {
    const panel = await read("../app/components/ScopePanel.vue");
    expect(panel).toContain("v-if=\"photoCount\"");
    expect(panel).toContain("photo{{ photoCount === 1 ? \"\" : \"s\" }}");
  });

  test("opens the per-session contributions link in a new tab", async () => {
    const panel = await read("../app/components/ScopePanel.vue");
    expect(panel).toContain("target=\"_blank\"");
    expect(panel).toContain("rel=\"noopener\"");
  });

  test("the sessions page feeds counts and the session-scoped link into each panel", async () => {
    const page = await read("../app/pages/organizer/sessions.vue");
    expect(page).toContain(":contribution-count=\"countsFor(session.id).contributions\"");
    expect(page).toContain(":photo-count=\"countsFor(session.id).photos\"");
    expect(page).toContain("/organizer/contributions?session=");
    expect(page).toContain("item.mediaUrl");
  });

  test("the contributions page narrows to one session from the query string", async () => {
    const page = await read("../app/pages/organizer/contributions.vue");
    expect(page).toContain("route.query.session");
    expect(page).toContain("item.sessionId === sessionId.value");
  });
});

describe("inline refresh after generate", () => {
  test("waits long enough for a real model call and keeps the panel busy while waiting", async () => {
    const composable = await read("../app/composables/useOrganizerDashboard.ts");
    const attempts = Number(composable.match(/attempt < (\d+)/)?.[1]);
    const interval = Number(composable.match(/setTimeout\(resolve, (\d+)\)/)?.[1]);

    expect(attempts * interval).toBeGreaterThanOrEqual(45_000);
    expect(composable).toContain("queued.value = new Set([...queued.value, key]);");
  });
});
