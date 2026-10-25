import { createFileRoute } from "@tanstack/react-router";
import { useSession } from "@tanstack/react-start/server";
import { getSessionConfig } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth/google")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
          return new Response("Google OAuth not configured", { status: 500 });
        }

        const url = new URL(request.url);
        const origin = url.origin;
        const requested = url.searchParams.get("redirect") ?? "/connect";
        // Only allow relative paths to prevent open-redirect attacks
        const redirectAfter =
          requested.startsWith("/") && !requested.startsWith("//") ? requested : "/connect";

        // Already connected: skip the Google consent screen. If the stored
        // token turns out to be dead, /connect links back here with ?force=1.
        if (!url.searchParams.has("force")) {
          const session = await useSession<{ googleRefreshToken?: string }>(getSessionConfig());
          if (session.data.googleRefreshToken) {
            return new Response(null, {
              status: 302,
              headers: { Location: redirectAfter },
            });
          }
        }

        const authUrl = new URL(
          "https://accounts.google.com/o/oauth2/v2/auth"
        );
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", `${origin}/auth/callback`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set(
          "scope",
          "openid email https://www.googleapis.com/auth/analytics.readonly"
        );
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", redirectAfter);

        return new Response(null, {
          status: 302,
          headers: { Location: authUrl.toString() },
        });
      },
    },
  },
});
