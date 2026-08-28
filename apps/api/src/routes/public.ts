import { contributionInputSchema } from "@conference/contracts";
import { allowedMediaTypes } from "@conference/storage";
import type { Hono } from "hono";
import type { ApiDependencies } from "../dependencies";
import { problem } from "../errors";

export function registerPublicRoutes(app: Hono, dependencies: ApiDependencies) {
  const { repository, storage, config } = dependencies;
  app.get("/health", (c) => c.json({ status: "ok" }));
  app.get("/api/sessions/:slug", (c) => {
    const context = repository.getSessionContext(c.req.param("slug"));
    return context ? c.json(context) : problem(c, 404, "session_not_found", "Session not found.");
  });
  app.post("/api/contributions", async (c) => {
    const contentType = c.req.header("content-type") ?? "";
    let fields: Record<string, unknown>;
    let photo: File | undefined;
    if (contentType.includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      photo = body.photo instanceof File ? body.photo : undefined;
      fields = { sessionId: body.sessionId, caption: body.caption || undefined, type: body.type, signal: body.signal, hasMedia: Boolean(photo) };
    } else {
      try { fields = await c.req.json(); } catch { return problem(c, 422, "invalid_body", "Send JSON or multipart form data."); }
    }
    const parsed = contributionInputSchema.safeParse(fields);
    if (!parsed.success) return problem(c, 422, "invalid_contribution", "Add a photo or written observation and choose a valid type and signal.", parsed.error.flatten());
    if (!repository.listHierarchy().sessions.some((session) => session.id === parsed.data.sessionId)) return problem(c, 404, "session_not_found", "Session not found.");
    let mediaKey: string | undefined;
    let mediaUrl: string | undefined;
    if (photo) {
      if (photo.size > config.maxUploadBytes) return problem(c, 413, "upload_too_large", "The photo exceeds the upload limit.");
      if (!allowedMediaTypes.has(photo.type)) return problem(c, 415, "unsupported_media", "Use JPEG, PNG, WebP, or HEIC.");
      const stored = await storage.put({ bytes: new Uint8Array(await photo.arrayBuffer()), contentType: photo.type });
      mediaKey = stored.key;
      mediaUrl = await storage.url(stored.key);
    }
    const contribution = repository.createContribution({ ...parsed.data, mediaKey });
    repository.enqueueJob({ type: "analyze-contribution", scopeId: contribution.id });
    return c.json({ contribution: { ...contribution, mediaUrl } }, 201);
  });
  app.get("/media/*", async (c) => {
    if (!storage.get) return problem(c, 404, "media_not_found", "Media is served by object storage.");
    const key = c.req.path.replace(/^\/media\//, "");
    const object = await storage.get(key);
    return object ? new Response(new Blob([new Uint8Array(object.bytes)])) : problem(c, 404, "media_not_found", "Media not found.");
  });
}
