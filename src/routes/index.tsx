import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center space-y-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
            IS AI SENDING
            <br />
            ME TRAFFIC?
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
            Connect your GA4 and see whether ChatGPT and other AI tools are
            already sending visitors to your site.
          </p>

          <div className="space-y-3">
            <a
              href="/auth/google"
              className="inline-flex items-center justify-center w-full rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              Connect GA4
            </a>

            <p className="text-sm text-muted-foreground">
              Free, private, quick
            </p>
          </div>

          <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
            Read-only access. We do not change your analytics setup.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center">
        <p className="text-xs text-muted-foreground/60">
          With ❤️ by{" "}
          <a
            href="https://lovedbyai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground transition-colors"
          >
            lovedbyai
          </a>
        </p>
        <Link
          to="/privacy"
          className="text-xs text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors mt-1 inline-block"
        >
          Privacy
        </Link>
      </footer>
    </div>
  );
}
