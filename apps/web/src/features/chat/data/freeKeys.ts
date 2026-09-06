// ── Built-in Free Tier Rotating Key Pool ─────────────────────────────────
export const FREE_GROQ_KEYS: string[] = [
  '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',
  ...(process.env.NEXT_PUBLIC_GROQ_API_KEYS ? process.env.NEXT_PUBLIC_GROQ_API_KEYS.split(',').map((k) => k.trim()) : []),
].filter((k, i, self) => Boolean(k) && self.indexOf(k) === i);

export const FREE_GEMINI_KEYS: string[] = [
  'AQ.Ab8RN6JWoVCHAxjnHnTig8_iYyHTobEtwGGo9AAOiyFHQc-5Dg',
  ...(process.env.NEXT_PUBLIC_GEMINI_API_KEYS ? process.env.NEXT_PUBLIC_GEMINI_API_KEYS.split(',').map((k) => k.trim()) : []),
].filter((k, i, self) => Boolean(k) && self.indexOf(k) === i);
