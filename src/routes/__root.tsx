import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

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

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is IsAISendingMeTraffic.com?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It's a simple way to check whether AI tools like ChatGPT are already sending traffic to your website. Connect your Google Analytics account and instantly see referral traffic from AI sources like ChatGPT, Perplexity, Claude, Gemini, Grok, and DeepSeek.",
          },
        },
        {
          "@type": "Question",
          name: "Does it cost anything?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nope. You can run the check for free.",
          },
        },
        {
          "@type": "Question",
          name: "What does AI traffic mean?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It means visits to your site that appear to have come from AI tools and assistants, based on the referral data GA4 gives us. It's helpful, but it's not perfect. Some AI-driven visits may still be hidden, unattributed, or grouped somewhere else.",
          },
        },
        {
          "@type": "Question",
          name: "What if it says I'm not getting AI traffic yet?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "That's actually pretty normal. A lot of small businesses are still very early here. A low number does not mean this channel is not important. It usually just means the traffic is still small, hard to spot, or has room to grow.",
          },
        },
        {
          "@type": "Question",
          name: "Does this change anything in my GA4 account?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Not at all. This is read-only, so nothing gets changed or reconfigured.",
          },
        },
        {
          "@type": "Question",
          name: "Why should I care if AI is sending me traffic?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Because it can be an early signal that people are already discovering your business in new ways. Even a small amount of AI traffic can be interesting. It may mean your site is starting to show up in the tools people use to research, compare options, and make decisions.",
          },
        },
      ],
    };

    const schemaScripts = [
      {
        tag: "script" as const,
        attrs: { type: "application/ld+json" },
        children: JSON.stringify(organizationSchema),
      },
      {
        tag: "script" as const,
        attrs: { type: "application/ld+json" },
        children: JSON.stringify(webAppSchema),
      },
      {
        tag: "script" as const,
        attrs: { type: "application/ld+json" },
        children: JSON.stringify(faqSchema),
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
          "Free AI traffic checker — connect your Google Analytics and instantly see if ChatGPT, Perplexity, Claude, Gemini, and other AI tools are sending visitors to your website.",
      },
      { property: "og:title", content: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      {
        property: "og:description",
        content:
          "Connect your Google Analytics and instantly see if ChatGPT, Perplexity, Claude, and other AI tools are sending you traffic. Free, private, read-only.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://isaisendingmetraffic.com" },
      { property: "og:site_name", content: "Is AI Sending Me Traffic?" },
      { property: "og:image", content: "https://isaisendingmetraffic.com/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Is AI Sending Me Traffic? — Free AI Traffic Checker",
      },
      {
        name: "twitter:description",
        content:
          "Connect your Google Analytics and instantly see if AI tools are sending you traffic. Free, private, read-only.",
      },
      { name: "twitter:image", content: "https://isaisendingmetraffic.com/og-image.png" },
      { name: "twitter:site", content: "@lovedbyai2" },
      { name: "twitter:creator", content: "@lovedbyai2" },
      { name: "robots", content: "index, follow" },
    ],
    links: [
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "canonical", href: "https://isaisendingmetraffic.com" },
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-FN2B9XNHVL" />
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-FN2B9XNHVL');` }} />
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
