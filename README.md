# Is AI Sending Me Traffic?

A free, privacy-focused tool that helps website owners detect and measure traffic coming from AI tools like ChatGPT, Perplexity, Claude, Gemini, and more.

**Live at [isaisendingmetraffic.com](https://isaisendingmetraffic.com)**

Built by [lovedby.ai](https://lovedby.ai)

---

## What It Does

Connect your Google Analytics account and instantly see which AI systems are sending visitors to your site. No changes to your GA setup — read-only access only.

Detects traffic from 25+ AI sources including:
- ChatGPT / OpenAI
- Perplexity
- Claude / Anthropic
- Google Gemini
- Grok / xAI
- DeepSeek
- Mistral
- Bing Copilot
- And many more

## Features

- **Google Analytics integration** — OAuth sign-in, read-only access
- **AI traffic breakdown** — See which AI tools are driving visits, across 7d / 30d / 90d / 12m windows
- **Bing Copilot tracking** — Dedicated integration for Microsoft Copilot referrals
- **Weekly digest emails** — Opt-in summary of your AI traffic delivered every Monday
- **Privacy-first** — No data sold, no writes to your GA account

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) + React 19 |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Database | Supabase (PostgreSQL) |
| Edge runtime | Cloudflare Workers |
| Email | Resend |
| Auth | Google OAuth, Supabase Auth |
| Build | Vite, TypeScript |

## Local Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev
```

Requires environment variables for Google OAuth, Supabase, Resend, and Bing API keys. See `wrangler.jsonc` for the expected secret names.

## Deployment

Deployed to Cloudflare Workers via Wrangler:

```bash
bun run deploy
```

The weekly digest cron worker is configured separately in `wrangler.digest.jsonc` and runs every Monday at 09:00 UTC.

---

Made with ♥ by [lovedby.ai](https://lovedby.ai)
