import type { NewsArticle, ConflictZone, AIDigestResponse } from '@/lib/types';
import { CONFLICT_ZONES } from '@/lib/constants';

function baseUrl(): string {
  // APP_URL must be set in production; falls back to localhost for dev
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function fetchArticles(tag?: string, region?: string): Promise<NewsArticle[]> {
  const url = new URL('/api/news', baseUrl());
  if (tag) url.searchParams.set('tag', tag);
  if (region) url.searchParams.set('region', region);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`News API responded ${res.status}`);
  const data = await res.json();
  return (data.articles ?? []) as NewsArticle[];
}

export async function fetchAIDigest(articles: NewsArticle[]): Promise<AIDigestResponse> {
  const url = new URL('/api/ai-digest', baseUrl());
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articles }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`AI digest API responded ${res.status}`);
  return res.json() as Promise<AIDigestResponse>;
}

export function getConflictZones(): ConflictZone[] {
  return CONFLICT_ZONES;
}

export function findZone(query: string): ConflictZone | null {
  const q = query.toLowerCase().trim();
  return (
    CONFLICT_ZONES.find(
      z =>
        z.tag === q ||
        z.name.toLowerCase().includes(q) ||
        z.country.toLowerCase().includes(q) ||
        z.factions.some(f => f.toLowerCase().includes(q)) ||
        z.relatedCountries.some(c => c.toLowerCase().includes(q)),
    ) ?? null
  );
}

/** Returns the article hash used for alert deduplication (matches bot.ts logic). */
export function articleAlertKey(article: NewsArticle): string {
  return article.title.slice(0, 60).toLowerCase().replace(/\W+/g, '');
}
