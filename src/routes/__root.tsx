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
          name: "How do I check if AI is sending me traffic?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Connect your Google Analytics account to IsAISendingMeTraffic.com. The tool scans your GA4 data for referral traffic from AI sources like ChatGPT, Perplexity, Claude, Gemini, Grok, and DeepSeek — completely free and with read-only access.",
          },
        },
        {
          "@type": "Question",
          name: "Which AI tools can send traffic to my website?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AI tools that can send referral traffic include ChatGPT (chat.openai.com), Perplexity (perplexity.ai), Google Gemini (gemini.google.com), Anthropic Claude (claude.ai), xAI Grok (grok.com), Microsoft Copilot (copilot.microsoft.com), and DeepSeek (deepseek.com). These AI search engines and assistants cite websites in their responses, generating referral traffic visible in Google Analytics.",
          },
        },
        {
          "@type": "Question",
          name: "Is this AI traffic checker free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, IsAISendingMeTraffic.com is completely free. It uses read-only access to your Google Analytics — it cannot modify your analytics setup. Your access tokens stay in an encrypted session cookie on your device.",
          },
        },
        {
          "@type": "Question",
          name: "What is AI referral traffic?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "AI referral traffic is website visits that come from AI-powered tools and search engines. When users ask ChatGPT, Perplexity, or other AI assistants a question, these tools sometimes cite and link to websites in their answers. Visitors who click those links show up as AI referral traffic in Google Analytics.",
          },
        },
        {
          "@type": "Question",
          name: "What is Generative Engine Optimization (GEO)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Generative Engine Optimization (GEO) is the practice of optimizing your website content to be cited by AI search engines like ChatGPT, Perplexity, and Gemini. Unlike traditional SEO which focuses on ranking in search results, GEO focuses on getting your content referenced in AI-generated answers. IsAISendingMeTraffic.com helps you measure whether GEO efforts are working by tracking AI referral traffic.",
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
      scripts: [...gaScripts, ...schemaScripts],
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
      { property: "og:image", content: "https://isaisendingmetraffic.com/isaisendingmetraffic-logo.png" },
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
      { name: "twitter:image", content: "https://isaisendingmetraffic.com/isaisendingmetraffic-logo.png" },
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
