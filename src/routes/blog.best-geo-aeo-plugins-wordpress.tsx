import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const SITE = "https://isaisendingmetraffic.com";
const SLUG = "best-geo-aeo-plugins-wordpress";
const PAGE_URL = `${SITE}/blog/${SLUG}`;
const PUBLISHED = "2026-11-21";
const UPDATED = "2026-11-21";
const UPDATED_LABEL = "21 November 2026";
const TITLE = "Best GEO and AEO Plugins for WordPress (2027), Compared";
const DESCRIPTION =
  "Seven WordPress plugins for AI search compared: what each does for ChatGPT, Gemini and Google AI Overviews, who it suits and what it costs.";
const OG_IMAGE = `${SITE}/social-share-image-isaisendingmetraffic.png`;

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

const LBA_UTM = "utm_source=isaisendingmetraffic&utm_medium=referral&utm_campaign=best-geo-plugins";

/* ------------------------------------------------------------------ */
/* Data: one source for the table, the sections and the ItemList schema */
/* ------------------------------------------------------------------ */

interface Plugin {
  id: string;
  name: string;
  heading: string;
  url: string;
  bestFor: string;
  tableFeatures: string;
  freePlan: string;
  paidPrice: string;
  summary: string;
  does: string[];
  price: string[];
  stops: string[];
  note?: ReactNode;
}

const PLUGINS: Plugin[] = [
  {
    id: "lovedbyai",
    name: "LovedByAI",
    heading:
      "LovedByAI for AI search: best for small businesses and WooCommerce stores that want the work done for them",
    url: `https://www.lovedby.ai/?${LBA_UTM}`,
    bestFor:
      "Small-business and WooCommerce sites that want the on-page AI search work done automatically",
    tableFeatures:
      "Question-led headings with short answers, auto FAQs, FAQ and Organization schema, AI-ready page versions, AI crawler and AI referral tracking, ChatGPT (ACP) and UCP product feeds",
    freePlan: "Yes, one page fully optimized",
    paidPrice: "From $29/mo billed yearly ($39 month to month)",
    summary:
      "LovedByAI is a WordPress and WooCommerce plugin built only for AI search. Where the SEO plugins below give you tools, LovedByAI does the on-page rewriting itself and asks you to approve it.",
    does: [
      "Rewrites headings as the questions customers type into ChatGPT and adds a short, quotable answer under each one, taken from your own content.",
      "Writes FAQ sections from your pages, with FAQPage schema, and adds Organization schema that merges into what Yoast, Rank Math, AIOSEO or SEOPress already output instead of duplicating it.",
      "Builds a plain, structured AI-ready version of every page, linked from your footer. You choose whether approved changes also go live on the page visitors see.",
      "Lists every change page by page so you can approve, reject or undo it.",
      "Shows which AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot and others) visit and which pages they read, counts visitors referred by ChatGPT, Perplexity, Gemini and Claude per page, and checks your robots.txt against every AI crawler.",
      "For WooCommerce, builds a product feed in OpenAI's Agentic Commerce Protocol (ACP) format for ChatGPT and publishes a Universal Commerce Protocol (UCP) catalog for AI shopping agents, both kept current as products change.",
      "Also generates llms.txt, pings IndexNow and adds WebMCP tools for AI agents, and works across WPML and Polylang languages.",
    ],
    price: [
      "Free: one page fully optimized, no credit card.",
      "Pro: $29/mo billed yearly ($348/yr) or $39 month to month, 200 pages.",
      "Business: $59/mo billed yearly, 1,000 pages.",
      "eCommerce: $149/mo billed yearly, 2,000 pages, includes the ChatGPT (ACP) and UCP product feeds.",
      "Paid plans start with a 7-day free trial.",
    ],
    stops: [
      "It is not an SEO plugin. Keep Yoast, Rank Math or similar for sitemaps, redirects and Google's classic results; LovedByAI runs alongside them.",
      "It needs a lovedby.ai account, and the optimization runs on LovedByAI's servers.",
      "The free plan covers one page, and the shopping feeds are only on the eCommerce plan.",
    ],
    note: (
      <>
        Disclosure: LovedByAI is made by the same team as this site. Weigh this entry with that in
        mind and check the{" "}
        <ExtLink href="https://wordpress.org/plugins/lovedbyai-seo-for-llms-and-ai-search/">
          wordpress.org listing
        </ExtLink>{" "}
        yourself.
      </>
    ),
  },
  {
    id: "squirrly",
    name: "GEO Plugin by Squirrly SEO",
    heading:
      "GEO Plugin by Squirrly SEO for AI search: best for an all-in-one SEO suite with GEO audits",
    url: "https://wordpress.org/plugins/squirrly-seo/",
    bestFor:
      "Owners who want a full SEO suite with GEO audits and AI crawler controls in one plugin",
    tableFeatures:
      "GEO/AEO audit and score, AI crawler controls, llms.txt and llms-full.txt, IndexNow and Google Indexing API, FAQ/HowTo/Article schema, MCP connection",
    freePlan: "Yes",
    paidPrice: "PRO $19.99/mo billed yearly",
    summary:
      'Squirrly SEO now lists itself on wordpress.org as "GEO Plugin by Squirrly SEO". It is a complete SEO plugin with AI search features layered on top.',
    does: [
      "A GEO/AEO audit that scores pages for how ready they are to be used as an answer.",
      "Controls for AI crawlers including GPTBot, ClaudeBot, PerplexityBot and Google-Extended.",
      "Generates llms.txt and llms-full.txt, and submits pages through IndexNow and the Google Indexing API.",
      "FAQ, HowTo and Article schema.",
      "An MCP connection so Claude or ChatGPT can read and update your SEO settings.",
    ],
    price: [
      "Free plugin on wordpress.org; the cloud tools need a free Squirrly account.",
      "PRO: $19.99/mo billed yearly. Business: $71.99/mo.",
    ],
    stops: [
      "The listing describes audits, scores and controls rather than automatic rewriting of your pages, so expect to make the content changes yourself.",
      "It is a full SEO suite. If you already run Yoast or Rank Math, you would be replacing it, not adding to it.",
    ],
  },
  {
    id: "answer-engine-optimization",
    name: "Answer Engine Optimization",
    heading:
      "Answer Engine Optimization plugin for AI search: best free option for hands-on owners",
    url: "https://wordpress.org/plugins/answer-engine-optimization/",
    bestFor:
      "Hands-on owners who want free FAQ and Speakable schema, llms.txt and crawler controls with no account",
    tableFeatures:
      "FAQPage and Speakable schema, FAQ and direct-answer blocks, llms.txt and Markdown pages, controls for 28 AI crawlers, AI traffic log, Perplexity citation checks",
    freePlan: "Yes, fully free",
    paidPrice: "Optional Pro add-on (price not listed)",
    summary:
      "A small, free plugin on wordpress.org that packs a lot of AEO plumbing into one install. Its listing says everything in it works without paying.",
    does: [
      "Outputs one JSON-LD graph with FAQPage and Speakable nodes.",
      "Gives you FAQ and direct-answer blocks marked up for answer engines.",
      "Generates llms.txt, llms-full.txt and Markdown versions of your pages.",
      "Controls for 28 AI crawlers, an AI traffic log, IndexNow and an AEO score.",
      "Checks citations in Perplexity (5 prompts per scan) for free; ChatGPT, Gemini and Claude checks are in the paid Pro add-on.",
    ],
    price: ["Free. A Pro add-on exists; its price is not shown on the listing."],
    stops: [
      "The blocks are tools: you still write the questions and answers.",
      "It is young (version 1.3.0, 100+ active installs at our check), so expect less support than the big plugins.",
    ],
  },
  {
    id: "rank-math",
    name: "Rank Math",
    heading:
      "Rank Math for AI search: best for Rank Math sites that want AI writing and ChatGPT and Gemini tracking",
    url: "https://rankmath.com/ai-visibility/",
    bestFor:
      "Sites already on Rank Math that want AI writing tools and brand tracking in ChatGPT and Gemini",
    tableFeatures:
      "llms.txt module, 16+ schema types incl. FAQ and HowTo, Content AI writing tools, AI Visibility brand tracking (ChatGPT, Gemini)",
    freePlan: "Yes",
    paidPrice: "PRO $8.99/mo billed yearly; Rank Math AI from $6.99/mo billed yearly",
    summary:
      "Rank Math is the plugin AI engines name most often when asked about WordPress and AI search (39% of answers in our tracker run). It covers the technical base well and now sells AI tools as a separate subscription.",
    does: [
      "An llms.txt module in the free plugin (its free changelog has llms.txt fixes as recently as November 2026).",
      "16+ schema types, including FAQ and HowTo blocks.",
      "Content AI: 40+ AI writing and SEO tools inside WordPress.",
      "AI Visibility: tracks whether, how often and in what context ChatGPT and Gemini mention your brand, with sentiment, citations and competitor comparison.",
    ],
    price: [
      "Free plugin.",
      "PRO: $8.99/mo billed yearly. Business: $27.99/mo. Agency: $64.99/mo (all billed yearly, regular prices).",
      "Rank Math AI (Content AI plus AI Visibility) is a separate subscription from $6.99/mo billed yearly (Starter, 1 brand tracked). PRO, Business and Agency include some monthly AI usage.",
    ],
    stops: [
      "AI Visibility covered ChatGPT and Gemini at our check, not Perplexity or Claude.",
      "Content AI helps you write; it does not restructure your existing pages on its own.",
    ],
  },
  {
    id: "yoast",
    name: "Yoast SEO",
    heading:
      "Yoast SEO for AI search: best for a free llms.txt and AI brand reports across four assistants",
    url: "https://yoast.com/features/llms-txt/",
    bestFor:
      "Sites that want a free llms.txt and a clean schema graph, plus paid AI brand reports across four assistants",
    tableFeatures:
      "Free llms.txt, schema graph, FAQ and HowTo blocks; Premium AI bot blocker; AI Brand Insights (ChatGPT, Gemini, Claude, Perplexity) in AI+",
    freePlan: "Yes, includes llms.txt",
    paidPrice: "Premium $118.80/yr; AI+ $358.80/yr",
    summary:
      "Yoast SEO has 10+ million active installs on wordpress.org. Its free version already covers the AI search basics, and the AI+ plan adds reporting on how AI assistants describe your brand.",
    does: [
      "llms.txt in the free plugin, with manual control over which pages go in it.",
      "A connected schema graph, plus FAQ and HowTo blocks with schema.",
      "Premium adds a bot blocker for GPTBot, CCBot and Google-Extended, AI writing tools and schema aggregation for NLWeb.",
      "AI+ adds AI Brand Insights: a weekly analysis of how ChatGPT, Gemini, Claude and Perplexity talk about your brand, with sentiment, competitor benchmarks, citation analysis and up to five custom questions.",
    ],
    price: [
      "Free plugin.",
      "Premium: $118.80/yr. WooCommerce SEO: $178.80/yr.",
      "AI+ (AI Brand Insights plus WooCommerce SEO): $358.80/yr. All ex VAT.",
    ],
    stops: [
      "AI Brand Insights reports on mentions; it does not change your pages.",
      "One weekly analysis per brand; more brands need more subscriptions.",
    ],
  },
  {
    id: "aioseo",
    name: "All in One SEO (AIOSEO)",
    heading:
      "All in One SEO (AIOSEO) for AI search: best for AI writing credits and AI keyword reports in one SEO plugin",
    url: "https://aioseo.com/features/ai-suite/",
    bestFor:
      "Sites that want AI writing credits and AI search keyword reports bundled into their SEO plugin",
    tableFeatures:
      "llms.txt (free), AI generator for titles, descriptions and FAQs, AI Suite with AI search keyword reports, AI credits on every paid plan",
    freePlan: "Yes (AIOSEO Lite), includes llms.txt",
    paidPrice: "From $99/yr regular (first year discounted)",
    summary:
      'AIOSEO\'s wordpress.org listing now leads with "AI SEO". It bundles AI writing, llms.txt and AI search reporting into one plugin.',
    does: [
      "An llms.txt generator for all users, Lite included; llms-full.txt and Markdown settings need Pro.",
      "AI generation of SEO titles, meta descriptions, FAQs and image alt text.",
      "The AI Suite, including AI Insights for tracking AI search, on all paid plans. Its keyword reports are free to all users, Lite included, during the current beta.",
      "AI credits included with every paid plan (10,000 on Basic).",
    ],
    price: [
      "AIOSEO Lite: free.",
      "Basic $99/yr (1 site), Plus $199/yr, Pro $399/yr, Elite $599/yr at regular price. A 50% first-year discount was running at our check; renewals are at full price.",
    ],
    stops: [
      "The AI tools run on credits, and the AI Writing Assistant needs a separate SEOBoost subscription.",
      "Like the other SEO suites, it gives you tools; the rewriting is yours to do.",
    ],
  },
  {
    id: "seopress",
    name: "SEOPress",
    heading:
      "SEOPress for AI search: best for low-cost AI meta generation with your choice of AI provider",
    url: "https://www.seopress.org/wordpress-seo-plugins/pro/",
    bestFor:
      "Budget-minded sites and freelancers who want bulk AI meta generation with a choice of AI provider",
    tableFeatures:
      "Bulk AI titles, descriptions, social tags and alt text (OpenAI, Gemini, Claude, Mistral, DeepSeek), llms.txt and agent readiness, schema editor, MCP server",
    freePlan: "Yes (llms.txt and AI in PRO)",
    paidPrice: "PRO from $49/yr; unlimited sites $149/yr",
    summary:
      "SEOPress is a lighter, lower-priced SEO plugin that has added AI generation and llms.txt to its PRO version.",
    does: [
      "Generates SEO titles, meta descriptions, Open Graph and X cards and image alt text in bulk with OpenAI, Google Gemini, Anthropic Claude, Mistral or DeepSeek (PRO).",
      'llms.txt and "Agent Readiness" settings (PRO).',
      "Basic schema in the free plugin; a JSON-LD editor and automatic schemas in PRO.",
      "An MCP server (added in version 10.4).",
    ],
    price: ["Free plugin.", "PRO from $49/yr for 1 site; unlimited sites $149/yr."],
    stops: [
      "No AI answer or brand mention tracking is listed.",
      "AI generation covers metadata, not the body of your pages.",
    ],
  },
];

interface Faq {
  q: string;
  a: string;
}

const FAQS: Faq[] = [
  {
    q: "What's the best WordPress plugin to get my business recommended by ChatGPT and Google's AI?",
    a: "There is no single best one; it depends on how much of the work you want done for you. If you want the on-page work automated (question-led headings, FAQs, schema, an AI-ready version of each page and AI traffic reports), LovedByAI is built for that, and it is made by the team behind this site. If you already run Yoast SEO or Rank Math and are happy to edit pages yourself, turn on their llms.txt and FAQ blocks first. No plugin can guarantee a recommendation, because the AI engines choose their own sources.",
  },
  {
    q: "What's the best AI SEO plugin for a small business WordPress site?",
    a: "For a small business with no time to rewrite pages, pick a plugin that does the rewriting: LovedByAI automates it and has a free plan for one page. For a free, hands-on route, the Answer Engine Optimization plugin adds FAQ and Speakable schema and llms.txt, and you write the answers. Yoast SEO and Rank Math are good foundations but leave the content work to you.",
  },
  {
    q: "Is Yoast or Rank Math enough for AI search, or do I need a separate plugin?",
    a: "Yoast SEO and Rank Math cover the foundation: crawlable pages, schema, FAQ blocks and llms.txt, all in their free versions. Both now sell AI brand tracking too (Yoast AI+ at $358.80/yr, Rank Math AI from $6.99/mo billed yearly). What neither does automatically is restructure your existing pages into the question-and-answer shape AI answers are built from. On a small site you can do that by hand. On a larger site, or if you want it done for you, add a dedicated AI search plugin that runs alongside them.",
  },
  {
    q: "What tool can my agency use to offer AI search optimization to its WordPress clients?",
    a: "LovedByAI has an agency program: 20% of what referred clients spend, for life, or up to 30% off licenses you can move between client sites, an automatic monthly report per client, and white-label on request. If you only need SEO plugins across many sites, Rank Math Agency ($64.99/mo billed yearly), SEOPress unlimited sites ($149/yr) and AIOSEO Elite (100 sites, $599/yr regular) cover volume, but they leave the AI search content work to your team.",
  },
  {
    q: "How do I get my WooCommerce products to show up in ChatGPT shopping?",
    a: "ChatGPT shows products from merchants who give it a product feed in OpenAI's format. LovedByAI's eCommerce plan builds that Agentic Commerce Protocol (ACP) feed from your WooCommerce catalog and keeps it current, and also publishes a UCP catalog for other AI shopping agents. General feed plugins such as CTX Feed list ChatGPT Merchant among their channels. Either way, you submit the feed to OpenAI and OpenAI decides which products it shows.",
  },
  {
    q: "Does llms.txt help my WordPress site get cited by AI?",
    a: "Probably not much on its own. Across 82 million crawler requests to WordPress sites between December 2025 and May 2026, AI bots fetched an llms.txt file 31 times (LovedByAI llms.txt study). It is free to add in Yoast, Rank Math and AIOSEO Lite, so there is little reason not to, but clear question-led content, FAQs, schema and open crawler access matter more.",
  },
  {
    q: "How do I know if AI is already sending traffic to my WordPress site?",
    a: "Connect Google Analytics to the free checker on isaisendingmetraffic.com. It reads your GA4 data (read-only) and shows visits referred by ChatGPT, Perplexity, Claude, Gemini and other AI tools, so you have a baseline before and after you install any of these plugins.",
  },
];

/* ------------------------------------------------------------------ */
/* Route + head                                                        */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/blog/best-geo-aeo-plugins-wordpress")({
  head: () => {
    const publisher = {
      "@type": "Organization",
      name: "LovedByAI",
      url: "https://www.lovedby.ai",
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/isaisendingmetraffic-logo.png`,
      },
    };

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: TITLE,
      description: DESCRIPTION,
      image: OG_IMAGE,
      datePublished: PUBLISHED,
      dateModified: UPDATED,
      inLanguage: "en",
      mainEntityOfPage: { "@type": "WebPage", "@id": PAGE_URL },
      author: { "@type": "Organization", name: "LovedByAI team", url: "https://www.lovedby.ai" },
      publisher,
      about: ["Generative engine optimization", "Answer engine optimization", "WordPress plugins"],
    };

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "GEO and AEO plugins for WordPress (2027)",
      numberOfItems: PLUGINS.length,
      itemListOrder: "https://schema.org/ItemListUnordered",
      itemListElement: PLUGINS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${PAGE_URL}#${p.id}`,
        item: {
          "@type": "SoftwareApplication",
          name: p.name,
          applicationCategory: "WordPress plugin",
          operatingSystem: "WordPress",
          description: `Best for: ${p.bestFor}.`,
          url: p.url.split("?")[0],
        },
      })),
    };

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
        { "@type": "ListItem", position: 3, name: TITLE, item: PAGE_URL },
      ],
    };

    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "article" },
        { property: "og:url", content: PAGE_URL },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:image:alt", content: TITLE },
        { property: "article:published_time", content: PUBLISHED },
        { property: "article:modified_time", content: UPDATED },
        { name: "twitter:title", content: TITLE },
        { name: "twitter:description", content: DESCRIPTION },
        { name: "twitter:image:alt", content: TITLE },
      ],
      links: [{ rel: "canonical", href: PAGE_URL }],
      scripts: [articleSchema, itemListSchema, faqSchema, breadcrumbSchema].map((s) => ({
        type: "application/ld+json",
        children: JSON.stringify(s),
      })),
    };
  },
  component: BestGeoPluginsPost,
});

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
    >
      {children}
    </a>
  );
}

function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-mt-6 text-foreground font-bold leading-tight mt-14 mb-4"
      style={{ fontSize: "clamp(1.35rem, 3.6vw, 1.7rem)", letterSpacing: "-0.01em" }}
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="text-foreground font-semibold mt-6 mb-2 text-base">{children}</h3>;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
      {items.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function BestGeoPluginsPost() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: bodyFont }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-16">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground/60 flex gap-2">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/blog" className="hover:text-foreground transition-colors">
            Blog
          </Link>
        </nav>

        <article
          className="mt-8 text-muted-foreground leading-relaxed"
          style={{ fontSize: "1rem" }}
        >
          <header>
            <h1
              className="uppercase text-foreground font-bold"
              style={{
                fontFamily: displayFont,
                fontSize: "clamp(2.4rem, 8vw, 3.75rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
              }}
            >
              Best GEO and AEO plugins for WordPress (2027)
            </h1>
            <p className="mt-4 text-sm text-muted-foreground/70">
              Last updated <time dateTime={UPDATED}>{UPDATED_LABEL}</time> · By the LovedByAI team
            </p>
          </header>

          <div className="mt-8 space-y-4">
            <p>
              GEO (generative engine optimization) and AEO (answer engine optimization) plugins help
              a WordPress site get read, quoted and recommended by ChatGPT, Gemini, Perplexity,
              Claude and Google's AI Overviews. This guide compares seven of them: what each one
              actually does for AI search, who it suits, what it costs and where it stops. Every
              feature and price was checked on the vendor's own site or wordpress.org listing on{" "}
              {UPDATED_LABEL}.
            </p>
            <p className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
              Disclosure: isaisendingmetraffic.com is made by the team behind LovedByAI, one of the
              plugins on this list. We have tried to describe every plugin, ours included, by what
              its own listing and pricing page say, and to be plain about where each one stops.
            </p>
          </div>

          <H2 id="quick-answer">
            Quick answer: which WordPress plugin gets you recommended by ChatGPT and Google's AI?
          </H2>
          <div className="space-y-4">
            <p>
              There is no single best plugin, because they do different jobs. If you already run
              Yoast SEO or Rank Math, start there: both include llms.txt, schema and FAQ blocks for
              free. If you run a small business or WooCommerce store and want the AI search work
              done for you, LovedByAI automates the on-page changes and reports the AI traffic they
              bring. If you want to stay free and hands-on, the Answer Engine Optimization plugin
              gives you the schema and blocks to do it yourself. If what you want is a report on how
              AI assistants talk about your brand, Yoast AI+ covers four assistants and Rank Math AI
              covers ChatGPT and Gemini.
            </p>
            <p>
              How the list is ordered: it is not a ranking. The first three plugins are built around
              AI search; the last four are SEO plugins that have added AI search features. Within
              each group, plugins that do more of the work automatically come first.
            </p>
          </div>

          <H2 id="comparison">GEO and AEO plugins for WordPress compared</H2>
          <p className="sm:hidden mb-2 text-xs text-muted-foreground/70">
            Swipe the table sideways to see every column.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card lg:-mx-24">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">
                Comparison of WordPress GEO and AEO plugins, checked {UPDATED_LABEL}
              </caption>
              <thead className="text-foreground">
                <tr className="border-b border-border">
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Plugin
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Best for
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    AI search features
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Free plan
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">
                    Paid price (regular)
                  </th>
                </tr>
              </thead>
              <tbody>
                {PLUGINS.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 align-top">
                    <th scope="row" className="px-3 py-3 font-semibold text-foreground">
                      <a href={`#${p.id}`} className="hover:text-primary transition-colors">
                        {p.name}
                      </a>
                    </th>
                    <td className="px-3 py-3">{p.bestFor}</td>
                    <td className="px-3 py-3">{p.tableFeatures}</td>
                    <td className="px-3 py-3">{p.freePlan}</td>
                    <td className="px-3 py-3">{p.paidPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground/70">
            Prices in USD, regular (not promotional) and ex VAT, checked {UPDATED_LABEL}. Several
            vendors were running Black Friday discounts that day.
          </p>

          <H2 id="what-to-look-for">What a WordPress GEO or AEO plugin should do</H2>
          <div className="space-y-4">
            <p>
              AI answers lean on pages they can reach, parse and quote. A useful plugin helps with
              some of these five jobs:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
              <li>
                Crawler access: making sure GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and
                Google's crawlers are not blocked.
              </li>
              <li>
                Structured data: Organization, FAQPage and Product schema that state plainly who you
                are and what you sell.
              </li>
              <li>
                Question-shaped content: headings that match the questions people ask, each with a
                short answer an AI can lift.
              </li>
              <li>
                Product data: for stores, a feed AI shopping assistants can read with live prices
                and stock.
              </li>
              <li>
                Measurement: knowing which AI crawlers visit and whether AI tools send you visitors.
              </li>
            </ul>
            <p>
              The SEO suites cover the first two well. Few plugins do the third for you, and that is
              usually the gap between a site that is crawlable and a site that gets quoted.
            </p>
          </div>

          {PLUGINS.map((p) => (
            <section key={p.id} aria-labelledby={p.id}>
              <H2 id={p.id}>{p.heading}</H2>
              <div className="space-y-3">
                <p>{p.summary}</p>
                <p className="text-foreground">
                  <span className="font-semibold">Best for:</span> {p.bestFor}.
                </p>
                <H3>What {p.name} does for AI search</H3>
                <Bullets items={p.does} />
                <H3>{p.name} price</H3>
                <Bullets items={p.price} />
                <H3>Where {p.name} stops</H3>
                <Bullets items={p.stops} />
                {p.note && <p className="text-sm">{p.note}</p>}
                <p className="text-sm">
                  <ExtLink href={p.url}>{p.name} official page</ExtLink>
                </p>
              </div>
            </section>
          ))}

          <H2 id="yoast-rank-math-enough">
            Is Yoast or Rank Math enough for AI search, or do I need a separate plugin?
          </H2>
          <div className="space-y-4">
            <p>
              For the foundation, yes. Yoast SEO and Rank Math both keep your pages crawlable,
              output schema, include FAQ blocks and generate llms.txt in their free versions. Both
              have also added paid AI brand tracking: Yoast AI+ ($358.80/yr) reports weekly on
              ChatGPT, Gemini, Claude and Perplexity, and Rank Math AI (from $6.99/mo billed yearly)
              tracks ChatGPT and Gemini.
            </p>
            <p>
              What neither does on its own is rewrite your existing pages into the shape AI answers
              are built from: question-led headings, short direct answers and FAQs drawn from your
              content. Tracking tells you whether you are mentioned; it does not change the page.
            </p>
            <p>
              So: on a site with a handful of pages and someone with time to edit them, Yoast or
              Rank Math plus hand-written FAQs can be enough. On a bigger site, or if nobody has
              that time, add a dedicated AI search plugin. LovedByAI is built to run alongside
              Yoast, Rank Math, AIOSEO and SEOPress and merges its schema into theirs. Squirrly's
              GEO plugin is a full SEO suite, so it would replace your current SEO plugin rather
              than sit next to it.
            </p>
          </div>

          <H2 id="agencies">
            Which AI search optimization plugin is best for agencies with WordPress clients?
          </H2>
          <div className="space-y-4">
            <p>
              Agencies need three things: a price that works across many sites, proof for the
              client, and as little manual work per site as possible.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
              <li>
                LovedByAI has a dedicated agency program: 20% of what referred clients spend, for
                life, or up to 30% off licenses you buy in bulk and move between client sites. Each
                client gets an automatic monthly report (AI bot visits, mentions in AI answers,
                visitors from ChatGPT, Perplexity and Gemini, fixes applied), and white-label is
                available on request. Details on the{" "}
                <ExtLink href={`https://www.lovedby.ai/agencies?${LBA_UTM}`}>
                  LovedByAI agencies page
                </ExtLink>
                .
              </li>
              <li>
                Rank Math Agency ($64.99/mo billed yearly), SEOPress PRO for unlimited sites
                ($149/yr) and AIOSEO Elite (100 sites, $599/yr regular) are the volume options among
                the SEO suites. They give your team good tools, but the AI search content work stays
                manual.
              </li>
              <li>
                For client reporting on brand mentions alone, Yoast AI+ is priced per brand, so it
                adds up quickly across many clients.
              </li>
            </ul>
          </div>

          <H2 id="woocommerce-chatgpt">
            How to get WooCommerce products to show up in ChatGPT shopping
          </H2>
          <div className="space-y-4">
            <p>
              ChatGPT shows products from merchants who give it a product feed in OpenAI's format,
              with prices, stock, images and a link to buy. Two routes on WordPress:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 marker:text-primary/60">
              <li>
                LovedByAI's eCommerce plan builds an Agentic Commerce Protocol (ACP) feed straight
                from WooCommerce, updates it whenever a product changes, and also publishes a UCP
                catalog at /.well-known/ucp for AI shopping agents that use the Universal Commerce
                Protocol.
              </li>
              <li>
                General feed plugins such as{" "}
                <ExtLink href="https://wordpress.org/plugins/webappick-product-feed-for-woocommerce/">
                  CTX Feed
                </ExtLink>{" "}
                (free core, paid Pro) list ChatGPT Merchant among their 220+ channels. Its listing
                does not say whether the output follows the ACP format, so check that before you
                rely on it.
              </li>
            </ul>
            <p>
              Either way, you submit the feed to OpenAI and OpenAI decides which merchants and
              products appear. No plugin can promise a placement.
            </p>
          </div>

          <H2 id="how-we-tested">How we tested these GEO and AEO plugins ({UPDATED_LABEL})</H2>
          <div className="space-y-4">
            <p>
              On {UPDATED_LABEL} we read each plugin's wordpress.org listing and the vendor's own
              feature and pricing pages, and recorded features and regular prices from those pages
              only. Where a vendor's pages were unclear or disagreed with each other, we say so in
              that plugin's section or leave the claim out. We did not run a controlled lab test of
              each plugin's effect on citations, and this article does not claim one.
            </p>
            <p>
              We also checked which plugins AI engines recommend today. On 19 November 2026,
              LovedByAI's AEO tracker asked ChatGPT, Perplexity, Gemini and Claude ten buyer
              questions like the ones in the FAQ below, three runs each, and collected 118 answers.
              Share of answers naming each plugin: Rank Math 39%, Yoast SEO 30%, AIOSEO 19%,
              LovedByAI 14%, SEOPress 13%. ChatGPT did not name LovedByAI in any of its answers. We
              include that so you can see where our own plugin stands, not to rank anyone.
            </p>
            <p>
              We update this page when a plugin's AI features or prices change. If you spot
              something out of date, tell us at the{" "}
              <ExtLink href={`https://www.lovedby.ai/?${LBA_UTM}`}>LovedByAI site</ExtLink>.
            </p>
          </div>

          <H2 id="faq">GEO and AEO plugins for WordPress: frequently asked questions</H2>
          <section aria-label="Frequently asked questions">
            {FAQS.map((f) => (
              <details key={f.q} className="border-t border-border group" open>
                <summary className="flex items-start justify-between gap-4 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  <h3 className="font-semibold text-foreground leading-snug text-base group-hover:text-primary transition-colors">
                    {f.q}
                  </h3>
                  <span
                    className="flex-none mt-0.5 w-5 h-5 rounded-full border border-border flex items-center justify-center transition-all duration-200 group-open:border-primary group-open:text-primary"
                    aria-hidden="true"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      className="transition-transform duration-200 group-open:rotate-45"
                    >
                      <path
                        d="M5 1v8M1 5h8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5">{f.a}</p>
              </details>
            ))}
          </section>

          <aside className="mt-14 rounded-2xl border border-border bg-card px-5 py-6 sm:px-7">
            <p className="text-foreground font-semibold text-lg leading-snug">
              Is AI already sending you traffic?
            </p>
            <p className="mt-2 text-sm">
              Before you install anything, get a baseline. Connect Google Analytics and see which AI
              tools already send you visitors. Free, read-only, about 30 seconds.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
            >
              Run the free AI traffic check
            </Link>
          </aside>
        </article>

        <footer className="mt-12 flex flex-col items-center gap-1.5 text-xs text-muted-foreground/50">
          <div className="flex items-center gap-3">
            <Link to="/blog" className="hover:text-muted-foreground transition-colors">
              Blog
            </Link>
            <span className="text-border" aria-hidden="true">
              ·
            </span>
            <Link to="/faq" className="hover:text-muted-foreground transition-colors">
              FAQ
            </Link>
            <span className="text-border" aria-hidden="true">
              ·
            </span>
            <Link to="/privacy" className="hover:text-muted-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
