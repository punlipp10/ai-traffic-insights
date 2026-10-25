import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listGA4Properties } from "@/lib/ga4.functions";
import { logoutGoogle } from "@/lib/auth.functions";
import { getBingStatusAndSites, disconnectBing } from "@/lib/bing.functions";
import type { GA4Property } from "@/lib/ai-sources";
import { trackEvent } from "@/lib/analytics";

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

function BouncingDots() {
  return (
    <span className="flex items-center gap-[3px]" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

const AI_GRID_SIZE = 16;
const AI_LOADING_MESSAGES = [
  "Fetching your analytics data...",
  "Looking for AI referral traffic...",
  "Finding top pages...",
  "Crunching the numbers...",
];

function AILoadingOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [activeNodes, setActiveNodes] = useState<Set<number>>(
    () => new Set([0, 3, 5, 9, 12, 15])
  );

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx((i) => (i + 1) % AI_LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveNodes((prev) => {
        const next = new Set(prev);
        const arr = [...next];
        const toOff = Math.floor(Math.random() * 3);
        for (let i = 0; i < toOff && arr.length > 3; i++) {
          next.delete(arr[Math.floor(Math.random() * arr.length)]);
        }
        const toOn = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < toOn && next.size < 11; i++) {
          next.add(Math.floor(Math.random() * AI_GRID_SIZE));
        }
        return next;
      });
    }, 200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 gap-7">
      <div className="relative flex flex-col items-center gap-5">
        <div
          className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.50 0.175 162 / 0.07)" }}
        />
        <div className="relative grid grid-cols-4 gap-[14px]">
          {Array.from({ length: AI_GRID_SIZE }, (_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all duration-150"
              style={{
                backgroundColor: activeNodes.has(i)
                  ? "oklch(0.50 0.175 162)"
                  : "oklch(0.50 0.175 162 / 0.12)",
                boxShadow: activeNodes.has(i)
                  ? "0 0 9px 3px oklch(0.50 0.175 162 / 0.35)"
                  : "none",
                transform: activeNodes.has(i) ? "scale(1.25)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <div
          className="w-24 h-px rounded-full overflow-hidden"
          style={{ backgroundColor: "oklch(0.50 0.175 162 / 0.15)" }}
        >
          <div
            className="ai-scan-beam h-full rounded-full"
            style={{ backgroundColor: "oklch(0.50 0.175 162 / 0.65)", width: "38%" }}
          />
        </div>
      </div>
      <p
        className="text-sm text-muted-foreground text-center"
        style={{ fontFamily: bodyFont }}
      >
        {AI_LOADING_MESSAGES[msgIdx]}
      </p>
    </div>
  );
}

const DEMO_PROPERTIES: GA4Property[] = [
  { propertyId: "demo", displayName: "TechBlog Example", accountName: "Demo Account" },
  { propertyId: "demo2", displayName: "SaaS Product (Demo)", accountName: "Demo Account" },
  { propertyId: "demo3", displayName: "E-commerce Store (Demo)", accountName: "Demo Account" },
];

export const Route = createFileRoute("/connect")({
  validateSearch: (search) => ({
    demo: search.demo === "1" || search.demo === 1 || search.demo === true,
    bingConnected: search.bing_connected === "1",
    bingError: search.bing_error === "1",
  }),
  head: () => ({
    meta: [
      { title: "Select Property — Is AI Sending Me Traffic?" },
      { name: "description", content: "Choose which GA4 property to analyze for AI referral traffic." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loaderDeps: ({ search }) => ({ demo: search.demo }),
  loader: async ({ deps }) => {
    const emptyBing = { connected: false, sites: [] as string[] };
    if (deps.demo) {
      return { properties: DEMO_PROPERTIES, error: null, isDemo: true, bingStatus: emptyBing };
    }

    let ga4Properties: GA4Property[] = [];
    let ga4Error: string | null = null;

    try {
      const result = await listGA4Properties();
      ga4Properties = result.properties;
    } catch (e: unknown) {
      const msg = (e as Error).message || "";
      const isAuthError =
        msg.includes("Not authenticated") ||
        msg.includes("No refresh token") ||
        msg.toLowerCase().includes("not authenticated");
      ga4Error = isAuthError ? "not_authenticated" : `api_error: ${msg}`;
    }

    let bingStatus = emptyBing;
    try {
      bingStatus = await getBingStatusAndSites();
    } catch {
      // non-fatal — Bing is optional
    }

    if (ga4Error) {
      return { properties: [] as GA4Property[], error: ga4Error, isDemo: false, bingStatus };
    }

    return { properties: ga4Properties, error: null, isDemo: false, bingStatus };
  },
  component: ConnectPage,
});

function ConnectPage() {
  const { properties, error, isDemo, bingStatus } = Route.useLoaderData();
  const { bingConnected, bingError } = Route.useSearch();
  const navigate = useNavigate();
  const [disconnecting, setDisconnecting] = useState(false);
  const [loadingProperty, setLoadingProperty] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [selectedBingSite, setSelectedBingSite] = useState<string>("");
  const [disconnectingBing, setDisconnectingBing] = useState(false);

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem("visited_ga4_properties") ?? "[]");
      setVisitedIds(new Set(ids));
    } catch { /* best-effort */ }
  }, []);

  useEffect(() => {
    try {
      const site = localStorage.getItem("bing_site") || "";
      setSelectedBingSite(site);
    } catch { /* best-effort */ }
  }, []);

  const handleBingSiteSelect = (siteUrl: string) => {
    const next = selectedBingSite === siteUrl ? "" : siteUrl;
    setSelectedBingSite(next);
    try {
      if (next) localStorage.setItem("bing_site", next);
      else localStorage.removeItem("bing_site");
    } catch { /* best-effort */ }
  };

  const handleBingDisconnect = async () => {
    setDisconnectingBing(true);
    try {
      await disconnectBing();
      localStorage.removeItem("bing_site");
    } catch { /* best-effort */ }
    window.location.href = "/connect";
  };

  useEffect(() => {
    trackEvent("ga4_property_list_viewed", {
      status: error ? "error" : "ok",
      properties_available_count: properties.length,
    });
  }, [error, properties.length]);

  // Persist the full property list so /results can show a quick-switch dropdown
  useEffect(() => {
    if (!isDemo && properties.length > 0) {
      try {
        const list = properties.map((p: GA4Property) => ({ propertyId: p.propertyId, propertyName: p.displayName }));
        localStorage.setItem("ga4_properties", JSON.stringify(list));
      } catch { /* best-effort */ }
    }
  }, [isDemo, properties]);

  const handleDisconnect = async () => {
    trackEvent("google_disconnect_click", { source: "connect" });
    setDisconnecting(true);
    try {
      await logoutGoogle();
    } catch {
      // best-effort
    }
    window.location.href = "/";
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
            onClick={() => {
              trackEvent("connect_google_click", { source: "connect_gate" });
            }}
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
            onClick={() => {
              trackEvent("connect_google_click", { source: "connect_error" });
            }}
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
              onClick={() => {
                trackEvent("connect_google_click", { source: "connect_no_properties" });
              }}
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

  // Property list
  return (
    <div className="min-h-screen bg-background">
      {loadingProperty !== null && <AILoadingOverlay />}
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
            disabled={disconnecting || isDemo}
            className={`text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors whitespace-nowrap ml-4 mt-1 disabled:opacity-40 ${isDemo ? "invisible" : ""}`}
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
              <button
                key={prop.propertyId}
                type="button"
                onClick={() => {
                  trackEvent("ga4_property_selected", {
                    source: isDemo ? "connect_demo" : "connect",
                    properties_available_count: properties.length,
                  });
                  setLoadingProperty(prop.propertyId);
                  void navigate({
                    to: "/results",
                    search: { propertyId: prop.propertyId, propertyName: prop.displayName, days: 30, bingSiteUrl: selectedBingSite || "", hosts: "" },
                  });
                }}
                className={`block w-full text-left px-5 py-4 hover:bg-muted/40 active:bg-muted/70 transition-colors ${
                  idx < properties.length - 1 ? "border-b border-border/50" : ""
                } ${loadingProperty === prop.propertyId ? "bg-muted/30" : ""}`}
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
                  <div className="flex items-center gap-2 flex-none">
                    {visitedIds.has(prop.propertyId) && loadingProperty !== prop.propertyId && (
                      <span
                        title="You've checked this property before"
                        className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md"
                        style={{
                          fontFamily: bodyFont,
                          color: "oklch(0.44 0.14 162)",
                          backgroundColor: "oklch(0.50 0.175 162 / 0.1)",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: "oklch(0.50 0.175 162)" }} />
                        Viewed
                      </span>
                    )}
                    {loadingProperty === prop.propertyId && <BouncingDots />}
                  </div>
                </div>
              </button>
            )
          )}
        </div>

        {/* Bing Webmaster Tools — hidden for now */}
        {false && !isDemo && (
          <section className="mt-8 animate-fade-up animate-delay-200">
            <div className="flex items-center gap-2 mb-3">
              <p
                className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
                style={{ fontFamily: bodyFont }}
              >
                Bing Webmaster Tools
              </p>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground/50"
                style={{ fontFamily: bodyFont }}
              >
                Optional
              </span>
            </div>

            {bingConnected && !bingStatus.connected && (
              <p
                className="text-xs text-primary mb-2"
                style={{ fontFamily: bodyFont }}
              >
                Bing connected — loading sites…
              </p>
            )}

            {bingStatus.connected ? (
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {bingStatus.sites.length === 0 ? (
                  <div className="px-5 py-4">
                    <p
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily: bodyFont }}
                    >
                      No verified sites found.{" "}
                      <a
                        href="https://www.bing.com/webmasters"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        Add a site in BWT →
                      </a>
                    </p>
                  </div>
                ) : (
                  bingStatus.sites.map((siteUrl, idx) => (
                    <button
                      key={siteUrl}
                      type="button"
                      onClick={() => handleBingSiteSelect(siteUrl)}
                      className={`block w-full text-left px-5 py-3.5 hover:bg-muted/40 active:bg-muted/70 transition-colors ${
                        idx < bingStatus.sites.length - 1 ? "border-b border-border/50" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className="text-sm text-foreground truncate"
                          style={{ fontFamily: bodyFont }}
                        >
                          {siteUrl}
                        </p>
                        {selectedBingSite === siteUrl && (
                          <span
                            className="flex-none text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              fontFamily: bodyFont,
                              color: "oklch(0.44 0.14 162)",
                              backgroundColor: "oklch(0.50 0.175 162 / 0.1)",
                            }}
                          >
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
                <div className="border-t border-border/60 px-5 py-3 flex items-center justify-between gap-3">
                  <p
                    className="text-[11px] text-muted-foreground/50"
                    style={{ fontFamily: bodyFont }}
                  >
                    {selectedBingSite
                      ? "Bing data will be included in your report"
                      : "Select a site to include Bing data in your report"}
                  </p>
                  <button
                    type="button"
                    onClick={handleBingDisconnect}
                    disabled={disconnectingBing}
                    className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors disabled:opacity-40 flex-none"
                    style={{ fontFamily: bodyFont }}
                  >
                    {disconnectingBing ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card px-5 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold text-sm text-foreground mb-1"
                      style={{ fontFamily: bodyFont }}
                    >
                      Add Bing Search + Copilot data
                    </p>
                    <p
                      className="text-xs text-muted-foreground/70"
                      style={{ fontFamily: bodyFont }}
                    >
                      See how your site ranks in Bing and when it appears in Copilot answers.
                    </p>
                    {bingError && (
                      <p
                        className="text-xs text-red-500 mt-2"
                        style={{ fontFamily: bodyFont }}
                      >
                        Connection failed — please try again.
                      </p>
                    )}
                  </div>
                  <a
                    href="/auth/bing"
                    onClick={() => trackEvent("connect_bing_click", { source: "connect" })}
                    className="flex-none inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    style={{ fontFamily: bodyFont }}
                  >
                    Connect Bing
                  </a>
                </div>
              </div>
            )}
          </section>
        )}

        <footer className="mt-16 text-center space-y-1">
          <p
            className="text-[11px] text-muted-foreground/40"
            style={{ fontFamily: bodyFont }}
          >
          With <svg className="inline-block w-3 h-3 text-blue-500 align-baseline" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>{" "}by{" "}
            <a
              href="https://www.lovedby.ai?utm_source=isaisendingmetraffic&utm_medium=referral&utm_content=footer"
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
