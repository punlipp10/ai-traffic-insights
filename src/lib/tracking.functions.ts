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
  return {
    password:
      process.env.SESSION_SECRET ||
      "dev-fallback-secret-must-be-32-characters-long!!",
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

      const { error } = await supabase.from("aisendingme_scans").insert({
        google_email: googleEmail,
        ga4_property_id: propertyId,
        ga4_property_name: report.propertyName,
        ai_traffic_state: report.state,
        total_ai_sessions: report.totalAISessions,
        prev_ai_sessions: report.prevAISessions,
        change_percent: report.changePercent,
        top_source: report.topSource?.label ?? null,
        top_page: report.topPage?.path ?? null,
        pages_with_ai_traffic: report.pagesWithAITraffic,
        days_analyzed: report.days,
        source_breakdown: report.sourceBreakdown,
        date_range_start: report.dateRange.start,
        date_range_end: report.dateRange.end,
      });

      if (error) {
        console.error("[tracking] Insert failed:", error.message);
      }
    } catch (err) {
      // Never let tracking errors surface to the user
      console.error("[tracking] saveScan threw:", err);
    }
  });
