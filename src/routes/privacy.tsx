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

        <h1 className="text-2xl font-bold text-foreground mt-6 mb-2">
          Privacy
        </h1>
        <p className="text-xs text-muted-foreground/50 mb-8">
          Last updated: April 18, 2026
        </p>

        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-semibold text-foreground mb-2">
              What Google data we access
            </h2>
            <p className="mb-3">
              When you sign in, we request <strong>read-only</strong> access to
              your Google Analytics data through the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                analytics.readonly
              </code>{" "}
              scope. That means we can view your traffic reports but we{" "}
              <strong>cannot</strong> modify your analytics setup, create goals,
              change filters, or do anything other than read.
            </p>
            <p>
              Specifically, we pull: session counts, traffic source names,
              landing page paths, and daily session totals — just enough to
              build your AI traffic report.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              How we use your data
            </h2>
            <p>
              Your Google Analytics data is used for one thing: generating your
              AI traffic report. We look at traffic sources to identify sessions
              from AI tools (ChatGPT, Perplexity, Claude, etc.) and show you
              the results. That's it. We do not use your data for advertising,
              analytics, market research, or anything else.
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
              name, and aggregate numbers from your report, for example total
              AI sessions, top source, and top page. We do{" "}
              <strong>not</strong> store your raw analytics data or individual
              visitor records.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              Sharing and third parties
            </h2>
            <p>
              We do not sell, rent, trade, or share your Google user data with
              any third party. We do not transfer your data to anyone else for
              any reason — not for advertising, not for analytics, not at all.
              Your data stays between you and this app.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              Data protection
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>All traffic between your browser and our servers is encrypted over HTTPS</li>
              <li>Access tokens are stored in encrypted, HTTP-only session cookies</li>
              <li>We use Supabase (with row-level security) for database storage</li>
              <li>Our servers run on Cloudflare Workers with no persistent disk access</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              Data retention and deletion
            </h2>
            <p className="mb-3">
              Session cookies expire when you close your browser or clear
              cookies. Scan summaries are retained in our database indefinitely
              so you can compare reports over time.
            </p>
            <p>
              You can delete your data at any time:
            </p>
            <ul className="list-disc pl-4 space-y-1 mt-1">
              <li>Clear your browser cookies to remove your session</li>
              <li>Click "Disconnect" in the app to end your session</li>
              <li>
                Revoke access in your{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Google Account permissions
                </a>
              </li>
              <li>
                Email us at{" "}
                <a
                  href="mailto:info@lovedby.ai"
                  className="underline hover:text-foreground"
                >
                  info@lovedby.ai
                </a>{" "}
                to request deletion of your stored scan summaries
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              Google API Services Limited Use Disclosure
            </h2>
            <p>
              This app's use and transfer to any other app of information
              received from Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">Changes to this policy</h2>
            <p>
              If we update this policy, we'll post the changes here with a new
              "last updated" date. If the changes are significant, we'll also
              show a notice within the app.
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
        </footer>
      </div>
    </div>
  );
}
