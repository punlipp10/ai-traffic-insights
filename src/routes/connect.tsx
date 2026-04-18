import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { listGA4Properties } from "@/lib/ga4.functions";
import { logoutGoogle } from "@/lib/auth.functions";
import type { GA4Property } from "@/lib/ai-sources";

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Select Property — Is AI Sending Me Traffic?" },
      { name: "description", content: "Choose which GA4 property to analyze for AI referral traffic." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    try {
      const result = await listGA4Properties();
      return { properties: result.properties, error: null };
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      const isAuthError =
        msg.includes("Not authenticated") ||
        msg.includes("No refresh token") ||
        msg.toLowerCase().includes("not authenticated");
      return {
        properties: [] as GA4Property[],
        error: isAuthError ? "not_authenticated" : `api_error: ${msg}`,
      };
    }
  },
  component: ConnectPage,
});

function ConnectPage() {
  const { properties, error } = Route.useLoaderData();
  const navigate = useNavigate();
  const [disconnecting, setDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await logoutGoogle();
    } catch {
      // best-effort
    }
    navigate({ to: "/" });
  };

  if (error === "not_authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <p
            className="text-muted-foreground text-sm"
            style={{ fontFamily: bodyFont }}
          >
            You need to connect your Google account first.
          </p>
          <a
            href="/auth/google"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            style={{ fontFamily: bodyFont }}
          >
            Connect Google Analytics
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: displayFont }}
          >
            Something went wrong
          </h1>
          <p
            className="text-sm text-muted-foreground font-mono bg-muted rounded-lg px-3 py-2 text-left"
            style={{ fontFamily: "monospace" }}
          >
            {error}
          </p>
          <a
            href="/auth/google"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            style={{ fontFamily: bodyFont }}
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <h1
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: displayFont }}
          >
            No GA4 properties found
          </h1>
          <p
            className="text-sm text-muted-foreground"
            style={{ fontFamily: bodyFont }}
          >
            We couldn't find any GA4 properties on your Google account. Make
            sure you have access to at least one GA4 property.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <a
              href="/auth/google"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ fontFamily: bodyFont }}
            >
              Try again
            </a>
            <Link
              to="/"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground"
              style={{ fontFamily: bodyFont }}
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If only one property, go straight to results
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-10 md:px-10 md:py-16">

        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <p
              className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-2"
              style={{ fontFamily: bodyFont }}
            >
              Step 2 of 2
            </p>
            <h1
              className="text-[2rem] leading-[1.05] tracking-tight text-foreground"
              style={{ fontFamily: displayFont }}
            >
              Select a property
            </h1>
            <p
              className="text-sm text-muted-foreground mt-1.5"
              style={{ fontFamily: bodyFont }}
            >
              Choose which GA4 property to check for AI traffic.
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors whitespace-nowrap ml-4 mt-1 disabled:opacity-40"
            style={{ fontFamily: bodyFont }}
          >
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>

        {/* Property list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-up animate-delay-100">
          {properties.map(
            (prop: {
              propertyId: string;
              displayName: string;
              accountName: string;
            }, idx: number) => (
              <Link
                key={prop.propertyId}
                to="/results"
                search={{ propertyId: prop.propertyId, propertyName: prop.displayName }}
                className={`block w-full text-left px-5 py-4 hover:bg-muted/40 active:bg-muted/70 transition-colors ${
                  idx < properties.length - 1 ? "border-b border-border/50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="font-semibold text-foreground text-sm"
                      style={{ fontFamily: bodyFont }}
                    >
                      {prop.displayName}
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground/70 mt-0.5"
                      style={{ fontFamily: bodyFont }}
                    >
                      {prop.accountName} · {prop.propertyId}
                    </p>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>

        <footer className="mt-16 text-center space-y-1">
          <p
            className="text-[11px] text-muted-foreground/40"
            style={{ fontFamily: bodyFont }}
          >
          With <span className="text-blue-500">♥</span>{" "}by{" "}
            <a
              href="https://www.lovedby.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/40 hover:text-foreground transition-colors font-medium"
            >
              LovedByAI
            </a>
          </p>
          <Link
            to="/privacy"
            className="block text-[11px] text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
            style={{ fontFamily: bodyFont }}
          >
            Privacy
          </Link>
        </footer>
      </div>
    </div>
  );
}
