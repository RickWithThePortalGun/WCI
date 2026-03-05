import { NextResponse } from 'next/server';
import type { NewsArticle } from '@/lib/types';
import { generateId, classifyTags, classifyRegion, analyzeSentiment, computeEscalationScore, stripHtml, truncate } from '@/lib/utils';

const GDELT_URL =
  'https://api.gdeltproject.org/api/v2/doc/doc?query=war+conflict+military+attack+killed+forces+troops&mode=artlist&maxrecords=25&format=json&sourcelang=english&timespan=24h';

function parseSeenDate(seendate: string): string {
  // Format: "20260305T120000Z" → "2026-03-05T12:00:00Z"
  const m = seendate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return new Date().toISOString();
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

export async function GET() {
  try {
    const res = await fetch(GDELT_URL, {
      headers: { 'User-Agent': 'WorldConflictIntel/1.0' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      return NextResponse.json({ articles: [], fetchedAt: new Date().toISOString() }, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
      });
    }

    const data = await res.json();
    const raw: Array<{ url: string; title: string; seendate: string; socialimage?: string; domain: string; sourcecountry?: string }> =
      data?.articles ?? [];

    const articles: NewsArticle[] = raw.map(item => {
      const title = stripHtml(item.title ?? '');
      const description = truncate(item.domain ? `via ${item.domain}` : '', 240);
      const text = title;
      const tags = classifyTags(text);
      const region = classifyRegion(tags);
      const sentiment = analyzeSentiment(text);
      const escalationScore = computeEscalationScore(title, description, sentiment);
      return {
        id: generateId(),
        title,
        description,
        link: item.url ?? '',
        pubDate: parseSeenDate(item.seendate ?? ''),
        source: item.domain ?? 'GDELT',
        sourceBias: 'center' as const,
        image: item.socialimage || undefined,
        tags,
        region,
        sentiment,
        escalationScore,
      };
    });

    // Only keep articles with at least one conflict tag
    const filtered = articles.filter(a => a.tags.length > 0);

    return NextResponse.json({
      articles: filtered,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' },
    });
  } catch {
    return NextResponse.json({ articles: [], fetchedAt: new Date().toISOString() }, {
      headers: { 'Cache-Control': 'public, s-maxage=60' },
    });
  }
}
