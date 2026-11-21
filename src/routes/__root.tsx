import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";

const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-FN2B9XNHVL";

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

    // JSON-LD structured data
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "LovedBy.ai",
      url: "https://www.lovedby.ai",
      logo: "https://isaisendingmetraffic.com/isaisendingmetraffic-logo.png",
      foundingDate: "2025",
      telephone: "+972549363466",
      sameAs: [
        "https://x.com/lovedbyai2",
        "https://www.linkedin.com/company/lovedbyai",
        "https://www.facebook.com/people/Lovedbyai/61585442379437/",
        "https://www.youtube.com/@lovedbyai2",
      ],
    };

    const webAppSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Is AI Sending Me Traffic?",
      url: "https://isaisendingmetraffic.com",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Free AI traffic checker — connect Google Analytics and instantly see if ChatGPT, Perplexity, Claude, Gemini, and other AI tools are sending visitors to your website.",
      creator: {
        "@type": "Organization",
        name: "LovedBy.ai",
        url: "https://www.lovedby.ai",
      },
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Is AI Sending Me Traffic?",
      url: "https://isaisendingmetraffic.com",
      description: "Free tool to check if ChatGPT, Perplexity, Claude, Gemini, and other AI tools are sending traffic to your website via Google Analytics.",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://isaisendingmetraffic.com",
        "query-input": "required name=search_term_string",
      },
    };


    const schemaScripts = [
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(webAppSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteSchema),
      },
    ];

    return {
      scripts: [...schemaScripts],
      meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0d9373" },
      { title: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      {
        name: "description",
        content:
          "Is AI sending me traffic? Connect your Google Analytics and instantly see if ChatGPT, Perplexity, Claude, Gemini, Grok, and other AI tools are sending visitors to your website. Free, private, read-only.",
      },
      { property: "og:title", content: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      {
        property: "og:description",
        content:
          "Is AI sending me traffic? Connect Google Analytics and instantly find out. See visits from ChatGPT, Perplexity, Claude, Gemini and more. Free, private, 30 seconds.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://isaisendingmetraffic.com/" },
      { property: "og:site_name", content: "Is AI Sending Me Traffic?" },
      { property: "og:image", content: "https://isaisendingmetraffic.com/social-share-image-isaisendingmetraffic.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Is AI Sending Me Traffic? — Free AI Traffic Checker",
      },
      {
        name: "twitter:description",
        content:
          "Is AI sending me traffic? Connect Google Analytics and instantly see visits from ChatGPT, Perplexity, Claude, Gemini and more. Free, 30 seconds.",
      },
      { name: "twitter:image", content: "https://isaisendingmetraffic.com/social-share-image-isaisendingmetraffic.png" },
      { name: "twitter:image:alt", content: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      { name: "twitter:site", content: "@lovedbyai2" },
      { name: "twitter:creator", content: "@lovedbyai2" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://fonts.googleapis.com" },
      { rel: "dns-prefetch", href: "https://fonts.gstatic.com" },
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

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${GA_MEASUREMENT_ID}');`,
          }}
        />
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
