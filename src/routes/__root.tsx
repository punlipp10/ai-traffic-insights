import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => {
    const gaMeasurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
    const gaScripts = gaMeasurementId && !gaMeasurementId.startsWith("G-XXXX")
      ? [
          {
            tag: "script" as const,
            attrs: {
              async: true,
              src: `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`,
            },
          },
          {
            tag: "script" as const,
            children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}');`,
          },
        ]
      : [];

    return {
      scripts: gaScripts,
      meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Is AI Sending Me Traffic?" },
      {
        name: "description",
        content:
          "Connect your GA4 and see whether ChatGPT and other AI tools are already sending visitors to your site. Free, private, quick.",
      },
      { property: "og:title", content: "Is AI Sending Me Traffic?" },
      {
        property: "og:description",
        content:
          "Connect your GA4 and instantly see if AI tools are sending you traffic.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://isaisendingmetraffic.com" },
      { property: "og:site_name", content: "Is AI Sending Me Traffic?" },
      { name: "twitter:card", content: "summary" },
      {
        name: "twitter:title",
        content: "Is AI Sending Me Traffic?",
      },
      {
        name: "twitter:description",
        content:
          "Connect your GA4 and instantly see if AI tools are sending you traffic.",
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Figtree:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
