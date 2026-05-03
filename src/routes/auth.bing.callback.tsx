import { createFileRoute } from "@tanstack/react-router";
import { updateSession } from "@tanstack/react-start/server";

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  googleEmail?: string;
  bingAccessToken?: string;
  bingRefreshToken?: string;
  bingTokenExpiry?: number;
}

function getSessionConfig() {
  return {
    password:
      process.env.SESSION_SECRET ||
      "dev-fallback-secret-must-be-32-characters-long!!",
    name: "ai-traffic",
    maxAge: 60 * 60 * 24,
  };
}

export const Route = createFileRoute("/auth/bing/callback")({
  head: () => ({
    meta: [{ title: "Connecting Bing — Is AI Sending Me Traffic?" }],
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (!code || error) {
          console.error("Bing OAuth callback error:", error || "missing code");
          return new Response(null, {
            status: 302,
            headers: { Location: "/connect?bing_error=1" },
          });
        }

        const clientId = process.env.BING_WEBMASTER_CLIENT_ID;
        const clientSecret = process.env.BING_WEBMASTER_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error("Bing Webmaster OAuth env vars not configured");
          return new Response(null, {
            status: 302,
            headers: { Location: "/connect?bing_error=1" },
          });
        }

        try {
          const tokenRes = await fetch(
            "https://www.bing.com/webmasters/oauth/token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: `${url.origin}/auth/bing/callback`,
                grant_type: "authorization_code",
              }),
            }
          );

          const tokens = await tokenRes.json();

          if (!tokenRes.ok) {
            console.error("Bing token exchange failed:", tokens);
            return new Response(null, {
              status: 302,
              headers: { Location: "/connect?bing_error=1" },
            });
          }

          await updateSession<SessionData>(getSessionConfig(), {
            bingAccessToken: tokens.access_token,
            bingRefreshToken: tokens.refresh_token,
            bingTokenExpiry: Date.now() + tokens.expires_in * 1000,
          });

          return new Response(null, {
            status: 302,
            headers: { Location: "/connect?bing_connected=1" },
          });
        } catch (e) {
          console.error("Bing OAuth error:", e);
          return new Response(null, {
            status: 302,
            headers: { Location: "/connect?bing_error=1" },
          });
        }
      },
    },
  },
});
