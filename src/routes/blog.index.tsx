import { createFileRoute, Link } from "@tanstack/react-router";

const SITE = "https://isaisendingmetraffic.com";
const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

const POSTS = [
  {
    to: "/blog/best-geo-aeo-plugins-wordpress" as const,
    title: "Best GEO and AEO plugins for WordPress (2027)",
    excerpt:
      "Seven WordPress plugins for AI search compared: what each does for ChatGPT, Gemini and Google AI Overviews, who it suits and what it costs.",
    updated: "2026-11-21",
    updatedLabel: "21 November 2026",
  },
];

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog: AI Search and AI Traffic Guides | Is AI Sending Me Traffic?" },
      {
        name: "description",
        content:
          "Guides on getting your website read, cited and recommended by ChatGPT, Gemini, Perplexity and Google's AI, from the team behind Is AI Sending Me Traffic.",
      },
      { property: "og:title", content: "Blog | Is AI Sending Me Traffic?" },
      { property: "og:url", content: `${SITE}/blog` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/blog` }],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: bodyFont }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-16">
        <Link
          to="/"
          className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          Home
        </Link>
        <h1
          className="mt-8 uppercase text-foreground font-bold leading-none"
          style={{ fontFamily: displayFont, fontSize: "clamp(3rem, 10vw, 4.5rem)" }}
        >
          Blog
        </h1>
        <p className="mt-3 text-muted-foreground">
          Guides on AI search and AI traffic for small businesses, from the LovedByAI team.
        </p>
        <ul className="mt-10">
          {POSTS.map((p) => (
            <li key={p.to} className="border-t border-border py-6">
              <Link to={p.to} className="group block">
                <h2 className="text-xl font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                  {p.title}
                </h2>
                <p className="mt-2 text-muted-foreground leading-relaxed">{p.excerpt}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  Updated <time dateTime={p.updated}>{p.updatedLabel}</time>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
