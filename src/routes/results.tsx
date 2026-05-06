import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { fetchAITrafficReport } from "@/lib/ga4.functions";
import { fetchBingCopilotData } from "@/lib/bing.functions";
import type { BingCopilotData } from "@/lib/bing.functions";
import { saveScan } from "@/lib/tracking.functions";
import type { AITrafficReport } from "@/lib/ai-sources";
import { trackEvent } from "@/lib/analytics";
import {
  getSessionEmail,
  getDigestStatus,
  subscribeToDigest,
  unsubscribeDigest,
  updateDigestEmail,
} from "@/lib/digest.functions";

// ── GA4 property list (localStorage, written by /connect, read here) ────────
const GA4_PROPS_KEY = "ga4_properties";

type RecentProperty = { propertyId: string; propertyName: string };

function getKnownProperties(): RecentProperty[] {
  try {
    return JSON.parse(localStorage.getItem(GA4_PROPS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

// ── BWT AI Performance CSV helpers ──────────────────────────────────────────
const BWT_CSV_LS_PREFIX = "bwt_ai_perf_";

interface BwtCsvRow {
  dateStr: string; // "YYYY-MM-DD"
  citations: number;
  citedPages: number;
}

function parseBwtCsv(text: string): BwtCsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  const rows: BwtCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // Each cell may be quoted: "1/30/2026 12:00:00 AM","0","0"
    const cells = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cells.length < 3) continue;
    const d = new Date(cells[0]);
    if (isNaN(d.getTime())) continue;
    const dateStr = d.toISOString().split('T')[0];
    const citations = parseInt(cells[1], 10) || 0;
    const citedPages = parseInt(cells[2], 10) || 0;
    rows.push({ dateStr, citations, citedPages });
  }
  return rows;
}

function bwtCsvKey(siteUrl: string) {
  return BWT_CSV_LS_PREFIX + siteUrl;
}

function loadBwtCsvData(siteUrl: string): BwtCsvRow[] | null {
  try {
    const raw = localStorage.getItem(bwtCsvKey(siteUrl));
    if (!raw) return null;
    return JSON.parse(raw) as BwtCsvRow[];
  } catch {
    return null;
  }
}

function saveBwtCsvData(siteUrl: string, rows: BwtCsvRow[]) {
  try {
    localStorage.setItem(bwtCsvKey(siteUrl), JSON.stringify(rows));
  } catch { /* quota exceeded — ignore */ }
}

function sumCsvCitations(rows: BwtCsvRow[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return rows
    .filter((r) => r.dateStr >= cutoffStr)
    .reduce((s, r) => s + r.citations, 0);
}

function csvRowsForPeriod(rows: BwtCsvRow[], days: number): BwtCsvRow[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return rows.filter((r) => r.dateStr >= cutoffStr).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
}

const PERIOD_OPTIONS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "12m", days: 365 },
];

// Local logo images for top AI sources
const LOCAL_LOGOS: Record<string, string> = {
  ChatGPT: "/llm-logos/chatgpt.png",
  Perplexity: "/llm-logos/perplexity.png",
  Claude: "/llm-logos/claude.png",
  Gemini: "/llm-logos/gemini.png",
  DeepSeek: "/llm-logos/deepseek.png",
  Grok: "/llm-logos/grok.png",
};

// Domain mappings for logo.dev fallback
const LOGO_DOMAINS: Record<string, string> = {
  ChatGPT: "chatgpt.com",
  OpenAI: "openai.com",
  Perplexity: "perplexity.ai",
  Claude: "claude.ai",
  Anthropic: "anthropic.com",
  Gemini: "google.com",
  "Google Bard": "google.com",
  "Microsoft Copilot": "microsoft.com",
  Grok: "x.ai",
  DeepSeek: "deepseek.com",
  Mistral: "mistral.ai",
  "Meta AI": "meta.com",
  Kagi: "kagi.com",
  "You.com": "you.com",
  Phind: "phind.com",
  Andi: "andisearch.com",
  iAsk: "iask.ai",
  Exa: "exa.ai",
  Consensus: "consensus.app",
  Poe: "poe.com",
  "Hugging Face": "huggingface.co",
  Pi: "pi.ai",
  Cohere: "cohere.com",
  Writesonic: "writesonic.com",
  Jasper: "jasper.ai",
  "Bing (AI)": "bing.com",
  "Bing Copilot": "bing.com",
  "Brave (AI)": "brave.com",
  "Arc Search": "arc.net",
};

const LOGO_DEV_KEY = "pk_MAd3vkvPQk6dt8pgj2gnOg";

function getLogoUrl(label: string, source?: string): string | null {
  if (LOCAL_LOGOS[label]) return LOCAL_LOGOS[label];
  const domain = LOGO_DOMAINS[label] || source;
  if (domain) return `https://img.logo.dev/${domain}?token=${LOGO_DEV_KEY}&size=64&format=png`;
  return null;
}

function isExternalLogo(label: string): boolean {
  return !LOCAL_LOGOS[label];
}

// ---------------------------------------------------------------------------
// Demo data — returned when propertyId === "demo"
// ---------------------------------------------------------------------------

function getDemoReport(days: number): AITrafficReport {
  // Fixed "today" for demo so dates are always stable
  const today = new Date("2026-04-27T12:00:00Z");

  // Build daily trend deterministically (no randomness)
  const baseAvg = days <= 7 ? 87 : days <= 30 ? 128 : days <= 90 ? 138 : 145;
  const dailyTrend: Array<{ date: string; sessions: number }> = [];
  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - days + 1);

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const dow = d.getUTCDay();
    const weekendFactor = dow === 0 || dow === 6 ? 0.68 : 1.0;
    const trendFactor = 0.72 + (i / Math.max(days - 1, 1)) * 0.56;
    const waveFactor = 1 + 0.18 * Math.sin((i / 6.5) * Math.PI);
    const sessions = Math.max(0, Math.round(baseAvg * weekendFactor * trendFactor * waveFactor));
    dailyTrend.push({ date: d.toISOString().slice(0, 10).replace(/-/g, ""), sessions });
  }

  const totalAISessions = dailyTrend.reduce((s, d) => s + d.sessions, 0);
  const prevAISessions = Math.round(totalAISessions * 0.63);
  const changePercent = Math.round(((totalAISessions - prevAISessions) / prevAISessions) * 100);

  const endDateStr = today.toISOString().slice(0, 10);
  const startDateStr = startDate.toISOString().slice(0, 10);
  const prevEnd = new Date(startDate);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - days + 1);

  const pct = (p: number) => Math.round(totalAISessions * p);
  const totalAIConversions = Math.round(totalAISessions * 0.021);
  const aiConversionRate: number | null = totalAISessions > 0 ? totalAIConversions / totalAISessions : null;

  return {
    propertyId: "demo",
    propertyName: "TechBlog Example",
    days,
    dateRange: { start: startDateStr, end: endDateStr },
    prevDateRange: {
      start: prevStart.toISOString().slice(0, 10),
      end: prevEnd.toISOString().slice(0, 10),
    },
    totalAISessions,
    prevAISessions,
    totalAIUsers: pct(0.889),
    totalAINewUsers: pct(0.758),
    totalAIConversions,
    aiConversionRate,
    changePercent,
    topSource: { label: "ChatGPT", sessions: pct(0.479) },
    topPage: { path: "/blog/what-is-machine-learning", sessions: pct(0.232) },
    pagesWithAITraffic: 14,
    sourceBreakdown: [
      { source: "chatgpt.com", label: "ChatGPT", category: "known", sessions: pct(0.479), users: pct(0.426), conversions: Math.round(pct(0.479) * 0.021) },
      { source: "perplexity.ai", label: "Perplexity", category: "known", sessions: pct(0.220), users: pct(0.197), conversions: Math.round(pct(0.220) * 0.028) },
      { source: "claude.ai", label: "Claude", category: "known", sessions: pct(0.141), users: pct(0.128), conversions: Math.round(pct(0.141) * 0.020) },
      { source: "gemini.google.com", label: "Gemini", category: "known", sessions: pct(0.081), users: pct(0.073), conversions: Math.round(pct(0.081) * 0.015) },
      { source: "grok.com", label: "Grok", category: "known", sessions: pct(0.037), users: pct(0.034), conversions: Math.round(pct(0.037) * 0.012) },
      { source: "deepseek.com", label: "DeepSeek", category: "known", sessions: pct(0.024), users: pct(0.022), conversions: Math.round(pct(0.024) * 0.011) },
      { source: "copilot.microsoft.com", label: "Microsoft Copilot", category: "known", sessions: pct(0.011), users: pct(0.010), conversions: Math.round(pct(0.011) * 0.010) },
      { source: "edgeservices.bing.com", label: "Bing (AI)", category: "possible", sessions: pct(0.007), users: pct(0.006), conversions: Math.round(pct(0.007) * 0.008) },
    ],
    topPages: [
      { path: "/blog/what-is-machine-learning", sessions: pct(0.232) },
      { path: "/blog/gpt-4-explained", sessions: pct(0.168) },
      { path: "/blog/best-ai-tools-2024", sessions: pct(0.135) },
      { path: "/blog/prompt-engineering-guide", sessions: pct(0.101) },
      { path: "/blog/ai-vs-ml-difference", sessions: pct(0.063) },
      { path: "/blog/chatgpt-use-cases", sessions: pct(0.052) },
      { path: "/", sessions: pct(0.042) },
      { path: "/blog/llm-explained", sessions: pct(0.035) },
      { path: "/blog/neural-networks-beginners", sessions: pct(0.029) },
      { path: "/blog/top-ai-companies-2025", sessions: pct(0.023) },
    ],
    dailyTrend,
    topOrganicPages: [],
    conversionEvents: [
      { eventName: "sign_up", conversions: Math.round(totalAIConversions * 0.44) },
      { eventName: "generate_lead", conversions: Math.round(totalAIConversions * 0.28) },
      { eventName: "purchase", conversions: Math.round(totalAIConversions * 0.16) },
      { eventName: "contact", conversions: Math.round(totalAIConversions * 0.08) },
      { eventName: "schedule_demo", conversions: Math.round(totalAIConversions * 0.04) },
    ].filter((e) => e.conversions > 0),
    state: "meaningful",
    domain: "techblog-example.com",
  };
}

// ---------------------------------------------------------------------------

export const Route = createFileRoute("/results")({
  validateSearch: (search) => ({
    propertyId: (search.propertyId as string) || "",
    propertyName: (search.propertyName as string) || "",
    days: Number(search.days) || 30,
    bingSiteUrl: (search.bingSiteUrl as string) || "",
  }),
  loaderDeps: ({ search }) => ({
    propertyId: search.propertyId,
    propertyName: search.propertyName,
    days: search.days,
    bingSiteUrl: search.bingSiteUrl,
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
      return { report: null, error: "no_property", bingCopilot: null };
    }
    if (deps.propertyId === "demo") {
      return { report: getDemoReport(deps.days), error: null, bingCopilot: null };
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

      let bingCopilot: BingCopilotData | null = null;
      if (deps.bingSiteUrl) {
        try {
          const result = await fetchBingCopilotData({
            data: { siteUrl: deps.bingSiteUrl, days: deps.days },
          });
          bingCopilot = result.data;
        } catch {
          // non-fatal
        }
      }

      return { report: result.report, error: null, bingCopilot };
    } catch (e: unknown) {
      console.error("Report fetch failed:", e);
      return { report: null, error: (e as Error).message || "unknown", bingCopilot: null };
    }
  },
  component: ResultsPage,
});

const LOADING_MESSAGES = [
  "Checking your Google Analytics...",
  "Looking for AI referral traffic...",
  "Finding top pages...",
  "Crunching the numbers...",
];

const AI_GRID_SIZE = 16;

function formatPath(path: string): string {
  return path === "/" ? "/ (homepage)" : path;
}

function LoadingState() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [activeNodes, setActiveNodes] = useState<Set<number>>(() => new Set([0, 3, 5, 9, 12, 15]));

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNodes((prev) => {
        const next = new Set(prev);
        const activeArr = [...next];
        // deactivate 0–2 random nodes (keep at least 3)
        const toOff = Math.floor(Math.random() * 3);
        for (let i = 0; i < toOff && activeArr.length > 3; i++) {
          next.delete(activeArr[Math.floor(Math.random() * activeArr.length)]);
        }
        // activate 1–3 random nodes
        const toOn = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < toOn && next.size < 11; i++) {
          next.add(Math.floor(Math.random() * AI_GRID_SIZE));
        }
        return next;
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-7">
      {/* AI neural grid */}
      <div className="relative flex flex-col items-center gap-5">
        {/* Background glow */}
        <div
          className="absolute -inset-10 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: "oklch(0.50 0.175 162 / 0.07)" }}
        />
        {/* 4×4 node grid */}
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
        {/* Scan beam */}
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

      {/* Message */}
      <p
        className="text-sm text-muted-foreground text-center"
        style={{ fontFamily: bodyFont }}
      >
        {LOADING_MESSAGES[msgIdx]}
      </p>
    </div>
  );
}

// ── Weekly Digest Card ────────────────────────────────────────────────────────

type DigestStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "not_subscribed"; googleEmail: string | null; hasRefreshToken: boolean }
  | { state: "subscribed"; digestEmail: string; subscriptionId: string }
  | { state: "no_auth" };

function DigestCard({
  propertyId,
  propertyName,
  knownProperties,
  isDemo,
}: {
  propertyId: string;
  propertyName: string;
  knownProperties: RecentProperty[];
  isDemo: boolean;
}) {
  const [status, setStatus] = useState<DigestStatus>({ state: "idle" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<"subscribe" | "change_email">("subscribe");
  const [emailInput, setEmailInput] = useState(isDemo ? "webmaster@techblog.com" : "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [unsubConfirm, setUnsubConfirm] = useState(false);
  const [unsubbing, setUnsubbing] = useState(false);
  const [selectedPropIds, setSelectedPropIds] = useState<string[]>([propertyId]);
  const [editPropStatuses, setEditPropStatuses] = useState<Record<string, { subscribed: boolean; subscriptionId?: string }>>({});
  const [loadingEditProps, setLoadingEditProps] = useState(false);

  const demoProps: RecentProperty[] = [
    { propertyId: "demo", propertyName: "TechBlog Example" },
    { propertyId: "demo-2", propertyName: "My SaaS Blog" },
    { propertyId: "demo-3", propertyName: "Portfolio Site" },
  ];

  const allProps: RecentProperty[] = isDemo ? demoProps : (() => {
    const seen = new Set<string>();
    const list: RecentProperty[] = [];
    for (const p of knownProperties) {
      if (!seen.has(p.propertyId)) { seen.add(p.propertyId); list.push(p); }
    }
    if (!seen.has(propertyId)) list.unshift({ propertyId, propertyName });
    return list;
  })();

  const load = useCallback(async () => {
    setStatus({ state: "loading" });
    try {
      const [sessionRes, statusRes] = await Promise.all([
        getSessionEmail(),
        getDigestStatus({ data: { propertyId } }),
      ]);
      if (!sessionRes.googleEmail) {
        setStatus({ state: "no_auth" });
        return;
      }
      if (statusRes.subscribed && statusRes.digestEmail && statusRes.subscriptionId) {
        setStatus({
          state: "subscribed",
          digestEmail: statusRes.digestEmail,
          subscriptionId: statusRes.subscriptionId,
        });
      } else {
        setStatus({
          state: "not_subscribed",
          googleEmail: sessionRes.googleEmail,
          hasRefreshToken: sessionRes.hasRefreshToken,
        });
      }
    } catch {
      setStatus({ state: "not_subscribed", googleEmail: null, hasRefreshToken: false });
    }
  }, [propertyId]);

  useEffect(() => {
    if (!isDemo) load();
  }, [isDemo, load]);

  function openSubscribeModal() {
    setEditMode("subscribe");
    setSaveError(null);
    setSaveSuccess(false);
    setSelectedPropIds([propertyId]);
    setEmailInput(
      status.state === "not_subscribed" ? (status.googleEmail ?? "") : ""
    );
    setModalOpen(true);
  }

  async function openEditModal() {
    setEditMode("change_email");
    setSaveError(null);
    setSaveSuccess(false);
    setEmailInput(status.state === "subscribed" ? status.digestEmail : "");
    setLoadingEditProps(true);
    setModalOpen(true);
    try {
      const results = await Promise.all(
        allProps.map((p) => getDigestStatus({ data: { propertyId: p.propertyId } }).then((r) => ({ ...r, propertyId: p.propertyId })))
      );
      const statuses: Record<string, { subscribed: boolean; subscriptionId?: string }> = {};
      const preSelected: string[] = [];
      for (const r of results) {
        statuses[r.propertyId] = { subscribed: !!r.subscribed, subscriptionId: r.subscriptionId ?? undefined };
        if (r.subscribed) preSelected.push(r.propertyId);
      }
      setEditPropStatuses(statuses);
      setSelectedPropIds(preSelected);
    } catch {
      // fallback: just current property
      setEditPropStatuses({ [propertyId]: { subscribed: true, subscriptionId: status.state === "subscribed" ? status.subscriptionId : undefined } });
      setSelectedPropIds([propertyId]);
    } finally {
      setLoadingEditProps(false);
    }
  }

  async function handleSave() {
    setSaveError(null);
    setSaving(true);
    try {
      if (editMode === "subscribe") {
        const propsToSub = allProps.filter((p) => selectedPropIds.includes(p.propertyId));
        await Promise.all(
          propsToSub.map((p) =>
            subscribeToDigest({ data: { digestEmail: emailInput, propertyId: p.propertyId, propertyName: p.propertyName } })
          )
        );
        trackEvent("digest_subscribed", { property_id: propertyId, count: propsToSub.length });
      } else {
        // Edit mode: handle subscribe/unsubscribe for each property + update email
        const ops: Promise<unknown>[] = [];
        for (const p of allProps) {
          const prev = editPropStatuses[p.propertyId];
          const nowSelected = selectedPropIds.includes(p.propertyId);
          if (prev?.subscribed && nowSelected && prev.subscriptionId) {
            // was subscribed and still is — update email
            ops.push(updateDigestEmail({ data: { subscriptionId: prev.subscriptionId, newEmail: emailInput } }));
          } else if (prev?.subscribed && !nowSelected && prev.subscriptionId) {
            // was subscribed and removed — unsubscribe
            ops.push(unsubscribeDigest({ data: { subscriptionId: prev.subscriptionId } }));
          } else if (!prev?.subscribed && nowSelected) {
            // newly added — subscribe
            ops.push(subscribeToDigest({ data: { digestEmail: emailInput, propertyId: p.propertyId, propertyName: p.propertyName } }));
          }
        }
        await Promise.all(ops);
        trackEvent("digest_edited", { property_id: propertyId });
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setModalOpen(false);
        setSaveSuccess(false);
        load();
      }, 1200);
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "Something went wrong";
      setSaveError(
        msg === "not_authenticated"
          ? "Please reconnect Google Analytics first."
          : msg === "Invalid email address"
            ? "Please enter a valid email."
            : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUnsubscribe() {
    if (status.state !== "subscribed") return;
    setUnsubbing(true);
    try {
      await unsubscribeDigest({ data: { subscriptionId: status.subscriptionId } });
      trackEvent("digest_unsubscribed", { property_id: propertyId });
      setUnsubConfirm(false);
      load();
    } catch {
      // non-fatal, just close
      setUnsubConfirm(false);
    } finally {
      setUnsubbing(false);
    }
  }

  if (isDemo) {
    return (
      <>
        <button
          type="button"
          onClick={() => { setEditMode("subscribe"); setModalOpen(true); }}
          className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-start gap-3 cursor-pointer"
          style={{ fontFamily: bodyFont }}
        >
          <span className="text-base leading-none mt-0.5">📬</span>
          <div>
            <p className="font-medium text-sm" style={{ fontFamily: bodyFont }}>Get weekly AI traffic emails <span className="inline-block align-middle bg-primary/10 text-primary text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full ml-1">New</span></p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5" style={{ fontFamily: bodyFont }}>
              AI highlights every Monday — straight to your inbox
            </p>
          </div>
        </button>

        {/* Demo subscribe modal */}
        {modalOpen && typeof document !== "undefined" && createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setSaveError(null); } }}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6"
              style={{ backgroundColor: "#ffffff", isolation: "isolate" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: bodyFont }}>
                Get weekly email report
              </h3>
              <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: bodyFont }}>
                Pick properties to include. Sent every Monday at 9am UTC.
              </p>

              <div className="mb-4">
                <span className="text-xs font-medium text-muted-foreground block mb-2" style={{ fontFamily: bodyFont }}>Properties</span>
                <div className="space-y-1.5">
                  {allProps.map((p) => (
                    <label
                      key={p.propertyId}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 cursor-pointer hover:bg-muted/70 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropIds.includes(p.propertyId)}
                        onChange={(e) => {
                          setSelectedPropIds((prev) =>
                            e.target.checked ? [...prev, p.propertyId] : prev.filter((id) => id !== p.propertyId)
                          );
                        }}
                        className="accent-primary"
                      />
                      <span className="text-xs font-medium text-foreground truncate" style={{ fontFamily: bodyFont }}>
                        {p.propertyName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block mb-1.5">
                <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: bodyFont }}>Email address</span>
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => { setEmailInput(e.target.value); setSaveError(null); }}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
                style={{ fontFamily: bodyFont }}
                autoFocus
              />

              {saveError && (
                <p className="text-xs text-red-500 mb-3 -mt-2" style={{ fontFamily: bodyFont }}>{saveError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setSaveError(null); }}
                  className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: bodyFont }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setSaveError(null); }}
                  className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors text-center cursor-pointer"
                  style={{ fontFamily: bodyFont }}
                >
                  Subscribe
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground/40 text-center mt-4" style={{ fontFamily: bodyFont }}>
                Sent every Monday · Unsubscribe any time
              </p>
            </div>
          </div>
        , document.body)}
      </>
    );
  }

  if (status.state === "idle" || status.state === "loading") {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-4 py-3 flex items-center gap-3 animate-pulse">
        <span className="text-base leading-none opacity-40">📬</span>
        <div className="space-y-1.5 flex-1">
          <div className="h-3 rounded bg-muted w-1/2" />
          <div className="h-2.5 rounded bg-muted w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Card */}
      {status.state === "subscribed" ? (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-3">
          <div className="flex items-start gap-3">
            <span className="text-base leading-none mt-0.5">📬</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-medium text-sm text-foreground" style={{ fontFamily: bodyFont }}>
                  Email report active
                </p>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full">
                  Monday 9am
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/70 truncate" style={{ fontFamily: bodyFont }}>
                Sending to {status.digestEmail}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={openEditModal}
                  className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline underline-offset-2 cursor-pointer"
                  style={{ fontFamily: bodyFont }}
                >
                  Edit
                </button>
                <span className="text-muted-foreground/30 text-[11px]">·</span>
                <button
                  type="button"
                  onClick={() => setUnsubConfirm(true)}
                  className="text-[11px] text-muted-foreground/60 hover:text-destructive transition-colors underline underline-offset-2 cursor-pointer"
                  style={{ fontFamily: bodyFont }}
                >
                  Unsubscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openSubscribeModal}
          disabled={status.state === "not_subscribed" && !status.hasRefreshToken}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: bodyFont }}
        >
          <span className="text-base leading-none">📬</span>
          <div>
            <p className="font-medium text-sm">Get weekly AI traffic emails <span className="inline-block align-middle bg-primary/10 text-primary text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full ml-1">New</span></p>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              {status.state === "not_subscribed" && !status.hasRefreshToken
                ? "Reconnect Google Analytics to subscribe"
                : "AI highlights every Monday — straight to your inbox"}
            </p>
          </div>
        </button>
      )}

      {/* Subscribe / change-email modal */}
      {modalOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setModalOpen(false); setSaveError(null); } }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6"
            style={{ backgroundColor: "#ffffff", isolation: "isolate" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="text-lg font-semibold text-foreground mb-1"
              style={{ fontFamily: bodyFont }}
            >
              {editMode === "subscribe" ? "Get weekly email report" : "Edit digest"}
            </h3>
            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: bodyFont }}>
              {editMode === "subscribe"
                ? "Pick properties to include. Sent every Monday at 9am UTC."
                : "Change your email or update which properties are included."}
            </p>

            {/* Property selection */}
            {editMode === "subscribe" ? (
              <div className="mb-4">
                <span className="text-xs font-medium text-muted-foreground block mb-2" style={{ fontFamily: bodyFont }}>
                  Properties
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {allProps.map((p) => (
                    <label
                      key={p.propertyId}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 cursor-pointer hover:bg-muted/70 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropIds.includes(p.propertyId)}
                        onChange={(e) => {
                          if (p.propertyId === propertyId) return;
                          setSelectedPropIds((prev) =>
                            e.target.checked ? [...prev, p.propertyId] : prev.filter((id) => id !== p.propertyId)
                          );
                        }}
                        disabled={p.propertyId === propertyId}
                        className="accent-primary"
                      />
                      <span className="text-xs font-medium text-foreground truncate" style={{ fontFamily: bodyFont }}>
                        {p.propertyName}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <span className="text-xs font-medium text-muted-foreground block mb-2" style={{ fontFamily: bodyFont }}>
                  Properties
                </span>
                {loadingEditProps ? (
                  <div className="px-3 py-3 rounded-lg bg-muted/50 border border-border/60">
                    <span className="text-xs text-muted-foreground/60" style={{ fontFamily: bodyFont }}>Loading…</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {allProps.map((p) => (
                      <label
                        key={p.propertyId}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 cursor-pointer hover:bg-muted/70 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPropIds.includes(p.propertyId)}
                          onChange={(e) => {
                            setSelectedPropIds((prev) =>
                              e.target.checked ? [...prev, p.propertyId] : prev.filter((id) => id !== p.propertyId)
                            );
                          }}
                          className="accent-primary"
                        />
                        <span className="text-xs font-medium text-foreground truncate" style={{ fontFamily: bodyFont }}>
                          {p.propertyName}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label className="block mb-1.5">
              <span className="text-xs font-medium text-muted-foreground" style={{ fontFamily: bodyFont }}>
                Email address
              </span>
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setSaveError(null); }}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/40 mb-4"
              style={{ fontFamily: bodyFont }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              autoFocus
            />

            {saveError && (
              <p className="text-xs text-red-500 mb-3 -mt-2" style={{ fontFamily: bodyFont }}>{saveError}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setSaveError(null); }}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !emailInput.trim() || saveSuccess}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                style={{ fontFamily: bodyFont }}
              >
                {saveSuccess ? "✓ Saved!" : saving ? "Saving…" : editMode === "subscribe" ? "Subscribe" : "Save"}
              </button>
            </div>

            {editMode === "subscribe" && (
              <p className="text-[10px] text-muted-foreground/40 text-center mt-4" style={{ fontFamily: bodyFont }}>
                Sent every Monday · Unsubscribe any time
              </p>
            )}

          </div>
        </div>
      , document.body)}

      {/* Unsubscribe confirm modal */}
      {unsubConfirm && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setUnsubConfirm(false); }}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-border bg-card shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-sm text-foreground mb-1" style={{ fontFamily: bodyFont }}>
              Stop email reports?
            </p>
            <p className="text-xs text-muted-foreground mb-5" style={{ fontFamily: bodyFont }}>
              You won't receive the Monday AI traffic report for {propertyName} anymore.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUnsubConfirm(false)}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                style={{ fontFamily: bodyFont }}
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={handleUnsubscribe}
                disabled={unsubbing}
                className="flex-1 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-60 cursor-pointer"
                style={{ fontFamily: bodyFont }}
              >
                {unsubbing ? "Stopping…" : "Unsubscribe"}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}

function ResultsPage() {
  const { report, error, bingCopilot } = Route.useLoaderData();
  const { propertyId, propertyName, days, bingSiteUrl } = Route.useSearch();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<"summary" | "error" | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState<number | null>(null);
  const [recentProps, setRecentProps] = useState<RecentProperty[]>([]);
  const [showPropDropdown, setShowPropDropdown] = useState(false);
  const propDropdownRef = useRef<HTMLDivElement>(null);
  const loadedKeys = useRef<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null); // kept for future BWT re-enable

  const mergedSources = useMemo(() => {
    if (!report) return [];
    return report.sourceBreakdown.map((s) => ({ ...s, bwtCitations: undefined as number | undefined }));
  }, [report]);

  // Load the property list written by /connect
  useEffect(() => {
    setRecentProps(getKnownProperties());
  }, [propertyId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showPropDropdown) return;
    function handleClick(e: MouseEvent) {
      if (propDropdownRef.current && !propDropdownRef.current.contains(e.target as Node)) {
        setShowPropDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPropDropdown]);

  useEffect(() => {
    if (!report || error || !propertyId || propertyId === "demo") return;
    try {
      const visited: string[] = JSON.parse(localStorage.getItem("visited_ga4_properties") ?? "[]");
      if (!visited.includes(propertyId)) {
        localStorage.setItem("visited_ga4_properties", JSON.stringify([...visited, propertyId]));
      }
    } catch { /* best-effort */ }
  }, [propertyId, report, error]);

  useEffect(() => {
    if (!report || error) return;
    loadedKeys.current.add(`${propertyId}:${days}`);
    trackEvent("report_viewed", {
      days_selected: days,
      result_state: report.state,
      has_ai_traffic: report.totalAISessions > 0,
      ai_sessions: report.totalAISessions,
      ai_sources_count: report.sourceBreakdown.length,
      top_ai_source: report.topSource?.label,
    });
  }, [days, error, report]);

  if (error || !report) {
    // Sanitise error: strip HTML tags (e.g. Google 429 error pages) and cap length
    const safeError = (() => {
      if (!error || error === "no_property") return error;
      const stripped = error.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      return stripped.length > 300 ? stripped.slice(0, 297) + "…" : stripped;
    })();

    const is429 = error?.includes("429") || error?.includes("rate limit");

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-xs">
          <h1
            className="text-3xl text-foreground tracking-tight"
            style={{ fontFamily: displayFont }}
          >
            {is429 ? "Too many requests" : "Something went wrong"}
          </h1>
          <p
            className="text-sm text-muted-foreground"
            style={{ fontFamily: bodyFont }}
          >
            {safeError === "no_property"
              ? "No property selected. Pick one first."
              : is429
                ? "Google Analytics is temporarily throttling requests. Wait a minute, then try again."
                : "We couldn't fetch your analytics data."}
          </p>
          {safeError && safeError !== "no_property" && !is429 && (
            <p
              className="text-xs font-mono bg-muted rounded-lg px-3 py-2 text-left text-muted-foreground break-all"
            >
              {safeError}
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

  const shareText = (() => {
    if (report.state === "none") {
      return `I checked whether AI tools are sending traffic to my site (${report.propertyName}). Not yet, but it's worth keeping an eye on. Check yours: isaisendingmetraffic.com`;
    }
    const growth = report.changePercent !== null
      ? ` (${report.changePercent >= 0 ? "+" : ""}${Math.round(report.changePercent)}% vs prev period)`
      : "";
    const topSources = report.sourceBreakdown.slice(0, 2);
    const sourceLine = topSources.length > 0
      ? ` Top source: ${topSources[0].label} with ${topSources[0].sessions.toLocaleString("en-US")} visits${topSources[1] ? `, then ${topSources[1].label} with ${topSources[1].sessions.toLocaleString("en-US")}` : ""}.`
      : "";
    const topPgs = report.topPages.slice(0, 2);
    const pageLine = topPgs.length > 0
      ? ` Top page: ${formatPath(topPgs[0].path)} with ${topPgs[0].sessions.toLocaleString("en-US")} visits${topPgs[1] ? `, then ${formatPath(topPgs[1].path)} with ${topPgs[1].sessions.toLocaleString("en-US")}` : ""}.`
      : "";
    return `AI tools sent ${report.totalAISessions.toLocaleString("en-US")} visits to ${report.propertyName} in the last ${periodLabel}${growth}.${sourceLine}${pageLine} Data from isaisendingmetraffic.com`;
  })();

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
          <div className="flex items-center gap-2.5">
            <a
              href="/"
              aria-label="Home"
              className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors flex-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </a>

            {/* Property switcher — dropdown when there are multiple recent properties */}
            {recentProps.length > 1 ? (
              <div ref={propDropdownRef} className="relative print-hide">
                <button
                  type="button"
                  onClick={() => setShowPropDropdown((v) => !v)}
                  className="flex items-center gap-1 text-[11px] tracking-widest uppercase text-muted-foreground/60 hover:text-muted-foreground transition-colors cursor-pointer group"
                  style={{ fontFamily: bodyFont }}
                >
                  {report?.propertyName ?? propertyName} · Last {periodLabel}
                  <svg
                    className={`w-3 h-3 transition-transform ${showPropDropdown ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {showPropDropdown && (
                  <div className="absolute top-full left-0 mt-1.5 z-30 min-w-[220px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    {recentProps.map((rp) => (
                      <button
                        key={rp.propertyId}
                        type="button"
                        onClick={() => {
                          setShowPropDropdown(false);
                          if (rp.propertyId === propertyId) return;
                          trackEvent("recent_property_switched", { source: "results_dropdown" });
                          void navigate({ to: "/results", search: { propertyId: rp.propertyId, propertyName: rp.propertyName, days, bingSiteUrl } });
                        }}
                        className={`block w-full text-left px-4 py-2.5 text-xs hover:bg-muted/50 transition-colors ${rp.propertyId === propertyId ? "text-primary font-semibold" : "text-muted-foreground"}`}
                        style={{ fontFamily: bodyFont }}
                      >
                        {rp.propertyName}
                        {rp.propertyId === propertyId && (
                          <span className="ml-1.5 text-[10px] text-primary/60">current</span>
                        )}
                      </button>
                    ))}
                    <div className="border-t border-border/60 px-4 py-2">
                      <Link
                        to="/connect"
                        onClick={() => {
                          setShowPropDropdown(false);
                          trackEvent("check_another_property_clicked", { source: "results_dropdown" });
                        }}
                        className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        style={{ fontFamily: bodyFont }}
                      >
                        + Add another property
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p
                className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
                style={{ fontFamily: bodyFont }}
              >
                {report?.propertyName ?? propertyName} · Last {periodLabel}
              </p>
            )}

            {/* Print-only static label */}
            <p
              className="hidden text-[11px] tracking-widest uppercase text-muted-foreground/60 print-show"
              style={{ fontFamily: bodyFont }}
            >
              {report?.propertyName ?? propertyName} · Last {periodLabel}
            </p>
          </div>

          {/* Period switcher */}
          <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5 print-hide">
            {PERIOD_OPTIONS.map((opt) =>
              opt.days === days ? (
                <span
                  key={opt.days}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-card text-foreground shadow-sm"
                  style={{ fontFamily: bodyFont }}
                >
                  {opt.label}
                </span>
              ) : (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => {
                    trackEvent("results_period_changed", {
                      from_days: days,
                      to_days: opt.days,
                    });
                    const isCached = loadedKeys.current.has(`${propertyId}:${opt.days}`);
                    if (!isCached) {
                      setLoadingPeriod(opt.days);
                      setTimeout(() => setLoadingPeriod(null), 5000);
                    }
                    void navigate({ to: "/results", search: { propertyId, propertyName, days: opt.days, bingSiteUrl } });
                  }}
                  className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5"
                  style={{ fontFamily: bodyFont }}
                >
                  {loadingPeriod === opt.days && (
                    <span className="w-2.5 h-2.5 rounded-full border border-primary border-t-transparent animate-spin inline-block flex-none" />
                  )}
                  {opt.label}
                </button>
              )
            )}
          </div>

          {/* Period-switch loading: spinner shown on clicked button; pendingComponent handles the full loading screen */}
        </div>

        {/* Desktop two-column grid */}
        <div className={`md:grid md:grid-cols-[1fr_340px] md:gap-8 md:items-start lg:grid-cols-[1fr_380px] transition-opacity duration-200${loadingPeriod !== null ? ' opacity-50 pointer-events-none select-none' : ''}`}>

          {/* LEFT COLUMN */}
          <div>
            {/* Hero verdict card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6 shadow-sm animate-fade-up">
              <div className={`h-1 w-full ${stateBar}`} />
              <HeroCard report={report} periodLabel={periodLabel} />
            </div>

            {/* Mobile only: source + pages right after hero */}
            <div className="md:hidden">
              {mergedSources.length > 0 && (
                <section className="mb-6 animate-fade-up animate-delay-150">
                  <h2
                    className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
                    style={{ fontFamily: bodyFont }}
                  >
                    By LLM source · Last {periodLabel}
                  </h2>
                  <SourceList sources={mergedSources} />
                </section>
              )}
              {report.topPages.length > 0 && (
                <section className="mb-6 animate-fade-up animate-delay-200">
                  <div className="flex items-baseline justify-between mb-3">
                    <h2
                      className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
                      style={{ fontFamily: bodyFont }}
                    >
                      Pages AI traffic · Last {periodLabel}
                    </h2>
                    <span className="text-[11px] text-muted-foreground/40" style={{ fontFamily: bodyFont }}>sessions</span>
                  </div>
                  <PageList pages={report.topPages} />
                </section>
              )}
            </div>

            {/* Trend chart */}
            {report.dailyTrend.some(d => d.sessions > 0) && (
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

            {/* Conversion events table */}
            {report.conversionEvents.length > 0 && (
              <ConversionEventsTable events={report.conversionEvents} periodLabel={periodLabel} />
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
                Summary in plain words
              </h2>
              <div className="rounded-xl bg-muted/40 border border-border/60 px-5 py-4">
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
            {/* Source breakdown + pages: desktop only (shown above hero on mobile) */}
            <div className="hidden md:block">
              {mergedSources.length > 0 && (
                <section className="mb-6 animate-fade-up animate-delay-200">
                  <h2
                    className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
                    style={{ fontFamily: bodyFont }}
                  >
                    By LLM source · Last {periodLabel}
                  </h2>
                  <SourceList sources={mergedSources} />
                </section>
              )}

              {report.topPages.length > 0 && (
                <section className="mb-6 animate-fade-up animate-delay-300">
                  <div className="flex items-baseline justify-between mb-3">
                    <h2
                      className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
                      style={{ fontFamily: bodyFont }}
                    >
                      Pages AI traffic · Last {periodLabel}
                    </h2>
                    <span className="text-[11px] text-muted-foreground/40" style={{ fontFamily: bodyFont }}>sessions</span>
                  </div>
                  <PageList pages={report.topPages} />
                </section>
              )}
            </div>

            {/* Actions */}
            <section className="mb-8 space-y-2 print-hide animate-fade-up animate-delay-500">
              <h2
                className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4"
                style={{ fontFamily: bodyFont }}
              >
                Actions
              </h2>

              {/* Weekly digest */}
              <DigestCard
                propertyId={propertyId}
                propertyName={report.propertyName ?? propertyName}
                knownProperties={recentProps}
                isDemo={propertyId === "demo"}
              />

              {/* Copy summary */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    // 1. Clipboard API
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(shareText);
                      trackEvent("summary_copy_clicked", { status: "success" });
                      setCopied("summary");
                      setTimeout(() => setCopied(null), 2000);
                      return;
                    }
                    // 2. execCommand fallback
                    const el = document.createElement("textarea");
                    el.value = shareText;
                    el.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
                    document.body.appendChild(el);
                    el.focus();
                    el.select();
                    el.setSelectionRange(0, shareText.length);
                    const ok = document.execCommand("copy");
                    document.body.removeChild(el);
                    if (ok) {
                      trackEvent("summary_copy_clicked", { status: "success" });
                      setCopied("summary");
                      setTimeout(() => setCopied(null), 2000);
                      return;
                    }
                    throw new Error("All copy methods failed");
                  } catch {
                    trackEvent("summary_copy_clicked", { status: "error" });
                    setCopied("error");
                    setTimeout(() => setCopied(null), 3000);
                  }
                }}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-center gap-3 cursor-pointer"
                style={{ fontFamily: bodyFont }}
              >
                <span className="text-base leading-none">{copied === "summary" ? "✓" : copied === "error" ? "⚠️" : "📋"}</span>
                <div>
                  <p className="font-medium text-sm">
                    {copied === "summary" ? "Copied!" : copied === "error" ? "Could not copy" : "Copy summary"}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                    {copied === "error" ? "Try long-pressing or right-clicking to copy" : "Key numbers + site link to your clipboard"}
                  </p>
                </div>
              </button>

              {/* Download PDF */}
              <button
                type="button"
                onClick={() => {
                  trackEvent("download_pdf_clicked", { source: "results" });
                  window.print();
                }}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors text-left flex items-center gap-3 cursor-pointer"
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
                onClick={() => {
                  trackEvent("check_another_property_clicked", {
                    source: "results_actions",
                  });
                }}
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
                  href="https://www.lovedby.ai?utm_source=isaisendingmetraffic&utm_medium=referral&utm_content=cta_results"
                  onClick={() => {
                    trackEvent("lovedbyai_cta_click", { placement: "results_sidebar" });
                  }}
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

        {/* Print-only footer — hidden on screen, visible in print */}
        <div className="print-footer" aria-hidden="true" />

        {/* Visible footer */}
        <p className="text-xs text-muted-foreground/50 text-center mt-10 mb-4 print-hide" style={{ fontFamily: bodyFont }}>
          With{" "}
          <svg className="inline-block w-3 h-3 text-blue-500 align-baseline" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span className="sr-only">love</span>
          {" "}by{" "}
          <a
            href="https://www.lovedby.ai?utm_source=isaisendingmetraffic&utm_medium=referral&utm_content=footer"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground/50 hover:text-foreground transition-colors font-medium"
          >
            LovedByAI
          </a>
        </p>

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
                  className={`block sm:inline sm:ml-2 mt-0.5 sm:mt-0 font-medium ${
                    report.changePercent > 0
                      ? "text-primary"
                      : "text-muted-foreground/60"
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
                  {getLogoUrl(report.topSource.label) && (
                    <img src={getLogoUrl(report.topSource.label)!} alt={`${report.topSource.label} logo`} width={16} height={16} className="w-4 h-4 flex-none rounded-sm object-contain" style={isExternalLogo(report.topSource.label) ? { mixBlendMode: 'multiply' } : undefined} />
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
                  {formatPath(report.topPage.path)}
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
            {report.totalAIConversions > 0 && (
              <div className="flex justify-between items-baseline gap-4">
                <span
                  className="text-xs text-muted-foreground/60 uppercase tracking-wider"
                  style={{ fontFamily: bodyFont }}
                >
                  Conversions
                </span>
                <span
                  className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: bodyFont }}
                >
                  {report.totalAIConversions.toLocaleString()}
                  {report.aiConversionRate !== null && (
                    <span className="text-xs text-muted-foreground/60 ml-1.5 font-normal">
                      ({(report.aiConversionRate * 100).toFixed(1)}%)
                    </span>
                  )}
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
    bwtCitations?: number;
  }>;
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const INITIAL_COUNT = 5;
  const PAGE_SIZE = 8;
  const total = sources.reduce((sum, s) => sum + s.sessions, 0);
  const max = Math.max(...sources.map((s) => s.sessions), 1);
  const visible = sources.slice(0, visibleCount);
  const hasMore = visibleCount < sources.length;

  return (
    <div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {visible.map((s, idx) => {
          return (
          <div
            key={s.source}
            className={`relative px-4 py-3.5 ${
              idx < visible.length - 1 ? "border-b border-border/50" : ""
            }`}
          >
            {/* Proportional fill bar — sessions only */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/[0.12] pointer-events-none"
              style={{ width: `${(s.sessions / max) * 100}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getLogoUrl(s.label, s.source) && (
                  <img src={getLogoUrl(s.label, s.source)!} alt={`${s.label} logo`} width={20} height={20} loading="lazy" className="w-5 h-5 flex-none rounded-sm object-contain" style={isExternalLogo(s.label) ? { mixBlendMode: 'multiply' } : undefined} />
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
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: bodyFont }}>
                  {s.sessions.toLocaleString()}
                </p>
                <p
                  className="text-[11px] text-muted-foreground/70"
                  style={{ fontFamily: bodyFont }}
                >
                  {total > 0 && s.sessions > 0 ? `${Math.round((s.sessions / total) * 100)}%` : ""}
                </p>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontFamily: bodyFont }}
        >
          Show more ({Math.min(PAGE_SIZE, sources.length - visibleCount)} more)
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
  const [visibleCount, setVisibleCount] = useState(5);
  const INITIAL_COUNT = 5;
  const PAGE_SIZE = 8;
  const visible = pages.slice(0, visibleCount);
  const hasMore = visibleCount < pages.length;

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
              {formatPath(p.path)}
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
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontFamily: bodyFont }}
        >
          Show more ({Math.min(PAGE_SIZE, pages.length - visibleCount)} more)
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
  // Aggregate into weekly buckets when dataset is too large to render individual bars
  // (365 daily bars on a ~350px mobile container = sub-pixel widths, invisible)
  const displayData = useMemo(() => {
    if (data.length <= 90) return data;
    const weeks: Array<{ date: string; sessions: number }> = [];
    for (let i = 0; i < data.length; i += 7) {
      const chunk = data.slice(i, i + 7);
      const sessions = chunk.reduce((sum, d) => sum + d.sessions, 0);
      weeks.push({ date: chunk[0].date, sessions });
    }
    return weeks;
  }, [data]);

  const maxSessions = Math.max(...displayData.map((d) => d.sessions), 1);

  const n = displayData.length;
  const labelIndices = [...new Set(
    n <= 2 ? [0, n - 1]
    : n <= 7 ? [0, Math.floor(n / 2), n - 1]
    : [0, Math.floor(n / 3), Math.floor((2 * n) / 3), n - 1]
  )];

  function fmtDate(yyyymmdd: string): string {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
    const d = parseInt(yyyymmdd.slice(6, 8), 10);
    return `${months[m]} ${d}`;
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 pt-4 pb-3">
      <div className="flex items-end gap-px h-20">
        {displayData.map((d) => {
          const height = (d.sessions / maxSessions) * 100;
          return (
            <div
              key={d.date}
              className={`flex-1 rounded-t transition-colors ${d.sessions > 0 ? "bg-primary/70 hover:bg-primary" : "bg-transparent"}`}
              style={{ height: d.sessions > 0 ? `${Math.max(height, 4)}%` : "0%" }}
              title={`${fmtDate(d.date)}: ${d.sessions} sessions`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2.5">
        {labelIndices.map((idx) => (
          <p
            key={idx}
            className="text-[10px] text-muted-foreground/50"
            style={{ fontFamily: bodyFont }}
          >
            {fmtDate(displayData[idx].date)}
          </p>
        ))}
      </div>
    </div>
  );
}

function ConversionEventsTable({
  events,
  periodLabel,
}: {
  events: Array<{ eventName: string; conversions: number }>;
  periodLabel: string;
}) {
  const [visibleCount, setVisibleCount] = useState(5);
  const INITIAL_COUNT = 5;
  const PAGE_SIZE = 8;
  const visible = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;
  const max = Math.max(...events.map((e) => e.conversions), 1);
  const total = events.reduce((sum, e) => sum + e.conversions, 0);

  function formatEventName(name: string): string {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <section className="mb-6 animate-fade-up animate-delay-150">
      <div className="flex items-baseline justify-between mb-3">
        <h2
          className="text-[11px] tracking-widest uppercase text-muted-foreground/60"
          style={{ fontFamily: bodyFont }}
        >
          Conversion events from AI · Last {periodLabel}
        </h2>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block bg-primary/10 text-primary text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full">New</span>
          <span className="text-[11px] text-muted-foreground/40" style={{ fontFamily: bodyFont }}>count</span>
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {visible.map((e, idx) => (
          <div
            key={e.eventName}
            className={`relative px-4 py-3.5 ${idx < visible.length - 1 ? "border-b border-border/50" : ""}`}
          >
            {/* Proportional fill bar */}
            <div
              className="absolute inset-y-0 left-0 bg-primary/[0.10] pointer-events-none"
              style={{ width: `${(e.conversions / max) * 100}%` }}
            />
            <div className="relative flex items-center justify-between gap-4">
              <p
                className="text-sm font-semibold text-foreground"
                style={{ fontFamily: bodyFont }}
              >
                {formatEventName(e.eventName)}
              </p>
              <div className="text-right flex-none">
                <p className="text-sm font-semibold text-foreground" style={{ fontFamily: bodyFont }}>
                  {e.conversions.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground/70" style={{ fontFamily: bodyFont }}>
                  {total > 0 ? `${Math.round((e.conversions / total) * 100)}%` : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          className="mt-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontFamily: bodyFont }}
        >
          Show more ({Math.min(PAGE_SIZE, events.length - visibleCount)} more)
        </button>
      )}
    </section>
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
            of total visits for most businesses. It's also often undercounted,
            some AI-referred visits aren't clearly attributed in Google Analytics.
          </p>
        </div>

        {topOrganicPages.length > 0 && (
          <div>
            <p
              className="text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
              style={{ fontFamily: bodyFont }}
            >
              Your top pages from Google & search engines
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
                    {formatPath(p.path)}
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
            href="https://www.lovedby.ai?utm_source=isaisendingmetraffic&utm_medium=referral&utm_content=zero_state"
            onClick={() => {
              trackEvent("lovedbyai_cta_click", { placement: "zero_state" });
            }}
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
        `Most of your AI traffic is landing on ${formatPath(report.topPage.path)}.`
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

    if (report.totalAIConversions > 0 && report.aiConversionRate !== null) {
      insights.push(
        `AI visitors completed ${report.totalAIConversions.toLocaleString()} conversions (${(report.aiConversionRate * 100).toFixed(1)}% rate), showing these visits drive real action.`
      );
    } else if (report.totalAISessions > 20) {
      insights.push(
        "To see whether AI visitors convert, set up key events in Google Analytics 4."
      );
    }
  }

  insights.push(
    "GA4 does not show all AI-driven visits cleanly, so this is best used as a strong signal, not a perfect count."
  );

  return (
    <ul className="space-y-2.5">
      {insights.map((insight, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span
            className="mt-[0.4em] w-1.5 h-1.5 rounded-full flex-none"
            style={{ backgroundColor: "oklch(0.50 0.175 162 / 0.55)" }}
          />
          <p
            className="text-sm text-muted-foreground leading-relaxed"
            style={{ fontFamily: bodyFont }}
          >
            {insight}
          </p>
        </li>
      ))}
    </ul>
  );
}
