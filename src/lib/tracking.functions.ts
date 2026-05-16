import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { AITrafficReport } from "./ai-sources";

interface SessionData {
  googleEmail?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
}

function getSessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET environment variable is required");
  return {
    password,
    name: "ai-traffic",
    maxAge: 60 * 60 * 24,
  };
}

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  // Prefer service role (bypasses RLS) but fall back to publishable key (uses INSERT policy)
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const saveScan = createServerFn({ method: "POST" })
  .inputValidator((input: { propertyId: string; report: AITrafficReport }) => input)
  .handler(async ({ data }) => {
    try {
      const supabase = getSupabaseServerClient();
      if (!supabase) {
        console.warn("[tracking] Supabase not configured — skipping scan save");
        return;
      }

      const session = await useSession<SessionData>(getSessionConfig());
      const googleEmail = session.data?.googleEmail ?? null;

      const { report, propertyId } = data;

      // Skip re-insert if same user + property + period already scanned within 7 days
      const dedupeQuery = supabase
        .from("aisendingme_scans")
        .select("id")
        .eq("ga4_property_id", propertyId)
        .eq("days_analyzed", report.days)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Scope dedup to the user's email when available, otherwise property-level
      if (googleEmail) {
        dedupeQuery.eq("google_email", googleEmail);
      }

      const { data: existing } = await dedupeQuery.limit(1).maybeSingle();

      if (existing) {
        console.log("[tracking] Skipping duplicate scan (cached within 7 days)");
        return;
      }

      const { error } = await supabase.from("aisendingme_scans").insert({
        google_email: googleEmail,
        ga4_property_id: propertyId,
        ga4_property_name: report.propertyName,
        domain: report.domain ?? null,
        ai_traffic_state: report.state,
        // Sessions & users
        total_ai_sessions: report.totalAISessions,
        prev_ai_sessions: report.prevAISessions,
        total_ai_users: report.totalAIUsers,
        total_ai_new_users: report.totalAINewUsers,
        change_percent: report.changePercent,
        // Date ranges
        days_analyzed: report.days,
        date_range_start: report.dateRange.start,
        date_range_end: report.dateRange.end,
        prev_date_range_start: report.prevDateRange.start,
        prev_date_range_end: report.prevDateRange.end,
        // Top items (convenience columns)
        top_source: report.topSource?.label ?? null,
        top_source_sessions: report.topSource?.sessions ?? null,
        top_page: report.topPage?.path ?? null,
        top_page_sessions: report.topPage?.sessions ?? null,
        pages_with_ai_traffic: report.pagesWithAITraffic,
        // Rich JSONB columns
        source_breakdown: report.sourceBreakdown,
        top_sources: report.sourceBreakdown.slice(0, 6),
        top_pages: report.topPages.slice(0, 6),
        top_organic_pages: report.topOrganicPages.slice(0, 6),
        daily_trend: report.dailyTrend,
      });

      if (error) {
        console.error("[tracking] Insert failed:", error.message);
      }
    } catch (err) {
      // Never let tracking errors surface to the user
      console.error("[tracking] saveScan threw:", err);
    }
  });
