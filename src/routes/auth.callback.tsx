import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { exchangeGoogleCode } from "@/lib/auth.functions";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search) => ({
    code: (search.code as string) || "",
    error: (search.error as string) || "",
  }),
  loaderDeps: ({ search }) => ({ code: search.code, error: search.error }),
  loader: async ({ deps }) => {
    if (deps.error || !deps.code) {
      throw redirect({ to: "/" });
    }

    // We need the origin for the redirect_uri to match what was sent to Google
    // During SSR, we can derive it. During client-side, window is available.
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "";

    try {
      await exchangeGoogleCode({
        data: { code: deps.code, origin },
      });
    } catch (e) {
      console.error("OAuth exchange failed:", e);
      throw redirect({ to: "/" });
    }

    throw redirect({ to: "/connect" });
  },
  component: CallbackPage,
});

function CallbackPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground animate-pulse">
        Connecting your GA4...
      </p>
    </div>
  );
}
