import { createApp } from "./app";
import { loadApiConfig } from "./config";
import { loadDependencies } from "./dependencies";

const config = loadApiConfig();
const dependencies = loadDependencies(config);
const app = createApp(dependencies);

export default { port: Number(process.env.API_PORT ?? 8787), fetch: app.fetch };
