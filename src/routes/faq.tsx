import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

const displayFont = "'Barlow Condensed', sans-serif";
const bodyFont = "'Figtree', sans-serif";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Is AI Sending Me Traffic?" },
      {
        name: "description",
        content:
          "Questions about IsAISendingMeTraffic.com — what it does, how it works, whether it's free, and what AI traffic actually means for your website.",
      },
    ],
    links: [{ rel: "canonical", href: "https://isaisendingmetraffic.com/faq" }],
  }),
  component: FAQPage,
});

interface FAQItem {
  q: string;
  a: React.ReactNode;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What is this site?",
    a: (
      <p>
        It's a simple way to check whether AI tools like ChatGPT are already
        sending traffic to your website.
      </p>
    ),
  },
  {
    q: "Why did we build it?",
    a: (
      <>
        <p>Because this data is usually buried inside GA4.</p>
        <p>
          Most small business owners are not opening analytics reports, messing
          with filters, and trying to decode weird source names just to answer
          one basic question:
        </p>
        <p>
          <strong>Is AI already sending people to my site?</strong>
        </p>
        <p>We built this to make that answer easy.</p>
      </>
    ),
  },
  {
    q: "Does it cost anything?",
    a: <p>Nope. You can run the check for free.</p>,
  },
  {
    q: "Is my data private?",
    a: (
      <p>
        Yes. We only ask for read-only access so we can look at your GA4 data
        and generate your report. We do not edit your analytics, change
        settings, or touch your site.
      </p>
    ),
  },
  {
    q: 'What does "AI traffic" mean here?',
    a: (
      <>
        <p>
          It means visits to your site that appear to have come from AI tools
          and assistants, based on the referral data GA4 gives us.
        </p>
        <p>
          It's helpful, but it's not perfect. Some AI-driven visits may still
          be hidden, unattributed, or grouped somewhere else.
        </p>
      </>
    ),
  },
  {
    q: "What if it says I'm not getting AI traffic yet?",
    a: (
      <>
        <p>That's actually pretty normal.</p>
        <p>
          A lot of small businesses are still very early here. A low number does
          not mean this channel is not important. It usually just means the
          traffic is still small, hard to spot, or has room to grow.
        </p>
      </>
    ),
  },
  {
    q: "Can you tell me which prompts or questions I'm ranking for?",
    a: (
      <>
        <p>We wish. GA4 does not show that.</p>
        <p>
          This tool can help show whether AI tools are sending traffic to your
          website, but it cannot show the exact prompt, question, or chat that
          led someone there.
        </p>
      </>
    ),
  },
  {
    q: "Does this change anything in my GA4 account?",
    a: (
      <p>
        Not at all. This is read-only, so nothing gets changed or reconfigured.
      </p>
    ),
  },
  {
    q: "Why should I care if AI is sending me traffic?",
    a: (
      <>
        <p>
          Because it can be an early signal that people are already discovering
          your business in new ways.
        </p>
        <p>
          Even a small amount of AI traffic can be interesting. It may mean
          your site is starting to show up in the tools people use to research,
          compare options, and make decisions.
        </p>
      </>
    ),
  },
  {
    q: "Who made this?",
    a: (
      <p>
        This little tool was made with love by{" "}
        <a
          href="https://www.lovedby.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
        >
          LovedByAI
        </a>
        .
      </p>
    ),
  },
];

function AccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-4 py-5 text-left group"
      >
        <span
          className="font-semibold text-foreground leading-snug transition-colors group-hover:text-primary"
          style={{
            fontFamily: bodyFont,
            fontSize: "1rem",
          }}
        >
          <span
            className="text-primary/40 font-normal tabular-nums mr-2.5 select-none"
            style={{ fontFamily: displayFont, fontSize: "0.85rem", letterSpacing: "0.04em" }}
            aria-hidden="true"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          {item.q}
        </span>

        {/* Indicator */}
        <span
          className="flex-none mt-0.5 w-5 h-5 rounded-full border border-border flex items-center justify-center transition-all duration-200 group-hover:border-primary group-hover:text-primary"
          style={{ color: open ? "var(--color-primary)" : undefined, borderColor: open ? "var(--color-primary)" : undefined }}
          aria-hidden="true"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            style={{
              transform: open ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Smooth expand via grid-template-rows */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.28s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div
            className="pb-5 space-y-3 text-muted-foreground leading-relaxed"
            style={{ fontFamily: bodyFont, fontSize: "0.9375rem", maxWidth: "58ch" }}
          >
            {item.a}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQPage() {
  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: bodyFont }}>
      <div className="max-w-xl mx-auto px-6 py-10 pb-16">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>

        {/* Header */}
        <header className="mt-10 mb-10">
          <h1
            className="uppercase text-foreground font-bold leading-none"
            style={{
              fontFamily: displayFont,
              fontSize: "clamp(3rem, 10vw, 4.5rem)",
              letterSpacing: "-0.01em",
            }}
          >
            FAQ
          </h1>
        </header>

        {/* Accordion */}
        <section aria-label="Frequently asked questions">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem key={i} item={item} index={i} />
          ))}
        </section>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-1.5" style={{ fontFamily: bodyFont }}>
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
            <span className="text-blue-500" aria-hidden="true">♥</span>
            <span className="sr-only">love</span>
            {" "}by{" "}
            <a
              href="https://www.lovedby.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors font-medium"
            >
              lovedby.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
