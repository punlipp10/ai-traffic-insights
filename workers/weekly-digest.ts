/**
 * Weekly Digest Cron Worker
 *
 * Schedule: Monday 09:00 UTC  →  "0 9 * * 1"
 *
 * For each active subscription:
 *   1. Decrypt the stored refresh token
 *   2. Refresh the Google access token
 *   3. Fetch last 7-day AI traffic from GA4
 * Group by email → send one digest per email via Resend.
 *
 * Required environment variables (set in Cloudflare dashboard or wrangler secret):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DIGEST_ENCRYPTION_KEY   (32-byte AES key, base64-encoded)
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   RESEND_API_KEY
 *   APP_BASE_URL            (e.g. https://isaisendingmetraffic.com)
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DIGEST_ENCRYPTION_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  APP_BASE_URL: string;
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

async function getDecryptionKey(base64Key: string): Promise<CryptoKey> {
  const bytes = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", bytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptToken(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── Google token refresh ──────────────────────────────────────────────────────

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

// ── GA4 helpers ───────────────────────────────────────────────────────────────

interface SourceSummary {
  label: string;
  sessions: number;
}

interface PropertyDigestData {
  propertyName: string;
  propertyId: string;
  totalSessions: number;
  prevSessions: number;
  changePercent: number | null;
  topSources: SourceSummary[];
  topPage: string | null;
  conversions: number;
}

const AI_SOURCE_MAP: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "perplexity.ai": "Perplexity",
  "claude.ai": "Claude",
  "gemini.google.com": "Gemini",
  "bard.google.com": "Gemini",
  "grok.com": "Grok",
  "x.ai": "Grok",
  "deepseek.com": "DeepSeek",
  "copilot.microsoft.com": "Microsoft Copilot",
  "you.com": "You.com",
  "phind.com": "Phind",
  "poe.com": "Poe",
  "kagi.com": "Kagi",
  "pi.ai": "Pi",
  "meta.ai": "Meta AI",
};

function matchAILabel(source: string): string | null {
  const lower = source.toLowerCase();
  for (const [domain, label] of Object.entries(AI_SOURCE_MAP)) {
    if (lower === domain || lower.endsWith(`.${domain}`)) return label;
  }
  return null;
}

async function runGA4Report(
  accessToken: string,
  propertyId: string,
  body: object
): Promise<{ rows?: Array<{ dimensionValues?: Array<{ value: string }>; metricValues?: Array<{ value: string }> }> }> {
  const res = await fetch(
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
  if (!res.ok) return {};
  return res.json();
}

async function fetchPropertyDigest(
  accessToken: string,
  propertyId: string,
  propertyName: string
): Promise<PropertyDigestData> {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const periodStart = new Date(today);
  periodStart.setDate(today.getDate() - 7);
  const prevEnd = new Date(periodStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - 7);

  const sourceReport = await runGA4Report(accessToken, propertyId, {
    dateRanges: [
      { startDate: fmt(periodStart), endDate: fmt(today) },
      { startDate: fmt(prevStart), endDate: fmt(prevEnd) },
    ],
    dimensions: [{ name: "sessionSource" }],
    metrics: [{ name: "sessions" }, { name: "conversions" }],
    limit: "5000",
  });

  let totalSessions = 0;
  let prevSessions = 0;
  let totalConversions = 0;
  const sourceMap = new Map<string, number>();

  for (const row of sourceReport.rows ?? []) {
    const source = row.dimensionValues?.[0]?.value ?? "";
    const rangeLabel = row.dimensionValues?.[1]?.value ?? "";
    const sessions = parseInt(row.metricValues?.[0]?.value ?? "0");
    const convs = parseInt(row.metricValues?.[1]?.value ?? "0");
    const label = matchAILabel(source);
    if (!label) continue;

    if (rangeLabel === "date_range_0") {
      totalSessions += sessions;
      totalConversions += convs;
      sourceMap.set(label, (sourceMap.get(label) ?? 0) + sessions);
    } else {
      prevSessions += sessions;
    }
  }

  const topSources = Array.from(sourceMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, sessions]) => ({ label, sessions }));

  const aiSourceKeys = [...new Set(
    (sourceReport.rows ?? [])
      .filter((r) => r.dimensionValues?.[1]?.value === "date_range_0" && matchAILabel(r.dimensionValues?.[0]?.value ?? ""))
      .map((r) => r.dimensionValues?.[0]?.value ?? "")
  )];

  let topPage: string | null = null;
  if (aiSourceKeys.length > 0) {
    const pagesReport = await runGA4Report(accessToken, propertyId, {
      dateRanges: [{ startDate: fmt(periodStart), endDate: fmt(today) }],
      dimensions: [{ name: "landingPagePlusQueryString" }],
      metrics: [{ name: "sessions" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: "sessionSource", inListFilter: { values: aiSourceKeys } } },
            { notExpression: { filter: { fieldName: "landingPagePlusQueryString", stringFilter: { value: "(not set)", matchType: "EXACT" } } } },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: "1",
    });
    topPage = pagesReport.rows?.[0]?.dimensionValues?.[0]?.value ?? null;
  }

  const changePercent =
    prevSessions > 0
      ? Math.round(((totalSessions - prevSessions) / prevSessions) * 100)
      : null;

  return { propertyName, propertyId, totalSessions, prevSessions, changePercent, topSources, topPage, conversions: totalConversions };
}

// ── Email template ────────────────────────────────────────────────────────────

function buildEmailHtml(
  properties: PropertyDigestData[],
  digestEmail: string,
  unsubscribeToken: string,
  baseUrl: string
): string {
  const dateLabel = new Date()
    .toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const GREEN = "#1a7a50";
  const BG = "#f5f4f0";
  const BORDER = "#e4e1da";
  const INK = "#1a1a18";
  const MUTED = "#8a8780";
  const RED = "#c0392b";

  const propertySections = [...properties]
    .sort((a, b) => b.totalSessions - a.totalSessions)
    .map((p) => {
      const changeColor =
        p.changePercent === null ? MUTED : p.changePercent >= 0 ? GREEN : MUTED;
      const changeArrow =
        p.changePercent === null ? "" : p.changePercent >= 0 ? "↑" : "↓";
      const reportUrl = `${baseUrl}/results?propertyId=${encodeURIComponent(p.propertyId)}&days=7`;

      return `
      <tr><td style="padding-bottom:20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:8px;">
          <tr><td style="padding:24px 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">

              <!-- Property label -->
              <tr><td style="padding-bottom:10px;">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">${p.propertyName}</span>
              </td></tr>

              <!-- Big number -->
              <tr><td>
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:52px;font-weight:700;color:${INK};line-height:1;">${p.totalSessions.toLocaleString()}</span>
              </td></tr>
              <tr><td style="padding-bottom:${p.changePercent !== null ? "6" : "16"}px;">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">AI sessions this week</span>
              </td></tr>
              ${p.changePercent !== null ? `
              <tr><td style="padding-bottom:${p.conversions > 0 ? "8" : "16"}px;">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:14px;font-weight:700;color:${changeColor};">${changeArrow} ${Math.abs(p.changePercent)}% vs last week</span>
              </td></tr>` : ""}

              ${p.conversions > 0 ? `
              <tr><td style="padding-bottom:16px;">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:13px;font-weight:600;color:${GREEN};">${p.conversions.toLocaleString()} conversion${p.conversions === 1 ? "" : "s"} from AI</span>
              </td></tr>` : ""}

              ${p.topSources.length > 0 ? `
              <!-- Sources -->
              <tr><td style="padding-top:4px;padding-bottom:10px;border-top:1px solid ${BORDER};">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">Top AI sources</span>
              </td></tr>
              ${p.topSources.map((s, i) => `
              <tr><td style="padding-bottom:7px;">
                <table width="100%" cellpadding="0" cellspacing="0"><tr>
                  <td style="width:18px;font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:12px;color:${MUTED};vertical-align:top;padding-top:1px;">${i + 1}.</td>
                  <td style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:14px;color:${INK};font-weight:500;">${s.label}</td>
                  <td align="right" style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:14px;color:${INK};font-weight:700;">${s.sessions.toLocaleString()}</td>
                </tr></table>
              </td></tr>`).join("")}` : ""}

              ${p.topPage ? `
              <!-- Top page -->
              <tr><td style="padding-top:12px;padding-bottom:8px;border-top:1px solid ${BORDER};">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">Top landing page</span>
              </td></tr>
              <tr><td style="padding-bottom:4px;">
                <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:13px;color:${INK};word-break:break-all;">${p.topPage}</span>
              </td></tr>` : ""}

            </table>
          </td></tr>
          <!-- CTA -->
          <tr><td style="padding:16px 24px 24px;">
            <a href="${reportUrl}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:9999px;font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:13px;font-weight:600;">View full report →</a>
          </td></tr>
        </table>
      </td></tr>`;
    })
    .join("");

  const unsubUrl = `${baseUrl}/unsubscribe?token=${unsubscribeToken}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your AI traffic this week</title>
  <style>@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:${BG};">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Your AI traffic report for the week of ${dateLabel} ‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌‌</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Brand -->
        <tr><td style="padding-bottom:24px;">
          <a href="${baseUrl}?utm_source=digest&utm_medium=email" style="text-decoration:none;">
            <span style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;color:${GREEN};">ISAISENDINGMETRAFFIC.COM</span>
          </a>
        </td></tr>

        <!-- Date + headline -->
        <tr><td style="padding-bottom:24px;border-bottom:2px solid ${INK};">
          <p style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};margin:0 0 8px;">${dateLabel}</p>
          <h1 style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:28px;font-weight:700;color:${INK};margin:0;line-height:1.2;">Your AI traffic this week</h1>
        </td></tr>

        <tr><td style="padding-top:24px;"></td></tr>

        <!-- Property sections -->
        ${propertySections}

        <!-- Footer -->
        <tr><td style="padding-top:20px;border-top:1px solid ${BORDER};">
          <p style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:11px;color:${MUTED};margin:0;text-align:center;line-height:2;">
            This weekly digest is brought to you with 💙 by
            <a href="https://www.lovedby.ai?utm_source=digest&amp;utm_medium=email&amp;utm_campaign=weekly_digest" style="color:${INK};font-weight:600;text-decoration:none;">LovedByAI</a>
            &mdash; the #1 WordPress plugin for AI search optimization
          </p>
          <p style="font-family:Figtree,'Segoe UI',system-ui,sans-serif;font-size:11px;color:${MUTED};margin:8px 0 0;text-align:center;">
            <a href="${unsubUrl}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

interface Subscription {
  id: string;
  email: string;
  google_email: string;
  ga4_property_id: string;
  ga4_property_name: string | null;
  encrypted_refresh_token: string;
  unsubscribe_token: string;
}

async function fetchActiveSubscriptions(
  supabaseUrl: string,
  serviceKey: string
): Promise<Subscription[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/weekly_digest_subscriptions?is_active=eq.true&select=id,email,google_email,ga4_property_id,ga4_property_name,encrypted_refresh_token,unsubscribe_token`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

async function recordSend(
  supabaseUrl: string,
  serviceKey: string,
  subscriptionId: string,
  status: "success" | "error",
  resendMessageId?: string,
  errorMessage?: string
): Promise<void> {
  await fetch(`${supabaseUrl}/rest/v1/weekly_digest_sends`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      status,
      resend_message_id: resendMessageId ?? null,
      error_message: errorMessage ?? null,
    }),
  });
}

async function updateLastSent(
  supabaseUrl: string,
  serviceKey: string,
  subscriptionIds: string[]
): Promise<void> {
  for (const id of subscriptionIds) {
    await fetch(
      `${supabaseUrl}/rest/v1/weekly_digest_subscriptions?id=eq.${id}`,
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ last_sent_at: new Date().toISOString() }),
      }
    );
  }
}

// ── Resend ────────────────────────────────────────────────────────────────────

async function sendEmail(
  resendKey: string,
  to: string,
  html: string,
  subject: string
): Promise<{ id?: string; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AI Traffic Digest <digest@isaisendingmetraffic.com>",
      to: [to],
      subject,
      html,
    }),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok) return { error: data.message ?? "Resend error" };
  return { id: data.id };
}

// ── Scheduled handler ─────────────────────────────────────────────────────────

export default {
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log("[digest] Weekly digest job starting");

    const decryptKey = await getDecryptionKey(env.DIGEST_ENCRYPTION_KEY);
    const subscriptions = await fetchActiveSubscriptions(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (subscriptions.length === 0) {
      console.log("[digest] No active subscriptions");
      return;
    }

    // Group by email — one email per subscriber containing all their properties
    const byEmail = new Map<string, Subscription[]>();
    for (const sub of subscriptions) {
      const list = byEmail.get(sub.email) ?? [];
      list.push(sub);
      byEmail.set(sub.email, list);
    }

    console.log(`[digest] Sending to ${byEmail.size} recipients`);

    for (const [email, subs] of byEmail) {
      const propertiesData: PropertyDigestData[] = [];
      const successfulSubIds: string[] = [];

      for (const sub of subs) {
        try {
          const refreshToken = await decryptToken(
            sub.encrypted_refresh_token,
            decryptKey
          );
          const accessToken = await refreshAccessToken(
            refreshToken,
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET
          );
          if (!accessToken) {
            await recordSend(
              env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
              sub.id, "error", undefined, "Token refresh failed"
            );
            continue;
          }

          const data = await fetchPropertyDigest(
            accessToken,
            sub.ga4_property_id,
            sub.ga4_property_name ?? sub.ga4_property_id
          );
          propertiesData.push(data);
          successfulSubIds.push(sub.id);
        } catch (e: unknown) {
          const msg = (e as Error).message ?? "unknown";
          console.error(`[digest] Property ${sub.ga4_property_id} failed:`, msg);
          await recordSend(
            env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
            sub.id, "error", undefined, msg
          );
        }
      }

      if (propertiesData.length === 0) continue;

      // Use the unsubscribe token of the first sub in the group (one email = one unsub link)
      const unsubToken = subs[0].unsubscribe_token;
      const html = buildEmailHtml(propertiesData, email, unsubToken, env.APP_BASE_URL);
      const totalSessions = propertiesData.reduce((sum, p) => sum + p.totalSessions, 0);
      const topSource = [...propertiesData].sort((a, b) => b.totalSessions - a.totalSessions)[0]?.topSources[0]?.label;
      const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const subject =
        topSource && totalSessions > 0
          ? `${topSource} sent you ${totalSessions.toLocaleString()} visits this week`
          : `Your AI traffic this week · ${dateStr}`;
      const result = await sendEmail(env.RESEND_API_KEY, email, html, subject);

      for (const id of successfulSubIds) {
        await recordSend(
          env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
          id,
          result.error ? "error" : "success",
          result.id,
          result.error
        );
      }

      if (!result.error) {
        await updateLastSent(
          env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
          successfulSubIds
        );
        console.log(`[digest] Sent to ${email} (${propertiesData.length} properties)`);
      } else {
        console.error(`[digest] Failed to send to ${email}:`, result.error);
      }
    }

    console.log("[digest] Job complete");
  },
};
