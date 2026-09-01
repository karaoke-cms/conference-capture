import type { JobType, ScopeType } from "@conference/contracts";
import { importProgramme, metaphorumProgramme } from "@conference/domain";
import type { Hono, MiddlewareHandler } from "hono";
import type { ApiDependencies } from "../dependencies";
import { problem } from "../errors";

const jobForScope: Record<ScopeType, JobType> = {
  session: "synthesize-session", track: "synthesize-track", conference: "synthesize-conference",
};

export function bearer(token: string): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.header("authorization") !== `Bearer ${token}`) return problem(c, 401, "unauthorized", "A valid organizer token is required.");
    await next();
  };
}

export function registerOrganizerRoutes(app: Hono, dependencies: ApiDependencies) {
  const { repository, config, storage } = dependencies;
  app.use("/api/organizer/*", bearer(config.organizerToken));
  app.get("/api/organizer/dashboard", async (c) => {
    const contributions = await Promise.all(repository.listContributions().map(async (item) => ({
      ...item, mediaUrl: item.mediaKey ? await storage.url(item.mediaKey) : undefined,
    })));
    return c.json({ ...repository.listHierarchy(), contributions, syntheses: repository.listSyntheses(), jobs: repository.listJobs() });
  });
  app.post("/api/organizer/synthesis", async (c) => {
    const body = await c.req.json<{ scopeType?: ScopeType | "world-cafe"; scopeId?: string }>();
    if (!body.scopeId || !body.scopeType) return problem(c, 422, "invalid_scope", "scopeType and scopeId are required.");
    const type = body.scopeType === "world-cafe" ? "generate-world-cafe" : jobForScope[body.scopeType];
    if (!type) return problem(c, 422, "invalid_scope", "Unknown synthesis scope.");
    return c.json({ job: repository.enqueueJob({ type, scopeId: body.scopeId }) }, 202);
  });
  app.get("/api/organizer/programme", (c) => c.json({
    tracks: metaphorumProgramme.tracks.length,
    sessions: metaphorumProgramme.sessions.length,
    scheduled: metaphorumProgramme.sessions.filter((session) => session.startsAt).length,
  }));
  app.post("/api/organizer/import-sessions", (c) => c.json(importProgramme(repository, metaphorumProgramme)));
}
