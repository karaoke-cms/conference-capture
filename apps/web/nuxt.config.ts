export default defineNuxtConfig({
  compatibilityDate: "2026-07-20",
  devtools: { enabled: true },
  nitro: { preset: "node-server" },
  typescript: { strict: true },
  css: ["~/assets/css/main.css"],
  runtimeConfig: { public: { apiBase: process.env.API_BASE_URL ?? "http://localhost:8787" } },
});
