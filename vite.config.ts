import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load from .env files and inject into actual process.env for local dev SSR.
  // In production (CF Workers + nodejs_compat), Worker runtime bindings are
  // automatically mapped to process.env — no build-time define needed.
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [tanstackStart(), tailwindcss(), tsConfigPaths()],
  };
});
