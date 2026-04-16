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
      throw new Error("Failed to fetch GA4 properties");
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
    (input: { propertyId: string; propertyName?: string }) => input
  )
  .handler(async ({ data }) => {
    const accessToken = await getAccessToken();
    const propertyId = data.propertyId;

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const thirtyOneDaysAgo = new Date(today);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    // Report 1: All traffic by source (last 30 + prev 30)
    const sourceReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [
        { startDate: fmt(thirtyDaysAgo), endDate: fmt(today) },
        { startDate: fmt(sixtyDaysAgo), endDate: fmt(thirtyOneDaysAgo) },
      ],
      dimensions: [{ name: "sessionSource" }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "newUsers" },
      ],
      limit: "10000",
    });

    // Identify AI sources from report 1
    const aiSourceValues: string[] = [];
    const sourceData: Array<{
      source: string;
      label: string;
      category: "known" | "possible";
      sessions: number;
      prevSessions: number;
      users: number;
    }> = [];

    for (const row of sourceReport.rows || []) {
      const source = row.dimensionValues?.[0]?.value || "";
      const match = matchAISource(source);
      if (match) {
        aiSourceValues.push(source);
        const dateRangeIdx =
          row.dimensionValues?.length > 1
            ? 0
            : 0;
        sourceData.push({
          source,
          label: match.label,
          category: match.category,
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
          prevSessions: 0,
          users: parseInt(row.metricValues?.[1]?.value || "0"),
        });
      }
    }

    // Parse multi-date-range data
    const currentSources = new Map<
      string,
      { sessions: number; users: number; newUsers: number; label: string; category: "known" | "possible" }
    >();
    const prevSources = new Map<string, number>();

    for (const row of sourceReport.rows || []) {
      const source = row.dimensionValues?.[0]?.value || "";
      const match = matchAISource(source);
      if (!match) continue;

      const sessions = parseInt(row.metricValues?.[0]?.value || "0");
      const users = parseInt(row.metricValues?.[1]?.value || "0");
      const newUsers = parseInt(row.metricValues?.[2]?.value || "0");

      // GA4 returns rows per date range. The dateRange index is implicit
      // in the order for single-dimension reports with multiple date ranges.
      // We'll handle this by checking if we've already seen this source.
      if (!currentSources.has(source)) {
        currentSources.set(source, {
          sessions,
          users,
          newUsers,
          label: match.label,
          category: match.category,
        });
      } else {
        prevSources.set(source, sessions);
      }
    }

    // Get daily trend + top pages only if we have AI sources
    let dailyTrend: Array<{ date: string; sessions: number }> = [];
    let topPages: Array<{ path: string; sessions: number }> = [];

    if (aiSourceValues.length > 0) {
      // Report 2: Daily trend for AI sources
      const trendReport = await runGA4Report(accessToken, propertyId, {
        dateRanges: [
          { startDate: fmt(thirtyDaysAgo), endDate: fmt(today) },
        ],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSource",
            inListFilter: { values: aiSourceValues },
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
        limit: "31",
      });

      dailyTrend = (trendReport.rows || []).map(
        (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
          date: row.dimensionValues?.[0]?.value || "",
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        })
      );

      // Report 3: Top landing pages for AI sources
      const pagesReport = await runGA4Report(accessToken, propertyId, {
        dateRanges: [
          { startDate: fmt(thirtyDaysAgo), endDate: fmt(today) },
        ],
        dimensions: [{ name: "landingPagePlusQueryString" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "sessionSource",
            inListFilter: { values: aiSourceValues },
          },
        },
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "10",
      });

      topPages = (pagesReport.rows || []).map(
        (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
          path: row.dimensionValues?.[0]?.value || "",
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        })
      );
    }

    // Get top organic pages (for zero-data state)
    const organicReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [
        { startDate: fmt(thirtyDaysAgo), endDate: fmt(today) },
      ],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        filter: {
          fieldName: "sessionDefaultChannelGroup",
          stringFilter: { value: "Organic Search", matchType: "EXACT" },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "5",
    });

    const topOrganicPages = (organicReport.rows || []).map(
      (row: { dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }) => ({
        path: row.dimensionValues?.[0]?.value || "",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      })
    );

    // Calculate totals
    let totalAISessions = 0;
    let totalAIUsers = 0;
    let totalAINewUsers = 0;
    let prevAISessions = 0;

    const sourceBreakdown: AITrafficReport["sourceBreakdown"] = [];

    for (const [source, info] of currentSources) {
      totalAISessions += info.sessions;
      totalAIUsers += info.users;
      totalAINewUsers += info.newUsers;
      prevAISessions += prevSources.get(source) || 0;

      sourceBreakdown.push({
        source,
        label: info.label,
        category: info.category,
        sessions: info.sessions,
        users: info.users,
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

    const report: AITrafficReport = {
      propertyName: data.propertyName || propertyId,
      dateRange: { start: fmt(thirtyDaysAgo), end: fmt(today) },
      prevDateRange: {
        start: fmt(sixtyDaysAgo),
        end: fmt(thirtyOneDaysAgo),
      },
      totalAISessions,
      prevAISessions,
      totalAIUsers,
      totalAINewUsers,
      changePercent,
      topSource,
      topPage,
      pagesWithAITraffic,
      sourceBreakdown,
      topPages,
      dailyTrend,
      topOrganicPages,
      state,
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
    throw new Error(`GA4 report failed (${response.status})`);
  }

  return response.json();
}
