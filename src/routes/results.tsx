import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { fetchAITrafficReport } from "@/lib/ga4.functions";
import { saveScan } from "@/lib/tracking.functions";
import type { AITrafficReport } from "@/lib/ai-sources";

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
];

// Real logo images for top AI sources
const AI_LOGOS: Record<string, string> = {
  ChatGPT: "/llm-logos/chatgpt.png",
  Perplexity: "/llm-logos/perplexity.png",
  Claude: "/llm-logos/claude.png",
  Gemini: "/llm-logos/gemini.png",
  DeepSeek: "/llm-logos/deepseek.png",
  Grok: "/llm-logos/grok.png",
  Copilot: "/llm-logos/chatgpt.png",
};

export const Route = createFileRoute("/results")({
  validateSearch: (search) => ({
    propertyId: (search.propertyId as string) || "",
    propertyName: (search.propertyName as string) || "",
    days: Number(search.days) || 30,
  }),
  loaderDeps: ({ search }) => ({
    propertyId: search.propertyId,
    propertyName: search.propertyName,
    days: search.days,
  }),
  head: () => ({
    meta: [
      { title: "Your AI Traffic Report — Is AI Sending Me Traffic?" },
      { name: "description", content: "Your AI traffic analysis results from Google Analytics." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ deps }) => {
    if (!deps.propertyId) {
      return { report: null, error: "no_property" };
    }
    try {
      const result = await fetchAITrafficReport({
        data: {
          propertyId: deps.propertyId,
          propertyName: deps.propertyName,
          days: deps.days,
        },
      });
      // Must await — CF Workers kill unawaited promises after response
      try {
        await saveScan({
          data: { propertyId: deps.propertyId, report: result.report },
        });
      } catch {
        // Never let tracking block the page
      }
      return { report: result.report, error: null };
    } catch (e: unknown) {
      console.error("Report fetch failed:", e);
      return { report: null, error: (e as Error).message || "unknown" };
    }
  },
  pendingComponent: LoadingState,
  component: ResultsPage,
});

const LOADING_MESSAGES = [
  "Checking your Google Analytics...",
  "Looking for AI referral traffic...",
  "Finding top pages...",
  "Crunching the numbers...",
];

function LoadingState() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-5">
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
        style={{ fontFamily: bodyFont }}
      >
        {LOADING_MESSAGES[msgIdx]}
      </p>
    </div>
  );
}

function ResultsPage() {
  const { report, error } = Route.useLoaderData();
  const { propertyId, propertyName, days } = Route.useSearch();
  const [copied, setCopied] = useState<"summary" | null>(null);

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <h1
            className="text-3xl text-foreground tracking-tight"
            style={{ fontFamily: displayFont }}
          >
            Something went wrong
          </h1>
          <p
            className="text-sm text-muted-foreground"
            style={{ fontFamily: bodyFont }}
          >
            {error === "no_property"
              ? "No property selected. Pick one first."
              : "We couldn't fetch your analytics data."}
          </p>
          {error && error !== "no_property" && (
            <p
              className="text-xs font-mono bg-muted rounded-lg px-3 py-2 text-left text-muted-foreground break-all"
            >
              {error}
            </p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <Link
              to="/connect"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
              style={{ fontFamily: bodyFont }}
            >
              Try again
            </Link>
            <Link
              to="/"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground"
              style={{ fontFamily: bodyFont }}
            >
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const periodLabel =
    days === 7 ? "7 days" :
    days === 365 ? "12 months" :
    `${days} days`;

  const shareText =
    report.state === "none"
      ? `I checked whether AI tools are sending traffic to my site (${report.propertyName}). Not yet — but it's worth keeping an eye on. Check yours: isaisendingmetraffic.com`
      : `AI tools sent ${report.totalAISessions.toLocaleString()} visits to ${report.propertyName} in the last ${periodLabel}.${report.topSource ? ` Top source: ${report.topSource.label}.` : ""}${report.topPage ? ` Top page: ${report.topPage.path}.` : ""} Check yours: isaisendingmetraffic.com`;

  const stateBar =
    report.state === "meaningful"
      ? "bg-primary"
      : report.state === "low"
        ? "bg-primary/40"
        : "bg-muted-foreground/20";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-10 md:px-10 md:py-14">

        {/* Top bar: breadcrumb + period switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <a href="/" aria-label="Home">
              <img src="/isaisendingmetraffic-logo-small.png" alt="Is AI Sending Me Traffic?" width={90} height={24} className="h-6 w-auto hover:opacity-80 transition-opacity" />
            </a>
            <p
              className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
              style={{ fontFamily: bodyFont }}
            >
              {report.propertyName} · Last {periodLabel}
            </p>
          </div>

          {/* Period switcher */}
          <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5 print-hide">
            {PERIOD_OPTIONS.map((opt) => (
              <Link
                key={opt.days}
                to="/results"
                search={{ propertyId, propertyName, days: opt.days }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors no-underline ${
                  days === opt.days
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                style={{ fontFamily: bodyFont }}
              >
                {opt.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop two-column grid */}
        <div className="md:grid md:grid-cols-[1fr_340px] md:gap-8 lg:grid-cols-[1fr_380px]">

          {/* LEFT COLUMN */}
          <div>
            {/* Hero verdict card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6 shadow-sm animate-fade-up">
              <div className={`h-1 w-full ${stateBar}`} />
              <HeroCard report={report} periodLabel={periodLabel} />
            </div>

            {/* Trend chart */}
            {report.dailyTrend.length > 0 && (
              <section className="mb-6 animate-fade-up animate-delay-100">
                <h2
                  className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
                  style={{ fontFamily: bodyFont }}
                >
                  {periodLabel} trend
                </h2>
                <TrendChart data={report.dailyTrend} />
              </section>
            )}

            {/* Zero state */}
            {report.state === "none" && (
              <div className="animate-fade-up animate-delay-200">
                <ZeroState topOrganicPages={report.topOrganicPages} />
              </div>
            )}

            {/* What this means */}
            <section className="mb-6 animate-fade-up animate-delay-400">
              <h2
                className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
                style={{ fontFamily: bodyFont }}
              >
                What this means
              </h2>
              <div className="rounded-xl bg-muted/40 border border-border/60 px-5 py-4 space-y-3">
                <WhatThisMeans report={report} periodLabel={periodLabel} />
              </div>
            </section>

            {/* Disclaimer */}
            <p
              className="text-[11px] leading-relaxed text-muted-foreground/50 mb-6"
              style={{ fontFamily: bodyFont }}
            >
              This is likely a partial view. Some AI visits may not be clearly
              attributed in Google Analytics. AI traffic is probably undercounted
              because some visits may appear unattributed or grouped elsewhere.
            </p>

          </div>

          {/* RIGHT COLUMN */}
          <div>
            {/* Source breakdown */}
            {report.sourceBreakdown.length > 0 && (
              <section className="mb-6 animate-fade-up animate-delay-200">
                <h2
                  className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
                  style={{ fontFamily: bodyFont }}
                >
                  By source
                </h2>
                <SourceList sources={report.sourceBreakdown} />
              </section>
            )}

            {/* Top pages */}
            {report.topPages.length > 0 && (
              <section className="mb-6 animate-fade-up animate-delay-300">
                <div className="flex items-baseline justify-between mb-3">
                  <h2
                    className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
                    style={{ fontFamily: bodyFont }}
                  >
                    Pages AI traffic landed on
                  </h2>
                  <span className="text-[11px] text-muted-foreground/40" style={{ fontFamily: bodyFont }}>sessions</span>
                </div>
                <PageList pages={report.topPages} />
              </section>
            )}

            {/* Actions */}
            <section className="mb-8 space-y-2 print-hide animate-fade-up animate-delay-500">
              <h2
                className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4"
                style={{ fontFamily: bodyFont }}
              >
                Actions
              </h2>

              {/* Copy summary */}
              <button
                onClick={async () => {
                  try {
                    // Try modern clipboard API first
                    await navigator.clipboard.writeText(shareText);
                    setCopied("summary");
                    setTimeout(() => setCopied(null), 2000);
                  } catch {
                    try {
                      // Fallback for iOS Safari and older browsers
                      const el = document.createElement("textarea");
                      el.value = shareText;
                      el.setAttribute("readonly", "");
                      el.style.position = "fixed";
                      el.style.left = "-9999px";
                      el.style.opacity = "0";
                      document.body.appendChild(el);
                      const range = document.createRange();
                      range.selectNodeContents(el);
                      const sel = window.getSelection();
                      sel?.removeAllRanges();
                      sel?.addRange(range);
                      el.setSelectionRange(0, shareText.length);
                      document.execCommand("copy");
                      document.body.removeChild(el);
                      setCopied("summary");
                      setTimeout(() => setCopied(null), 2000);
                    } catch { /* silent fail */ }
                  }
                }}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-center gap-3"
                style={{ fontFamily: bodyFont }}
              >
                <span className="text-base leading-none">{copied === "summary" ? "✓" : "📋"}</span>
                <div>
                  <p className="font-medium text-sm">{copied === "summary" ? "Copied!" : "Copy summary"}</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Share as text — includes your key numbers + site link</p>
                </div>
              </button>

              {/* Download PDF */}
              <button
                onClick={() => window.print()}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-center gap-3"
                style={{ fontFamily: bodyFont }}
              >
                <span className="text-base leading-none">📄</span>
                <div>
                  <p className="font-medium text-sm">Download as PDF</p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">Print-ready report you can save or email</p>
                </div>
              </button>

              {/* Check another property */}
              <Link
                to="/connect"
                className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
                style={{ fontFamily: bodyFont }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">🔄</span>
                  <div>
                    <p className="font-medium text-sm">Check another property</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Switch to a different Google Analytics property</p>
                  </div>
                </div>
              </Link>

              {/* Check another site */}
              <a
                href="/auth/google"
                className="block w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left"
                style={{ fontFamily: bodyFont }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base leading-none">🌐</span>
                  <div>
                    <p className="font-medium text-sm">Check another site</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">Connect a different Google account</p>
                  </div>
                </div>
              </a>
            </section>

            {/* Soft CTA */}
            <section className="mb-10 print-hide animate-fade-up animate-delay-600">
              <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] px-6 py-6">
                <p
                  className="text-sm font-semibold text-foreground mb-1"
                  style={{ fontFamily: bodyFont }}
                >
                  Want to grow this channel, not just measure it?
                </p>
                <p
                  className="text-xs text-muted-foreground mb-4"
                  style={{ fontFamily: bodyFont }}
                >
                  LovedByAI helps businesses get discovered by AI tools, automagically.
                </p>
                <a
                  href="https://www.lovedby.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  style={{ fontFamily: bodyFont }}
                >
                  See how it works →
                </a>
              </div>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}

function HeroCard({ report, periodLabel }: { report: AITrafficReport; periodLabel: string }) {
  const headlines: Record<AITrafficReport["state"], string> = {
    meaningful: "AI is actively sending you visitors",
    low: "You may already have AI traffic",
    none: "No AI traffic detected yet",
  };

  return (
    <div className="px-6 py-7">
      {/* Eyebrow */}
      <p
        className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4"
        style={{ fontFamily: bodyFont }}
      >
        AI Referral Traffic · Verdict
      </p>

      {/* Headline */}
      <h1
        className="text-[1.85rem] leading-[1.1] tracking-tight text-foreground mb-5"
        style={{ fontFamily: displayFont }}
      >
        {headlines[report.state]}
      </h1>

      {report.state !== "none" ? (
        <>
          {/* Big number */}
          <div className="mb-6">
            <p
              className="text-7xl leading-none tracking-tight text-primary"
              style={{ fontFamily: displayFont }}
            >
              {report.totalAISessions.toLocaleString()}
            </p>
            <p
              className="text-sm text-muted-foreground mt-1.5"
              style={{ fontFamily: bodyFont }}
            >
              sessions in the last {periodLabel}
              {report.changePercent !== null && report.prevAISessions > 0 && (
                <span
                  className={`ml-2 font-semibold ${
                    report.changePercent > 0
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  ({report.changePercent > 0 ? "+" : ""}
                  {report.changePercent}% vs prev period)
                </span>
              )}
            </p>
          </div>

          {/* Receipt rows */}
          <div className="border-t border-border/60 pt-4 space-y-2.5">
            {report.topSource && (
              <div className="flex justify-between items-center gap-4">
                <span
                  className="text-xs text-muted-foreground/60 uppercase tracking-wider"
                  style={{ fontFamily: bodyFont }}
                >
                  Top source
                </span>
                <span
                  className="flex items-center gap-1.5 text-sm font-semibold text-foreground text-right"
                  style={{ fontFamily: bodyFont }}
                >
                  {AI_LOGOS[report.topSource.label] && (
                    <img src={AI_LOGOS[report.topSource.label]} alt={`${report.topSource.label} logo`} width={16} height={16} className="w-4 h-4 flex-none rounded-sm object-contain" />
                  )}
                  {report.topSource.label}
                </span>
              </div>
            )}
            {report.topPage && (
              <div className="flex justify-between items-baseline gap-4">
                <span
                  className="text-xs text-muted-foreground/60 uppercase tracking-wider flex-none"
                  style={{ fontFamily: bodyFont }}
                >
                  Top page
                </span>
                <span
                  className="text-sm font-semibold text-foreground text-right truncate max-w-[200px]"
                  style={{ fontFamily: bodyFont }}
                >
                  {report.topPage.path}
                </span>
              </div>
            )}
            {report.pagesWithAITraffic > 1 && (
              <div className="flex justify-between items-baseline gap-4">
                <span
                  className="text-xs text-muted-foreground/60 uppercase tracking-wider"
                  style={{ fontFamily: bodyFont }}
                >
                  Pages reached
                </span>
                <span
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: bodyFont }}
                >
                  {report.pagesWithAITraffic} {report.pagesWithAITraffic === 1 ? "page" : "pages"} got AI visits
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-2">
          <p
            className="text-7xl leading-none tracking-tight text-foreground/15"
            style={{ fontFamily: displayFont }}
          >
            0
          </p>
          <p
            className="text-sm text-muted-foreground mt-2"
            style={{ fontFamily: bodyFont }}
          >
            sessions attributed to AI tools in the last {periodLabel}.
          </p>
        </div>
      )}
    </div>
  );
}

function SourceList({
  sources,
}: {
  sources: Array<{
    source: string;
    label: string;
    category: string;
    sessions: number;
    users: number;
  }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_COUNT = 5;
  const max = Math.max(...sources.map((s) => s.sessions), 1);
  const visible = expanded ? sources : sources.slice(0, INITIAL_COUNT);
  const hasMore = sources.length > INITIAL_COUNT;

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {visible.map((s, idx) => (
          <div
            key={s.source}
            className={`relative px-4 py-3.5 ${
              idx < visible.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            {/* Proportional fill bar */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/6 pointer-events-none"
              style={{ width: `${(s.sessions / max) * 100}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {AI_LOGOS[s.label] && (
                  <img src={AI_LOGOS[s.label]} alt={`${s.label} logo`} width={20} height={20} loading="lazy" className="w-5 h-5 flex-none rounded-sm object-contain" />
                )}
                <div>
                  <p
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: bodyFont }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-[11px] text-muted-foreground/70"
                    style={{ fontFamily: bodyFont }}
                  >
                    {s.source}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: bodyFont }}
                >
                  {s.sessions}
                </p>
                <p
                  className="text-[11px] text-muted-foreground/70"
                  style={{ fontFamily: bodyFont }}
                >
                  sessions
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: bodyFont }}
        >
          {expanded ? "Show less" : `See all ${sources.length} sources`}
        </button>
      )}
    </div>
  );
}

function PageList({
  pages,
}: {
  pages: Array<{ path: string; sessions: number }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_COUNT = 5;
  const visible = expanded ? pages : pages.slice(0, INITIAL_COUNT);
  const hasMore = pages.length > INITIAL_COUNT;

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {visible.map((p, idx) => (
          <div
            key={p.path}
            className={`flex items-center justify-between px-4 py-3 ${
              idx < visible.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            <p
              className="text-sm text-muted-foreground truncate mr-4 flex-1"
              style={{ fontFamily: bodyFont }}
            >
              {p.path}
            </p>
            <p
              className="text-sm font-semibold text-foreground whitespace-nowrap"
              style={{ fontFamily: bodyFont }}
            >
              {p.sessions}
            </p>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: bodyFont }}
        >
          {expanded ? "Show less" : `See all ${pages.length} pages`}
        </button>
      )}
    </div>
  );
}

function TrendChart({
  data,
}: {
  data: Array<{ date: string; sessions: number }>;
}) {
  const maxSessions = Math.max(...data.map((d) => d.sessions), 1);

  return (
    <div className="rounded-xl border border-border bg-card px-4 pt-4 pb-3">
      <div className="flex items-end gap-px h-20">
        {data.map((d) => {
          const height = (d.sessions / maxSessions) * 100;
          return (
            <div
              key={d.date}
              className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors"
              style={{ height: `${Math.max(height, 2)}%` }}
              title={`${d.date.slice(4, 6)}/${d.date.slice(6, 8)}: ${d.sessions} sessions`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2.5">
        <p
          className="text-[10px] text-muted-foreground/50"
          style={{ fontFamily: bodyFont }}
        >
          {data[0]?.date?.slice(4, 6)}/{data[0]?.date?.slice(6, 8)}
        </p>
        <p
          className="text-[10px] text-muted-foreground/50"
          style={{ fontFamily: bodyFont }}
        >
          {data[data.length - 1]?.date?.slice(4, 6)}/
          {data[data.length - 1]?.date?.slice(6, 8)}
        </p>
      </div>
    </div>
  );
}

function ZeroState({
  topOrganicPages,
}: {
  topOrganicPages: Array<{ path: string; sessions: number }>;
}) {
  return (
    <section className="mb-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <p
            className="text-sm font-semibold text-foreground mb-1"
            style={{ fontFamily: bodyFont }}
          >
            This is normal for most sites
          </p>
          <p
            className="text-sm text-muted-foreground leading-relaxed"
            style={{ fontFamily: bodyFont }}
          >
            AI traffic is growing quickly but still represents a small share
            of total visits for most businesses. It's also often undercounted —
            some AI-referred visits aren't clearly attributed in Google Analytics.
          </p>
        </div>

        {topOrganicPages.length > 0 && (
          <div>
            <p
              className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
              style={{ fontFamily: bodyFont }}
            >
              Your top organic pages
            </p>
            <div className="space-y-2">
              {topOrganicPages.map((p) => (
                <div
                  key={p.path}
                  className="flex items-center justify-between text-xs"
                >
                  <span
                    className="text-muted-foreground truncate mr-4 flex-1"
                    style={{ fontFamily: bodyFont }}
                  >
                    {p.path}
                  </span>
                  <span
                    className="font-semibold text-foreground"
                    style={{ fontFamily: bodyFont }}
                  >
                    {p.sessions}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border/60">
          <p
            className="text-xs text-muted-foreground mb-1"
            style={{ fontFamily: bodyFont }}
          >
            Want AI tools to start recommending your site?
          </p>
          <a
            href="https://www.lovedby.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            style={{ fontFamily: bodyFont }}
          >
            See how LovedByAI helps →
          </a>
        </div>
      </div>
    </section>
  );
}
function WhatThisMeans({ report, periodLabel }: { report: AITrafficReport; periodLabel: string }) {
  const insights: string[] = [];

  if (report.state === "none") {
    insights.push(
      "We did not detect meaningful AI-referred traffic in your GA4 data for the last " + periodLabel + "."
    );
    insights.push(
      "AI traffic is still early for most businesses. This does not mean AI tools are not aware of your brand."
    );
  } else {
    if (report.topSource) {
      insights.push(
        `${report.topSource.label} appears to be your biggest visible AI traffic source right now.`
      );
    }

    if (report.topPage) {
      insights.push(
        `Most of your AI traffic is landing on ${report.topPage.path}.`
      );
    }

    if (report.pagesWithAITraffic > 1) {
      insights.push(
        `AI traffic reached ${report.pagesWithAITraffic} different pages on your site.`
      );
    }

    if (report.state === "low") {
      insights.push(
        "Even if this number looks small, it may matter. AI traffic is still early for most businesses."
      );
    }

    if (
      report.changePercent !== null &&
      report.changePercent > 0 &&
      report.prevAISessions > 0
    ) {
      insights.push(
        `Your AI traffic grew ${report.changePercent}% compared to the previous ${periodLabel}.`
      );
    }
  }

  insights.push(
    "GA4 does not show all AI-driven visits cleanly, so this is best used as a strong signal, not a perfect count."
  );

  return (
    <>
      {insights.map((insight, i) => (
        <p
          key={i}
          className="text-sm text-muted-foreground leading-relaxed"
          style={{ fontFamily: bodyFont }}
        >
          {insight}
        </p>
      ))}
    </>
  );
}
