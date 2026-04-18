import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Is AI Sending Me Traffic?" },
      {
        name: "description",
        content: "Privacy policy for IsAISendingMeTraffic.com. Read-only Google Analytics access, encrypted session cookies, no data selling.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://isaisendingmetraffic.com/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-6 py-12">
        <Link
          to="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </Link>

        <h1 className="text-2xl font-bold text-foreground mt-6 mb-8">
          Privacy
        </h1>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-semibold text-foreground mb-2">
              What we access
            </h2>
            <p>
              We request read-only access to your Google Analytics data. We
              cannot modify your analytics setup, create goals, change filters,
              or do anything other than read your traffic data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              What we store
            </h2>
            <p className="mb-3">
              Your Google access tokens are stored in an encrypted session
              cookie on your device. You can clear it at any time by clearing
              your browser cookies.
            </p>
            <p>
              We also save a summary of each scan to our database. This includes
              your Google account email, the Google Analytics property ID and
              name, and aggregate numbers from your report — for example total
              AI sessions, top source, and top page. We do{" "}
              <strong>not</strong> store your raw analytics data or individual
              visitor records.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              What we do not do
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>We do not sell your data</li>
              <li>We do not share your data with third parties</li>
              <li>We do not use your data for advertising</li>
              <li>We do not store individual visitor records from your analytics</li>
              <li>We do not modify your Google Analytics setup</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              Deleting your data
            </h2>
            <p>
              Your session is stored as a cookie. You can clear it at any time
              by clearing your browser cookies, or by clicking "disconnect"
              within the app. You can also revoke access in your{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google Account permissions
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">Contact</h2>
            <p>
              Questions? Reach out at{" "}
              <a
                href="mailto:info@lovedby.ai"
                className="underline hover:text-foreground"
              >
                info@lovedby.ai
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-6 border-t border-border flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3">
            <Link
              to="/faq"
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              FAQ
            </Link>
            <span className="text-border text-xs" aria-hidden="true">·</span>
            <Link
              to="/privacy"
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              Privacy
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/50">
            With{" "}
            <span className="text-muted-foreground/50" aria-hidden="true">♥</span>
            <span className="sr-only">love</span>
            {" "}by{" "}
            <a
              href="https://www.lovedby.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground/50 hover:text-foreground transition-colors font-medium"
            >
              LovedByAI
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
