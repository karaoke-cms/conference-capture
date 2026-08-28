import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiDependencies } from "./dependencies";
import { problem } from "./errors";
import { registerOrganizerRoutes } from "./routes/organizer";
import { registerPublicRoutes } from "./routes/public";
import { registerSchedulerRoutes } from "./routes/scheduler";

export function createApp(dependencies: ApiDependencies) {
  const app = new Hono();
  app.use("*", cors({ origin: dependencies.config.webOrigin, allowHeaders: ["authorization", "content-type"] }));
  registerPublicRoutes(app, dependencies);
  registerOrganizerRoutes(app, dependencies);
  registerSchedulerRoutes(app, dependencies);
  app.onError((error, c) => {
    console.error(error);
    return problem(c, 500, "internal_error", "The request could not be completed.");
  });
  return app;
}
