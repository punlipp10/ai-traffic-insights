import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

// ── Session config (mirrors tracking.functions.ts) ───────────────────────────
interface SessionData {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
  googleEmail?: string;
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
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── AES-GCM encryption using the Web Crypto API (CF Workers + Node 20+) ──────
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = process.env.DIGEST_ENCRYPTION_KEY;
  if (!keyBase64) throw new Error("DIGEST_ENCRYPTION_KEY not set");
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

// ── Server fns ────────────────────────────────────────────────────────────────

/**
 * Returns the Google email + whether a refresh token is present in the session.
 * Used to pre-fill the subscribe modal.
 */
export const getSessionEmail = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<SessionData>(getSessionConfig());
    return {
      googleEmail: session.data?.googleEmail ?? null,
      hasRefreshToken: Boolean(session.data?.googleRefreshToken),
    };
  }
);

/**
 * Returns active digest subscription(s) for the current Google account.
 * If propertyId is provided, also returns whether that specific property is subscribed.
 */
export const getDigestStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { propertyId: string }) => input)
  .handler(async ({ data }) => {
    const session = await useSession<SessionData>(getSessionConfig());
    const googleEmail = session.data?.googleEmail;
    if (!googleEmail) {
      return { subscribed: false, digestEmail: null, subscriptionId: null };
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return { subscribed: false, digestEmail: null, subscriptionId: null };
    }

    const { data: row } = await supabase
      .from("weekly_digest_subscriptions")
      .select("id, email")
      .eq("google_email", googleEmail)
      .eq("ga4_property_id", data.propertyId)
      .eq("is_active", true)
      .maybeSingle();

    return {
      subscribed: Boolean(row),
      digestEmail: row?.email ?? null,
      subscriptionId: row?.id ?? null,
    };
  });

/**
 * Creates or re-activates a digest subscription for the current session.
 * Reads the refresh token from the session, encrypts it, and stores it.
 */
export const subscribeToDigest = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { digestEmail: string; propertyId: string; propertyName: string }) =>
      input
  )
  .handler(async ({ data }) => {
    // Validate email format server-side
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(data.digestEmail)) {
      throw new Error("Invalid email address");
    }
    if (data.digestEmail.length > 254) {
      throw new Error("Email address is too long");
    }

    const session = await useSession<SessionData>(getSessionConfig());
    const googleEmail = session.data?.googleEmail;
    const refreshToken = session.data?.googleRefreshToken;

    if (!googleEmail || !refreshToken) {
      throw new Error("not_authenticated");
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Database not configured");

    const encryptedToken = await encryptToken(refreshToken);

    // Upsert: if (email, propertyId) exists, update it (re-activate + update token)
    const { error } = await supabase
      .from("weekly_digest_subscriptions")
      .upsert(
        {
          email: data.digestEmail.toLowerCase().trim(),
          google_email: googleEmail,
          ga4_property_id: data.propertyId,
          ga4_property_name: data.propertyName,
          encrypted_refresh_token: encryptedToken,
          is_active: true,
        },
        { onConflict: "email,ga4_property_id" }
      );

    if (error) throw new Error(error.message);

    return { ok: true };
  });

/**
 * Deactivates a subscription. Verifies ownership via session googleEmail.
 */
export const unsubscribeDigest = createServerFn({ method: "POST" })
  .inputValidator((input: { subscriptionId: string }) => input)
  .handler(async ({ data }) => {
    const session = await useSession<SessionData>(getSessionConfig());
    const googleEmail = session.data?.googleEmail;
    if (!googleEmail) throw new Error("not_authenticated");

    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Database not configured");

    const { error } = await supabase
      .from("weekly_digest_subscriptions")
      .update({ is_active: false })
      .eq("id", data.subscriptionId)
      .eq("google_email", googleEmail); // ownership check

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Updates the destination email for a subscription.
 * Verifies ownership via session googleEmail.
 */
export const updateDigestEmail = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { subscriptionId: string; newEmail: string }) => input
  )
  .handler(async ({ data }) => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(data.newEmail)) throw new Error("Invalid email address");
    if (data.newEmail.length > 254) throw new Error("Email address is too long");

    const session = await useSession<SessionData>(getSessionConfig());
    const googleEmail = session.data?.googleEmail;
    if (!googleEmail) throw new Error("not_authenticated");

    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Database not configured");

    const { error } = await supabase
      .from("weekly_digest_subscriptions")
      .update({ email: data.newEmail.toLowerCase().trim() })
      .eq("id", data.subscriptionId)
      .eq("google_email", googleEmail); // ownership check

    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Public unsubscribe — no auth required, uses the one-way token.
 */
export const unsubscribeByToken = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    if (!data.token || data.token.length !== 64 || !/^[0-9a-f]+$/.test(data.token)) {
      throw new Error("Invalid token");
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("Database not configured");

    const { data: row, error: fetchErr } = await supabase
      .from("weekly_digest_subscriptions")
      .select("id, email, ga4_property_name")
      .eq("unsubscribe_token", data.token)
      .maybeSingle();

    if (fetchErr) throw new Error(fetchErr.message);
    if (!row) throw new Error("not_found");

    const { error } = await supabase
      .from("weekly_digest_subscriptions")
      .update({ is_active: false })
      .eq("id", row.id);

    if (error) throw new Error(error.message);

    return {
      ok: true,
      email: row.email,
      propertyName: row.ga4_property_name ?? "your property",
    };
  });
