// @lovable.dev/vite-tanstack-config already includes: TanStack devtools, tanstackStart, viteReact,
// tailwindcss, tsConfigPaths, VITE_* env injection, the @ alias and React/TanStack dedupe.
// Do NOT add those manually or the app will break with duplicate plugins.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isBuild =
  process.env["npm_lifecycle_event"] === "build" || process.argv.includes("build");

const env = loadEnv(isBuild ? "production" : "development", process.cwd(), "VITE_");

// Sub-path where the built app is served (e.g. "/meu-app"). Empty = served at root.
// Configure with VITE_BASEPATH in .env (the scaffold script does this for you).
const rawBase = process.env["VITE_BASEPATH"] ?? env["VITE_BASEPATH"] ?? "";
const basepath = rawBase && rawBase !== "/" ? `/${rawBase.replace(/^\/+|\/+$/g, "")}` : "";

export default defineConfig({
  vite: {
    base: isBuild && basepath ? `${basepath}/` : "/",
  },
  tanstackStart: {
    ...(isBuild
      ? {
          ...(basepath ? { router: { basepath } } : {}),
          // SPA mode with static prerendering for all routes
          spa: {
            enabled: true,
            ...(basepath ? { maskPath: basepath } : {}),
            prerender: { outputPath: "/index" },
          },
          prerender: { enabled: true, crawlLinks: true },
        }
      : { spa: { enabled: true } }),
  },
  // Static output in dist/client (no Nitro server runtime)
  nitro: false,
});
