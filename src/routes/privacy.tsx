import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Is AI Sending Me Traffic?" },
      {
        name: "description",
        content: "How we handle your data. Short version: we barely touch it.",
      },
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
              We request read-only access to your Google Analytics 4 data. We
              cannot modify your analytics setup, create goals, change filters,
              or do anything other than read your traffic data.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-foreground mb-2">
              What we store
            </h2>
            <p>
              Your Google access tokens are stored in an encrypted session
              cookie on your device. We do not store your raw analytics data
              on our servers. Reports are generated on the fly and shown to
              you immediately.
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
              <li>We do not store your analytics data long-term</li>
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
                href="https://lovedbyai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                lovedbyai.com
              </a>
              .
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-6 border-t border-border">
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
        </footer>
      </div>
    </div>
  );
}
