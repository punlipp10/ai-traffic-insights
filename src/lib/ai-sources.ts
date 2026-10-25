/**
 * AI referral source detection.
 * Single source of truth — update this file to add new AI sources.
 */

export interface AISourceMatch {
  source: string;
  category: "known" | "possible";
  label: string;
}

const KNOWN_AI_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // OpenAI / ChatGPT
  { pattern: /chatgpt\.com/i, label: "ChatGPT" },
  { pattern: /chat\.openai\.com/i, label: "ChatGPT" },
  { pattern: /openai\.com/i, label: "OpenAI" },
  // Google
  { pattern: /gemini\.google\.com/i, label: "Gemini" },
  { pattern: /bard\.google\.com/i, label: "Google Bard" },
  // Anthropic
  { pattern: /claude\.ai/i, label: "Claude" },
  { pattern: /anthropic\.com/i, label: "Anthropic" },
  // Perplexity
  { pattern: /perplexity\.ai/i, label: "Perplexity" },
  // xAI
  { pattern: /grok\.com/i, label: "Grok" },
  { pattern: /x\.ai/i, label: "Grok" },
  // DeepSeek
  { pattern: /deepseek\.com/i, label: "DeepSeek" },
  // Mistral
  { pattern: /mistral\.ai/i, label: "Mistral" },
  // Microsoft
  { pattern: /copilot\.microsoft\.com/i, label: "Microsoft Copilot" },
  // Meta
  { pattern: /meta\.ai/i, label: "Meta AI" },
  // AI search engines
  { pattern: /kagi\.com/i, label: "Kagi" },
  { pattern: /you\.com/i, label: "You.com" },
  { pattern: /phind\.com/i, label: "Phind" },
  { pattern: /andisearch\.com/i, label: "Andi" },
  { pattern: /iask\.ai/i, label: "iAsk" },
  { pattern: /exa\.ai/i, label: "Exa" },
  { pattern: /consensus\.app/i, label: "Consensus" },
  // Aggregators & other AI chat
  { pattern: /poe\.com/i, label: "Poe" },
  { pattern: /huggingface\.co/i, label: "Hugging Face" },
  { pattern: /hf\.co/i, label: "Hugging Face" },
  { pattern: /pi\.ai/i, label: "Pi" },
  { pattern: /inflection\.ai/i, label: "Pi" },
  { pattern: /coral\.cohere\.com/i, label: "Cohere" },
  { pattern: /cohere\.com/i, label: "Cohere" },
  // AI writing tools
  { pattern: /writesonic\.com/i, label: "Writesonic" },
  { pattern: /jasper\.ai/i, label: "Jasper" },
];

const POSSIBLE_AI_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /edgeservices\.bing\.com/i, label: "Bing (AI)" },
  { pattern: /copilot\.bing\.com/i, label: "Bing Copilot" },
  { pattern: /arc\.net/i, label: "Arc Search" },
];

export function matchAISource(source: string): AISourceMatch | null {
  for (const { pattern, label } of KNOWN_AI_PATTERNS) {
    if (pattern.test(source)) {
      return { source, category: "known", label };
    }
  }
  for (const { pattern, label } of POSSIBLE_AI_PATTERNS) {
    if (pattern.test(source)) {
      return { source, category: "possible", label };
    }
  }
  return null;
}

export function getAllAISourcePatterns(): string[] {
  return [
    ...KNOWN_AI_PATTERNS.map((p) => p.pattern.source),
    ...POSSIBLE_AI_PATTERNS.map((p) => p.pattern.source),
  ];
}

export interface AITrafficReport {
  propertyId: string;
  propertyName: string;
  days: number;
  dateRange: { start: string; end: string };
  prevDateRange: { start: string; end: string };
  totalAISessions: number;
  prevAISessions: number;
  totalAIUsers: number;
  totalAINewUsers: number;
  changePercent: number | null;
  totalAIConversions: number;
  aiConversionRate: number | null;
  topSource: { label: string; sessions: number } | null;
  topPage: { path: string; sessions: number } | null;
  pagesWithAITraffic: number;
  sourceBreakdown: Array<{
    source: string;
    label: string;
    category: "known" | "possible";
    sessions: number;
    users: number;
    conversions: number;
  }>;
  topPages: Array<{
    path: string;
    sessions: number;
  }>;
  dailyTrend: Array<{
    date: string;
    sessions: number;
  }>;
  topOrganicPages: Array<{
    path: string;
    sessions: number;
  }>;
  conversionEvents: Array<{
    eventName: string;
    conversions: number;
  }>;
  state: "meaningful" | "low" | "none";
  domain: string | null;
  /** AI sessions per hostname in the current period, ignoring hostFilter */
  hosts: Array<{
    host: string;
    sessions: number;
  }>;
  /** Hostnames the report is restricted to; empty = all hosts */
  hostFilter: string[];
}

export interface GA4Property {
  propertyId: string;
  displayName: string;
  accountName: string;
}
