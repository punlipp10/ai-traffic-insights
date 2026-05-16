import { createServerFn } from "@tanstack/react-start";
import {
  useSession,
  updateSession,
  clearSession,
  getRequestUrl,
} from "@tanstack/react-start/server";

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

export const getGoogleAuthUrl = createServerFn({ method: "GET" }).handler(
  async () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new Error("Google OAuth is not configured");
    }

    const requestUrl = getRequestUrl();
    const origin = new URL(requestUrl).origin;

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", `${origin}/auth/callback`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      "https://www.googleapis.com/auth/analytics.readonly"
    );
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return { url: authUrl.toString() };
  }
);

export const exchangeGoogleCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; origin: string }) => input)
  .handler(async ({ data }) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth is not configured");
    }

    // Use the origin passed from the client (same origin the OAuth flow started from)
    const origin = data.origin;

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: data.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/auth/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokens);
      throw new Error("Failed to authenticate with Google");
    }

    // Fetch the user's email from Google
    let googleEmail: string | undefined;
    try {
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        googleEmail = userInfo.email;
      }
    } catch {
      // non-fatal
    }

    await updateSession<SessionData>(getSessionConfig(), {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: Date.now() + tokens.expires_in * 1000,
      googleEmail,
    });

    return { success: true };
  });

export const getSessionStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<SessionData>(getSessionConfig());
    return {
      isAuthenticated: !!session.data.googleAccessToken,
    };
  }
);

export const getValidAccessToken = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<SessionData>(getSessionConfig());
    const { googleAccessToken, googleRefreshToken, googleTokenExpiry } =
      session.data;

    if (!googleAccessToken) {
      throw new Error("Not authenticated");
    }

    // Token still valid
    if (googleTokenExpiry && Date.now() < googleTokenExpiry - 60000) {
      return { accessToken: googleAccessToken };
    }

    // Refresh the token
    if (!googleRefreshToken) {
      throw new Error("No refresh token available");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: googleRefreshToken,
        client_id: clientId!,
        client_secret: clientSecret!,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error("Failed to refresh Google token");
    }

    await updateSession<SessionData>(getSessionConfig(), {
      googleAccessToken: data.access_token,
      googleRefreshToken: googleRefreshToken,
      googleTokenExpiry: Date.now() + data.expires_in * 1000,
    });

    return { accessToken: data.access_token };
  }
);

export const logoutGoogle = createServerFn({ method: "POST" }).handler(
  async () => {
    await clearSession(getSessionConfig());
    return { success: true };
  }
);
