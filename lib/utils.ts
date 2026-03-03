import type { ConflictTag, Region, NewsArticle } from './types';
import { TAG_KEYWORDS, NEGATIVE_WORDS, POSITIVE_WORDS, TAG_TO_REGION } from './constants';
import { nanoid } from 'nanoid'; // fallback: we'll use a simple id fn

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function classifyTags(text: string): ConflictTag[] {
  const lower = text.toLowerCase();
  return (Object.entries(TAG_KEYWORDS) as [ConflictTag, string[]][])
    .filter(([, kws]) => kws.some(kw => lower.includes(kw)))
    .map(([tag]) => tag)
    .slice(0, 5);
}

export function classifyRegion(tags: ConflictTag[]): Region {
  for (const tag of tags) {
    if (TAG_TO_REGION[tag]) return TAG_TO_REGION[tag];
  }
  return 'Global';
}

export function analyzeSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 0.15;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 0.1;
  return Math.max(-1, Math.min(1, score));
}

export function computeEscalationScore(title: string, desc: string): number {
  const HIGH = ['nuclear', 'missile', 'bomb', 'killed', 'attack', 'explosion', 'war', 'strike', 'troops', 'invasion', 'offensive', 'ceasefire violated'];
  const MED = ['tension', 'military', 'clash', 'conflict', 'sanction', 'troops', 'deploy', 'protest'];
  const text = `${title} ${desc}`.toLowerCase();
  let score = 3;
  for (const w of HIGH) if (text.includes(w)) score += 1.2;
  for (const w of MED) if (text.includes(w)) score += 0.5;
  return Math.min(10, parseFloat(score.toFixed(1)));
}

export function stripHtml(str: string): string {
  return str?.replace(/<[^>]+>/g, '') ?? '';
}

export function truncate(str: string, n: number): string {
  return str?.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
