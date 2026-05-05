import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { unsubscribeByToken } from "@/lib/digest.functions";
import { Link } from "@tanstack/react-router";

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (search) => ({
    token: (search.token as string) || "",
  }),
  head: () => ({
    meta: [
      { title: "Unsubscribe — Is AI Sending Me Traffic?" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "success"; email: string; propertyName: string }
    | { status: "error"; message: string }
    | { status: "no_token" }
  >({ status: "loading" });

  useEffect(() => {
    if (!token) {
      setState({ status: "no_token" });
      return;
    }
    unsubscribeByToken({ data: { token } })
      .then((res) => {
        setState({ status: "success", email: res.email, propertyName: res.propertyName });
      })
      .catch((e: unknown) => {
        const msg = (e as Error).message ?? "";
        setState({
          status: "error",
          message:
            msg === "not_found"
              ? "This unsubscribe link is invalid or has already been used."
              : "Something went wrong. Please try again or contact us.",
        });
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-xs">
        {state.status === "loading" && (
          <>
            <div className="flex justify-center mb-2">
              <span
                className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin block"
              />
            </div>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: bodyFont }}>
              Unsubscribing…
            </p>
          </>
        )}

        {state.status === "success" && (
          <>
            <p className="text-4xl mb-2">✓</p>
            <h1
              className="text-3xl text-foreground tracking-tight"
              style={{ fontFamily: displayFont }}
            >
              You're unsubscribed
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: bodyFont }}>
              <span className="font-medium text-foreground">{state.email}</span> will no longer
              receive weekly digests for {state.propertyName}.
            </p>
            <Link
              to="/"
              className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground mt-2"
              style={{ fontFamily: bodyFont }}
            >
              Back to home
            </Link>
          </>
        )}

        {(state.status === "error" || state.status === "no_token") && (
          <>
            <h1
              className="text-3xl text-foreground tracking-tight"
              style={{ fontFamily: displayFont }}
            >
              Invalid link
            </h1>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: bodyFont }}>
              {state.status === "no_token"
                ? "No unsubscribe token found in the URL."
                : state.message}
            </p>
            <Link
              to="/"
              className="inline-flex items-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground mt-2"
              style={{ fontFamily: bodyFont }}
            >
              Go home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
