import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load from .env files (local dev) + process.env (CF build environment)
  const env = loadEnv(mode, process.cwd(), "");
  const get = (key: string) => env[key] || process.env[key] || "";

  return {
    plugins: [tanstackStart(), tailwindcss(), tsConfigPaths()],
    define: {
      "process.env.GOOGLE_CLIENT_ID": JSON.stringify(get("GOOGLE_CLIENT_ID")),
      "process.env.GOOGLE_CLIENT_SECRET": JSON.stringify(get("GOOGLE_CLIENT_SECRET")),
      "process.env.SESSION_SECRET": JSON.stringify(get("SESSION_SECRET")),
      "process.env.SUPABASE_URL": JSON.stringify(get("SUPABASE_URL")),
      "process.env.SUPABASE_SERVICE_ROLE_KEY": JSON.stringify(get("SUPABASE_SERVICE_ROLE_KEY")),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(get("SUPABASE_PUBLISHABLE_KEY")),
    },
  };
});
