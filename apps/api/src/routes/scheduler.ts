import type { Hono } from "hono";
import type { ApiDependencies } from "../dependencies";
import { bearer } from "./organizer";

export function registerSchedulerRoutes(app: Hono, dependencies: ApiDependencies) {
  const { repository, config } = dependencies;
  app.use("/api/scheduler/*", bearer(config.cronSecret));
  app.post("/api/scheduler/tick", (c) => {
    const now = new Date(c.req.query("now") ?? Date.now());
    const hierarchy = repository.listHierarchy();
    const existing = new Set(repository.listJobs().map((job) => `${job.type}:${job.scopeId}`));
    const jobs = [];
    for (const session of hierarchy.sessions) {
      if (!session.endsAt) continue;
      const due = new Date(session.endsAt).getTime() + 10 * 60_000 <= now.getTime();
      const key = `synthesize-session:${session.id}`;
      if (due && !existing.has(key)) jobs.push(repository.enqueueJob({ type: "synthesize-session", scopeId: session.id }));
    }
    for (const conference of hierarchy.conferences) {
      const due = new Date(conference.endsAt).getTime() - 60 * 60_000 <= now.getTime();
      for (const type of ["synthesize-conference", "generate-world-cafe"] as const) {
        const key = `${type}:${conference.id}`;
        if (due && !existing.has(key)) jobs.push(repository.enqueueJob({ type, scopeId: conference.id }));
      }
    }
    return c.json({ jobs }, 202);
  });
}
