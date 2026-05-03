import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/bing")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const clientId = process.env.BING_WEBMASTER_CLIENT_ID;
        if (!clientId) {
          return new Response("Bing Webmaster OAuth not configured", { status: 500 });
        }

        const url = new URL(request.url);
        const origin = url.origin;

        const authUrl = new URL("https://www.bing.com/webmasters/OAuth/authorize");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", `${origin}/auth/bing/callback`);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "webmaster.read");

        return new Response(null, {
          status: 302,
          headers: { Location: authUrl.toString() },
        });
      },
    },
  },
});
