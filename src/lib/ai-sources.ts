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
  { pattern: /chatgpt\.com/i, label: "ChatGPT" },
  { pattern: /chat\.openai\.com/i, label: "ChatGPT" },
  { pattern: /openai\.com/i, label: "OpenAI" },
  { pattern: /perplexity\.ai/i, label: "Perplexity" },
  { pattern: /claude\.ai/i, label: "Claude" },
  { pattern: /anthropic\.com/i, label: "Anthropic" },
  { pattern: /gemini\.google\.com/i, label: "Gemini" },
  { pattern: /bard\.google\.com/i, label: "Google Bard" },
  { pattern: /copilot\.microsoft\.com/i, label: "Microsoft Copilot" },
  { pattern: /poe\.com/i, label: "Poe" },
  { pattern: /you\.com/i, label: "You.com" },
  { pattern: /phind\.com/i, label: "Phind" },
  { pattern: /writesonic\.com/i, label: "Writesonic" },
  { pattern: /jasper\.ai/i, label: "Jasper" },
  { pattern: /meta\.ai/i, label: "Meta AI" },
  { pattern: /huggingface\.co/i, label: "Hugging Face" },
];

const POSSIBLE_AI_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /edgeservices\.bing\.com/i, label: "Bing (AI)" },
  { pattern: /bing\.com/i, label: "Bing" },
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
  topSource: { label: string; sessions: number } | null;
  topPage: { path: string; sessions: number } | null;
  pagesWithAITraffic: number;
  sourceBreakdown: Array<{
    source: string;
    label: string;
    category: "known" | "possible";
    sessions: number;
    users: number;
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
  state: "meaningful" | "low" | "none";
}

export interface GA4Property {
  propertyId: string;
  displayName: string;
  accountName: string;
}
