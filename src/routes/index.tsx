import { createFileRoute, Link } from "@tanstack/react-router";
import { trackEvent } from "@/lib/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Is AI Sending Me Traffic? — Free AI Traffic Checker" },
      {
        name: "description",
        content:
          "Free AI traffic checker, connect your Google Analytics and instantly see if ChatGPT, Perplexity, Claude, Gemini, and other AI tools are sending visitors to your website.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://isaisendingmetraffic.com/" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div
      className="bg-background flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <main className="flex-1 flex flex-col justify-center px-7 py-8 md:px-14">
        <article className="w-full text-left md:max-w-3xl md:mx-auto md:text-center">

            {/* H1 — mobile: 3 lines centered, desktop: 2 lines left-aligned */}
            <h1
              className="font-bold uppercase text-foreground mb-4"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                lineHeight: 0.88,
                letterSpacing: "-0.02em",
              }}
            >
              <span
                className="block md:hidden"
                style={{ fontSize: "clamp(3.5rem, 14vw, 5.5rem)" }}
              >
                IS AI SENDING<br />ME TRAFFIC?
              </span>
              <span
                className="hidden md:block"
                style={{ fontSize: "clamp(4.5rem, 7vw, 8rem)" }}
              >
                <span style={{ display: "block", letterSpacing: "0.05em" }}>IS AI SENDING</span>
                <span style={{ display: "block", letterSpacing: "0.02em" }}>ME TRAFFIC?</span>
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-muted-foreground mb-5 leading-relaxed md:mx-auto"
              style={{ fontSize: "1rem", fontFamily: "'Figtree', sans-serif", maxWidth: "44ch" }}
            >
              Connect your Google Analytics. See if ChatGPT, Perplexity, Claude
              and others are already sending visitors to your website.
            </p>

            {/* AI source logos */}
            <div className="flex items-center justify-start gap-4 mb-8 md:justify-center" role="img" aria-label="Supported AI tools: ChatGPT, Perplexity, Claude, Gemini, Grok, DeepSeek">
              {[
                { name: "ChatGPT", src: "/llm-logos/chatgpt.png" },
                { name: "Perplexity", src: "/llm-logos/perplexity.png" },
                { name: "Claude", src: "/llm-logos/claude.png" },
                { name: "Gemini", src: "/llm-logos/gemini.png" },
                { name: "Grok", src: "/llm-logos/grok.png" },
                { name: "DeepSeek", src: "/llm-logos/deepseek.png" },
              ].map((ai) => (
                <img
                  key={ai.name}
                  src={ai.src}
                  alt={`${ai.name} logo`}
                  title={ai.name}
                  width={28}
                  height={28}
                  loading="eager"
                  className="w-7 h-7 rounded object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-200"
                />
              ))}
            </div>

            {/* CTA */}
            <a
              href="/auth/google"
              onClick={() => {
                trackEvent("connect_google_click", { source: "landing" });
              }}
              className="flex items-center justify-center gap-2.5 w-full max-w-sm bg-primary text-primary-foreground font-semibold text-base rounded-xl transition-all hover:opacity-90 active:scale-[0.98] md:mx-auto"
              style={{ paddingTop: "1rem", paddingBottom: "1rem", fontFamily: "'Figtree', sans-serif" }}
            >
              <GoogleIcon />
              Connect Google Analytics
            </a>

            {/* Microcopy */}
            <div className="flex items-center justify-start gap-3 mt-3.5 md:justify-center">
              {["Free", "Private", "Takes 30 seconds"].map((word, i) => (
                <div key={word} className="flex items-center gap-3">
                  {i > 0 && <div className="w-1 h-1 rounded-full bg-border" />}
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>{word}</span>
                </div>
              ))}
            </div>
            <p className="text-left md:text-center mt-3 text-xs text-muted-foreground/60 leading-relaxed" style={{ fontFamily: "'Figtree', sans-serif" }}>
              Read-only access. We do not change your analytics setup.
            </p>

        </article>
      </main>

      {/* Footer */}
      <footer className="px-7 pb-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <Link
              to="/faq"
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              FAQ
            </Link>
            <span className="text-border text-xs" aria-hidden="true">·</span>
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              Privacy
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/50" style={{ fontFamily: "'Figtree', sans-serif" }}>
            With{" "}
            <svg className="inline-block w-3 h-3 text-blue-500 align-baseline" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            <span className="sr-only">love</span>
            {" "}by{" "}
            <a
              href="https://www.lovedby.ai?utm_source=isaisendingmetraffic&utm_medium=referral&utm_content=footer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/50 hover:text-foreground transition-colors font-medium"
            >
              LovedByAI
            </a>
          </p>
          <div className="flex flex-nowrap overflow-x-auto items-center gap-2 mt-2 w-full md:flex-wrap md:overflow-visible md:justify-center" style={{ scrollbarWidth: "none" }}>
            <a href="https://toolfame.com/item/is-ai-sending-me-traffic" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://toolfame.com/badge-light.svg" alt="Featured on toolfame.com" className="h-7 w-auto" /></a>
            <a href="https://aitoolfame.com/item/is-ai-sending-me-traffic" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://aitoolfame.com/badge-light.svg" alt="Featured on aitoolfame.com" className="h-7 w-auto" /></a>
            <a href="https://saasfame.com/item/is-ai-sending-me-traffic" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://saasfame.com/badge-light.svg" alt="Featured on saasfame.com" className="h-7 w-auto" /></a>
            <a href="https://findly.tools/is-ai-sending-me-traffic-free-ai-traffic-checker?utm_source=is-ai-sending-me-traffic-free-ai-traffic-checker" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://findly.tools/badges/findly-tools-badge-light.svg" alt="Featured on Findly.tools" className="h-7 w-auto" /></a>
            <a href="https://startupfa.me/s/is-ai-sending?utm_source=isaisendingmetraffic.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://startupfa.me/badges/featured-badge.webp" alt="Featured on Startup Fame" className="h-7 w-auto" /></a>
            <a href="https://dofollow.tools" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://dofollow.tools/badge/badge_light.svg" alt="Featured on Dofollow.Tools" className="h-7 w-auto" /></a>
            <a href="https://fazier.com/launches/isaisendingmetraffic.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light" alt="Fazier badge" className="h-7 w-auto" /></a>
            <a href="https://twelve.tools" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://twelve.tools/badge0-white.svg" alt="Featured on Twelve Tools" className="h-7 w-auto" /></a>
            <a href="https://turbo0.com/item/is-ai-sending-me-traffic" target="_blank" rel="noopener noreferrer" className="flex-shrink-0"><img src="https://img.turbo0.com/badge-listed-light.svg" alt="Listed on Turbo0" className="h-7 w-auto" /></a>
          </div>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="currentColor"
        opacity=".9"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="currentColor"
        opacity=".75"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="currentColor"
        opacity=".6"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="currentColor"
        opacity=".85"
      />
    </svg>
  );
}

