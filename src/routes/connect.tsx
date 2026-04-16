import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { listGA4Properties } from "@/lib/ga4.functions";
import { logoutGoogle } from "@/lib/auth.functions";
import type { GA4Property } from "@/lib/ai-sources";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Select Property — Is AI Sending Me Traffic?" },
      { name: "description", content: "Choose which GA4 property to analyze." },
    ],
  }),
  loader: async () => {
    try {
      const result = await listGA4Properties();
      return { properties: result.properties, error: null };
    } catch (e) {
      return { properties: [] as GA4Property[], error: "not_authenticated" };
    }
  },
  component: ConnectPage,
});

function ConnectPage() {
  const { properties, error } = Route.useLoaderData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  if (error === "not_authenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            You need to connect your Google account first.
          </p>
          <a
            href="/auth/google"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
          >
            Connect GA4
          </a>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-bold text-foreground">
            No GA4 properties found
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find any GA4 properties on your Google account. Make
            sure you have access to at least one GA4 property.
          </p>
          <div className="flex gap-3 justify-center">
            <a
              href="/auth/google"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Try again
            </a>
            <Link
              to="/"
              className="rounded-xl bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground"
            >
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If only one property, go straight to results
  if (properties.length === 1) {
    const prop = properties[0];
    navigate({
      to: "/results",
      search: { propertyId: prop.propertyId, propertyName: prop.displayName },
    });
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">
          Checking your GA4...
        </p>
      </div>
    );
  }

  const handleSelect = (prop: { propertyId: string; displayName: string; accountName: string }) => {
    setLoading(prop.propertyId);
    navigate({
      to: "/results",
      search: { propertyId: prop.propertyId, propertyName: prop.displayName },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Select a property
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Choose which GA4 property you want to check for AI traffic.
        </p>

        <div className="space-y-2">
          {properties.map((prop) => (
            <button
              key={prop.propertyId}
              onClick={() => handleSelect(prop)}
              disabled={loading !== null}
              className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all disabled:opacity-50"
            >
              <p className="font-medium text-card-foreground">
                {prop.displayName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {prop.accountName} · {prop.propertyId}
              </p>
              {loading === prop.propertyId && (
                <p className="text-xs text-primary mt-2 animate-pulse">
                  Loading...
                </p>
              )}
            </button>
          ))}
        </div>

        <footer className="mt-16 text-center">
          <p className="text-xs text-muted-foreground/60">
            With ❤️ by{" "}
            <a
              href="https://lovedbyai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              lovedbyai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
