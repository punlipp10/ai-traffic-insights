import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { matchAISource } from "./ai-sources";
import type { GA4Property, AITrafficReport } from "./ai-sources";

function getSessionConfig() {
  return {
    password:
      process.env.SESSION_SECRET ||
      "dev-fallback-secret-must-be-32-characters-long!!",
    name: "ai-traffic",
    maxAge: 60 * 60 * 24,
  };
}

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
}

async function getAccessToken(): Promise<string> {
  const session = await useSession<SessionData>(getSessionConfig());
  const { googleAccessToken, googleRefreshToken, googleTokenExpiry } =
    session.data;

  if (!googleAccessToken) {
    throw new Error("Not authenticated");
  }

  if (googleTokenExpiry && Date.now() < googleTokenExpiry - 60000) {
    return googleAccessToken;
  }

  if (!googleRefreshToken) {
    throw new Error("Session expired");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: googleRefreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error("Token refresh failed");

  await session.update({
    googleAccessToken: data.access_token,
    googleRefreshToken,
    googleTokenExpiry: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

export const listGA4Properties = createServerFn({ method: "GET" }).handler(
  async () => {
    const accessToken = await getAccessToken();

    const response = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("GA4 accountSummaries error:", err);
      if (response.status === 429) {
        throw new Error("GA4 rate limit reached (429). Please wait a minute and try again.");
      }
      const isHtml = err.trimStart().startsWith("<");
      let detail = isHtml ? `HTTP ${response.status} error from Google Analytics API.` : err;
      if (!isHtml) {
        try {
          const parsed = JSON.parse(err);
          detail = parsed?.error?.message || err;
        } catch {}
      }
      throw new Error(`GA4 API error (${response.status}): ${detail}`);
    }

    const data = await response.json();
    const properties: GA4Property[] = [];

    for (const account of data.accountSummaries || []) {
      for (const prop of account.propertySummaries || []) {
        properties.push({
          propertyId: prop.property?.replace("properties/", "") || "",
          displayName: prop.displayName || "Unnamed Property",
          accountName: account.displayName || "Unnamed Account",
        });
      }
    }

    return { properties };
  }
);

export const fetchAITrafficReport = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { propertyId: string; propertyName?: string; days?: number; hosts?: string[]; excludePaths?: string[] }) => input
  )
  .handler(async ({ data }) => {
    const accessToken = await getAccessToken();
    const propertyId = data.propertyId;
    const days = data.days || 30;
    const hostFilter = (data.hosts || []).filter(Boolean);
    const excludePaths = (data.excludePaths || [])
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (p.startsWith("/") ? p : `/${p}`));
    // Drop sessions whose landing page starts with an excluded prefix
    // (e.g. /sites/ — app users opening their own dashboard from ChatGPT).
    const pathExpr =
      excludePaths.length > 0
        ? {
            notExpression: {
              orGroup: {
                expressions: excludePaths.map((value) => ({
                  filter: {
                    fieldName: "landingPage",
                    stringFilter: { value, matchType: "BEGINS_WITH" },
                  },
                })),
              },
            },
          }
        : null;
    // Restrict to the selected hostnames (e.g. drop customer sites that share
    // the same GTM container). Empty = all hosts.
    const hostExpr =
      hostFilter.length > 0
        ? { filter: { fieldName: "hostName", inListFilter: { values: hostFilter } } }
        : null;
    const combine = (...exprs: Array<Record<string, unknown> | null | undefined>) => {
      const list = exprs.filter((e): e is Record<string, unknown> => !!e);
      if (list.length === 0) return undefined;
      return list.length === 1 ? list[0] : { andGroup: { expressions: list } };
    };
    const scoped = (filter?: Record<string, unknown>) => combine(filter, hostExpr, pathExpr);

    const today = new Date();
    const periodStart = new Date(today);
    periodStart.setDate(periodStart.getDate() - days);
    const prevPeriodEnd = new Date(periodStart);
    prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd);
    prevPeriodStart.setDate(prevPeriodStart.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Report 1: All traffic by source (current period + prev period)
    // GA4 automatically appends a dateRange dimension to dimensionValues when
    // multiple dateRanges are requested — values are "date_range_0" (current)
    // and "date_range_1" (previous). Do NOT list it in dimensions explicitly.
    const sourceReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [
        { startDate: fmt(periodStart), endDate: fmt(today) },
        { startDate: fmt(prevPeriodStart), endDate: fmt(prevPeriodEnd) },
      ],
      dimensions: [{ name: "sessionSource" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
        { name: "conversions" },
      ],
      dimensionFilter: scoped(),
      limit: "10000",
    });

    // AI sessions per hostname (current period, ignoring the host filter) —
    // powers the host picker so users can see which hosts exist.
    const hostReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [{ startDate: fmt(periodStart), endDate: fmt(today) }],
      dimensions: [{ name: "hostName" }, { name: "sessionSource" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: combine(pathExpr),
      limit: "10000",
    });
    const hostSessions = new Map<string, number>();
    for (const row of hostReport.rows || []) {
      const host = row.dimensionValues?.[0]?.value || "";
      const source = row.dimensionValues?.[1]?.value || "";
      if (!host || host === "(not set)" || !matchAISource(source)) continue;
      hostSessions.set(host, (hostSessions.get(host) || 0) + parseInt(row.metricValues?.[0]?.value || "0"));
    }
    const hosts = Array.from(hostSessions, ([host, sessions]) => ({ host, sessions }))
      .sort((a, b) => b.sessions - a.sessions);

    // Parse multi-date-range data using explicit dateRange dimension
    const currentSources = new Map<
      string,
      { sessions: number; users: number; newUsers: number; conversions: number; label: string; category: "known" | "possible" }
    >();
    const prevSources = new Map<string, number>();

    for (const row of sourceReport.rows || []) {
      const source = row.dimensionValues?.[0]?.value || "";
      const dateRangeLabel = row.dimensionValues?.[1]?.value || "";
      const match = matchAISource(source);
      if (!match) continue;

      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      const newUsers = parseInt(row.metricValues?.[2]?.value || "0");
      const conversions = parseInt(row.metricValues?.[3]?.value || "0");

      if (dateRangeLabel === "date_range_0") {
        currentSources.set(source, {
          sessions,
          users,
          newUsers,
          conversions,
          label: match.label,
          category: match.category,
        });
      } else {
        // date_range_1 = previous period
        prevSources.set(source, sessions);
      }
    }

    // Collect AI source values from current period only (for trend/pages queries)
    const aiSourceValues = Array.from(currentSources.keys());

    // Get daily trend + top pages only if we have AI sources
    let dailyTrend: Array<{ date: string; sessions: number }> = [];
    let topPages: Array<{ path: string; sessions: number }> = [];

    if (aiSourceValues.length > 0) {
      // Report 2: Daily trend for AI sources
      const trendReport = await runGA4Report(accessToken, propertyId, {
        dateRanges: [
          { startDate: fmt(periodStart), endDate: fmt(today) },
        ],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: scoped({
          filter: {
            fieldName: "sessionSource",
            inListFilter: { values: aiSourceValues },
          },
        }),
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        limit: String(days + 1),
      });

      const sparseData = (trendReport.rows || []).map(
        (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
          date: row.dimensionValues?.[0]?.value || "",
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        })
      );

      // Fill in ALL dates in the range so chart is proportional
      const sessionsByDate = new Map(sparseData.map((d) => [d.date, d.sessions]));
      const cursor = new Date(periodStart);
      cursor.setDate(cursor.getDate() + 1); // start day after period start
      while (cursor <= today) {
        const key = cursor.toISOString().split("T")[0].replace(/-/g, "");
        dailyTrend.push({ date: key, sessions: sessionsByDate.get(key) || 0 });
        cursor.setDate(cursor.getDate() + 1);
      }

      // Report 3: Top landing pages for AI sources (filter out (not set))
      const pagesReport = await runGA4Report(accessToken, propertyId, {
        dateRanges: [
          { startDate: fmt(periodStart), endDate: fmt(today) },
        ],
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: scoped({
          andGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "sessionSource",
                  inListFilter: { values: aiSourceValues },
                },
              },
              {
                notExpression: {
                  filter: {
                    fieldName: "landingPagePlusQueryString",
                    stringFilter: { value: "(not set)", matchType: "EXACT" },
                  },
                },
              },
            ],
          },
        }),
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "25",
      });

      topPages = (pagesReport.rows || [])
        .map(
          (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
            path: row.dimensionValues?.[0]?.value || "",
            sessions: parseInt(row.metricValues?.[0]?.value || "0"),
          })
        )
        .filter((p: { path: string; sessions: number }) => p.path && p.path !== "(not set)");
    }

    // Report 4: Conversion events breakdown (by event name, filtered to AI sources)
    let conversionEvents: Array<{ eventName: string; conversions: number }> = [];
    if (aiSourceValues.length > 0) {
      const convEventsReport = await runGA4Report(accessToken, propertyId, {
        dateRanges: [{ startDate: fmt(periodStart), endDate: fmt(today) }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "conversions" }],
        dimensionFilter: scoped({
          filter: {
            fieldName: "sessionSource",
            inListFilter: { values: aiSourceValues },
          },
        }),
        orderBys: [{ metric: { metricName: "conversions" }, desc: true }],
        limit: "50",
      });
      conversionEvents = (convEventsReport.rows || [])
        .map((row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
          eventName: row.dimensionValues?.[0]?.value || "",
          conversions: parseInt(row.metricValues?.[0]?.value || "0"),
        }))
        .filter((e: { eventName: string; conversions: number }) => e.eventName && e.conversions > 0);
    }

    // Get top organic pages (for zero-data state)
    const organicReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [
        { startDate: fmt(periodStart), endDate: fmt(today) },
      ],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: scoped({
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: "sessionDefaultChannelGroup",
                stringFilter: { value: "Organic Search", matchType: "EXACT" },
              },
            },
            {
              notExpression: {
                filter: {
                  fieldName: "landingPagePlusQueryString",
                  stringFilter: { value: "(not set)", matchType: "EXACT" },
                },
              },
            },
          ],
        },
      }),
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "5",
    });

    const topOrganicPages = (organicReport.rows || [])
      .map(
        (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
          path: row.dimensionValues?.[0]?.value || "",
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        })
      )
      .filter((p: { path: string; sessions: number }) => p.path && p.path !== "(not set)");

    // Calculate totals
    let totalAISessions = 0;
    let totalAIUsers = 0;
    let totalAINewUsers = 0;
    let totalAIConversions = 0;
    let prevAISessions = 0;

    const sourceBreakdown: AITrafficReport["sourceBreakdown"] = [];

    for (const [source, info] of currentSources) {
      totalAISessions += info.sessions;
      totalAIUsers += info.users;
      totalAINewUsers += info.newUsers;
      totalAIConversions += info.conversions;
      prevAISessions += prevSources.get(source) || 0;

      sourceBreakdown.push({
        source,
        label: info.label,
        category: info.category,
        sessions: info.sessions,
        users: info.users,
        conversions: info.conversions,
      });
    }

    sourceBreakdown.sort((a, b) => b.sessions - a.sessions);

    const changePercent =
      prevAISessions > 0
        ? Math.round(
            ((totalAISessions - prevAISessions) / prevAISessions) * 100
          )
        : totalAISessions > 0
          ? 100
          : null;

    const aiConversionRate = totalAISessions > 0 ? totalAIConversions / totalAISessions : null;

    const topSource = sourceBreakdown[0]
      ? { label: sourceBreakdown[0].label, sessions: sourceBreakdown[0].sessions }
      : null;

    const topPage = topPages[0]
      ? { path: topPages[0].path, sessions: topPages[0].sessions }
      : null;

    const pagesWithAITraffic = topPages.length;

    let state: AITrafficReport["state"] = "none";
    if (totalAISessions >= 10) state = "meaningful";
    else if (totalAISessions > 0) state = "low";

    // Fetch property domain from GA4 Admin API
    let domain: string | null = null;
    try {
      const propDetails = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties/${propertyId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (propDetails.ok) {
        const pd = await propDetails.json();
        domain = pd.websiteUri ?? null;
      }
    } catch {
      // non-fatal
    }

    const report: AITrafficReport = {
      propertyId,
      propertyName: data.propertyName || propertyId,
      days,
      dateRange: { start: fmt(periodStart), end: fmt(today) },
      prevDateRange: {
        start: fmt(prevPeriodStart),
        end: fmt(prevPeriodEnd),
      },
      totalAISessions,
      prevAISessions,
      totalAIUsers,
      totalAINewUsers,
      totalAIConversions,
      aiConversionRate,
      changePercent,
      topSource,
      topPage,
      pagesWithAITraffic,
      sourceBreakdown,
      topPages,
      dailyTrend,
      topOrganicPages,
      conversionEvents,
      state,
      domain,
      hosts,
      hostFilter,
      excludePaths,
    };

    return { report };
  });

async function runGA4Report(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>
) {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("GA4 runReport error:", response.status, err);
    if (response.status === 429) {
      throw new Error("GA4 rate limit reached (429). Google has temporarily throttled requests — please wait a minute and try again.");
    }
    // If Google returns an HTML error page, don't leak it to the UI
    const isHtml = err.trimStart().startsWith("<");
    let detail = isHtml ? `HTTP ${response.status} error from Google Analytics API.` : err;
    if (!isHtml) {
      try {
        const parsed = JSON.parse(err);
        detail = parsed?.error?.message || err;
      } catch {}
    }
    throw new Error(`GA4 report error (${response.status}): ${detail}`);
  }

  return response.json();
}
