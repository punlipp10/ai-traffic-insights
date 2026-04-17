import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div
      className="bg-background flex flex-col"
      style={{ minHeight: "100dvh" }}
    >
      <main className="flex-1 flex flex-col items-center justify-center px-7 py-12 md:py-20">
        <div className="w-full max-w-sm md:max-w-md">
          {/* Logo */}
          <div className="flex mb-6 md:justify-center">
            <img src="/isaisendingmetraffic-logo-small.png" alt="Is AI Sending Me Traffic?" className="h-8 w-auto" />
          </div>

          {/* Eyebrow — line + text + mirror line on desktop */}
          <div className="flex items-center gap-3 mb-5 md:justify-center">
            <div className="h-px bg-primary flex-none" style={{ width: "2rem" }} />
            <p
              className="text-xs font-semibold text-primary uppercase tracking-widest"
              style={{ fontFamily: "'Figtree', sans-serif" }}
            >
              GA4 Analyzer
            </p>
            <div className="h-px bg-primary flex-none hidden md:block" style={{ width: "2rem" }} />
          </div>

          {/* H1 */}
          <h1
            className="font-bold uppercase text-foreground mb-6 md:text-center"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "clamp(3.5rem, 14vw, 5.75rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.01em",
            }}
          >
            IS AI
            <br />
            SENDING ME
            <br />
            TRAFFIC?
          </h1>

          {/* Subtitle */}
          <p
            className="text-muted-foreground mb-5 leading-relaxed md:text-center"
            style={{ fontSize: "0.9375rem", fontFamily: "'Figtree', sans-serif" }}
          >
            Connect your GA4 and see whether ChatGPT, Perplexity, Claude and
            other AI tools are already sending visitors to your site.
          </p>

          {/* AI sources text list */}
          <p
            className="text-[11px] text-muted-foreground/50 mb-8 md:text-center tracking-wide"
            style={{ fontFamily: "'Figtree', sans-serif" }}
          >
            ChatGPT · Perplexity · Claude · Gemini · Copilot · and more
          </p>

          {/* CTA */}
          <a
            href="/auth/google"
            className="flex items-center justify-center gap-2.5 w-full bg-primary text-primary-foreground font-semibold text-base rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ paddingTop: "1rem", paddingBottom: "1rem", fontFamily: "'Figtree', sans-serif" }}
          >
            <GoogleIcon />
            Connect GA4
          </a>

          {/* Microcopy */}
          <div className="flex items-center justify-center gap-3 mt-3.5">
            {["Free", "Private", "Quick"].map((word, i) => (
              <div key={word} className="flex items-center gap-3">
                {i > 0 && <div className="w-1 h-1 rounded-full bg-border" />}
                <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Figtree', sans-serif" }}>{word}</span>
              </div>
            ))}
          </div>
          <p className="text-center mt-4 text-xs text-muted-foreground/60 leading-relaxed" style={{ fontFamily: "'Figtree', sans-serif" }}>
            Read-only access. We do not change your analytics setup.
          </p>
        </div>
      </main>

      {/* Footer — centered */}
      <footer className="px-7 pb-7 flex flex-col items-center gap-1.5">
        <p className="text-xs text-muted-foreground/50" style={{ fontFamily: "'Figtree', sans-serif" }}>
          With{" "}
          <span className="text-blue-500">♥</span>
          {" "}by{" "}
          <a
            href="https://www.lovedbyai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
          >
            lovedbyai
          </a>
        </p>
        <Link
          to="/privacy"
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          style={{ fontFamily: "'Figtree', sans-serif" }}
        >
          Privacy
        </Link>
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

