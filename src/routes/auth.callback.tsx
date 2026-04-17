import { createFileRoute } from "@tanstack/react-router";
import { updateSession } from "@tanstack/react-start/server";

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  googleEmail?: string;
}

function decodeJwtEmail(idToken: string): string | null {
  try {
    const payload = idToken.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as { email?: string };
    return decoded.email ?? null;
  } catch {
    return null;
  }
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

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: "Connecting — Is AI Sending Me Traffic?" }],
  }),
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (!code || error) {
          console.error("OAuth callback error:", error || "missing code");
          return new Response(null, {
            status: 302,
            headers: { Location: "/" },
          });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          console.error("Google OAuth env vars not configured");
          return new Response(null, {
            status: 302,
            headers: { Location: "/" },
          });
        }

        try {
          const tokenRes = await fetch(
            "https://oauth2.googleapis.com/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: `${url.origin}/auth/callback`,
                grant_type: "authorization_code",
              }),
            }
          );

          const tokens = await tokenRes.json();

          if (!tokenRes.ok) {
            console.error("Google token exchange failed:", tokens);
            return new Response(null, {
              status: 302,
              headers: { Location: "/" },
            });
          }

          // updateSession sets Set-Cookie on the H3 event.
          // TanStack Start's mergeEventResponseHeaders automatically
          // attaches it to our 302 response (applies to non-ok responses).
          await updateSession<SessionData>(getSessionConfig(), {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: Date.now() + tokens.expires_in * 1000,
            googleEmail: tokens.id_token ? decodeJwtEmail(tokens.id_token) ?? undefined : undefined,
          });

          return new Response(null, {
            status: 302,
            headers: { Location: "/connect" },
          });
        } catch (err) {
          console.error("Auth callback unexpected error:", err);
          return new Response(null, {
            status: 302,
            headers: { Location: "/" },
          });
        }
      },
    },
  },
  component: CallbackPage,
});

// This component only renders if the user somehow reaches this route
// via client-side navigation (shouldn't happen in normal OAuth flow).
function CallbackPage() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"
    >
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p
        className="text-sm text-muted-foreground"
        style={{ fontFamily: "'Figtree', sans-serif" }}
      >
        Connecting your GA4…
      </p>
    </div>
  );
}

