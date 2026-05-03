import { createServerFn } from "@tanstack/react-start";
import { useSession, updateSession } from "@tanstack/react-start/server";

interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  googleEmail?: string;
  bingAccessToken?: string;
  bingRefreshToken?: string;
  bingTokenExpiry?: number;
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

export interface BingCopilotData {
  available: boolean;
  citations: number;
  topPages: Array<{ url: string; citations: number }>;
}

async function getBingAccessToken(): Promise<string> {
  const session = await useSession<SessionData>(getSessionConfig());
  const { bingAccessToken, bingRefreshToken, bingTokenExpiry } = session.data;

  if (!bingAccessToken) {
    throw new Error("Not authenticated with Bing");
  }

  // Token still valid
  if (bingTokenExpiry && Date.now() < bingTokenExpiry - 60000) {
    return bingAccessToken;
  }

  if (!bingRefreshToken) {
    throw new Error("Bing session expired");
  }

  const response = await fetch("https://www.bing.com/webmasters/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.BING_WEBMASTER_CLIENT_ID!,
      client_secret: process.env.BING_WEBMASTER_CLIENT_SECRET!,
      refresh_token: bingRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error("Bing token refresh failed");

  await updateSession<SessionData>(getSessionConfig(), {
    bingAccessToken: data.access_token,
    bingRefreshToken,
    bingTokenExpiry: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}

export const getBingStatusAndSites = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const accessToken = await getBingAccessToken();

      const apiResponse = await fetch(
        "https://ssl.bing.com/webmaster/api.svc/json/GetUserSites",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (!apiResponse.ok) {
        console.error("BWT GetUserSites error:", apiResponse.status);
        return { connected: true, sites: [] as string[] };
      }

      const text = await apiResponse.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("BWT GetUserSites non-JSON:", apiResponse.status, text.slice(0, 200));
        return { connected: true, sites: [] as string[] };
      }

      const d = (data as { d?: unknown }).d;
      const sites: string[] = (Array.isArray(d) ? d : [])
        .map((s: { Url?: string }) => s.Url || "")
        .filter(Boolean);

      return { connected: true, sites };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Not authenticated")) return { connected: false, sites: [] as string[] };
      return { connected: false, sites: [] as string[] };
    }
  }
);

export const fetchBingCopilotData = createServerFn({ method: "POST" })
  .inputValidator((input: { siteUrl: string; days?: number }) => input)
  .handler(async ({ data }): Promise<{ data: BingCopilotData }> => {
    const accessToken = await getBingAccessToken();
    const siteUrl = data.siteUrl;
    const days = data.days || 30;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const startStr = fmt(startDate);
    const endStr = fmt(today);

    const headers = { Authorization: `Bearer ${accessToken}`, Accept: "application/json" };
    const encodedUrl = encodeURIComponent(siteUrl);

    // Try BWT AI Performance endpoint (introduced Feb 2026 public preview)
    // Falls back silently if not yet available via API
    const endpoints = [
      `GetAIPerformance?siteUrl=${encodedUrl}&startDate=${startStr}&endDate=${endStr}`,
      `GetCopilotStats?siteUrl=${encodedUrl}&startDate=${startStr}&endDate=${endStr}`,
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(
          `https://ssl.bing.com/webmaster/api.svc/json/${ep}`,
          { method: "GET", headers }
        );
        if (!res.ok) continue;
        const text = await res.text();
        const json = JSON.parse(text);
        const d = (json as { d?: unknown }).d;
        if (!d) continue;

        // Extract total citations — try multiple possible field names
        const citations =
          typeof d === "number" ? d
          : typeof (d as Record<string, unknown>).TotalCitations === "number" ? (d as Record<string, unknown>).TotalCitations as number
          : typeof (d as Record<string, unknown>).Citations === "number" ? (d as Record<string, unknown>).Citations as number
          : typeof (d as Record<string, unknown>).TotalCount === "number" ? (d as Record<string, unknown>).TotalCount as number
          : 0;

        // Extract per-page data if present
        const pages = Array.isArray((d as Record<string, unknown>).Pages)
          ? ((d as Record<string, unknown>).Pages as Array<Record<string, unknown>>)
              .map((p) => ({ url: String(p.Url || p.Page || ""), citations: Number(p.Citations || p.Count || 0) }))
              .filter((p) => p.url)
          : Array.isArray(d)
            ? (d as Array<Record<string, unknown>>)
                .map((p) => ({ url: String(p.Url || p.Page || ""), citations: Number(p.Citations || p.Count || 0) }))
                .filter((p) => p.url)
            : [];

        return { data: { available: true, citations, topPages: pages.slice(0, 10) } };
      } catch {
        continue;
      }
    }

    return { data: { available: false, citations: 0, topPages: [] } };
  });

export const disconnectBing = createServerFn({ method: "POST" }).handler(
  async () => {
    await updateSession<SessionData>(getSessionConfig(), {
      bingAccessToken: "",
      bingRefreshToken: "",
      bingTokenExpiry: 0,
    });
    return { success: true };
  }
);
