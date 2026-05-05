import { createFileRoute } from "@tanstack/react-router";

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
        const redirectAfter = url.searchParams.get("redirect") ?? "/connect";

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
