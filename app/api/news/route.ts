import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { NewsArticle } from '@/lib/types';
import { RSS_FEEDS } from '@/lib/constants';
import { generateId, classifyTags, classifyRegion, analyzeSentiment, computeEscalationScore, stripHtml, truncate } from '@/lib/utils';

type CustomItem = {
  'media:thumbnail': { $: { url: string } };
  'media:content': { $: { url: string } };
  'enclosure': { url: string };
};

const parser = new Parser<object, CustomItem>({
  customFields: {
    item: [
      ['media:thumbnail', 'media:thumbnail'],
      ['media:content', 'media:content'],
      ['enclosure', 'enclosure'],
    ],
  },
  timeout: 8000,
});

function extractImage(item: any): string | undefined {
  return (
    item['media:thumbnail']?.$?.url ||
    item['media:content']?.$?.url ||
    item.enclosure?.url ||
    item.image?.url ||
    undefined
  );
}

async function fetchFeed(feed: typeof RSS_FEEDS[number]): Promise<NewsArticle[]> {
  const parsed = await parser.parseURL(feed.url);
  return parsed.items.slice(0, 12).map(item => {
    const text = `${item.title ?? ''} ${stripHtml(item.contentSnippet ?? item.content ?? '')}`;
    const tags = classifyTags(text);
    const region = classifyRegion(tags);
    const description = truncate(stripHtml(item.contentSnippet ?? item.summary ?? ''), 240);
    return {
      id: generateId(),
      title: stripHtml(item.title ?? ''),
      description,
      link: item.link ?? '',
      pubDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      source: feed.name,
      sourceBias: feed.bias,
      image: extractImage(item),
      tags,
      region,
      sentiment: analyzeSentiment(text),
      escalationScore: computeEscalationScore(item.title ?? '', description),
    } satisfies NewsArticle;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const region = searchParams.get('region');

  const results = await Promise.allSettled(RSS_FEEDS.map(fetchFeed));

  let articles: NewsArticle[] = results
    .filter((r): r is PromiseFulfilledResult<NewsArticle[]> => r.status === 'fulfilled')
    .flatMap(r => r.value);

  // Deduplicate by title similarity (simple approach)
  const seen = new Set<string>();
  articles = articles.filter(a => {
    const key = a.title.slice(0, 40).toLowerCase().replace(/\W/g, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter
  if (tag) articles = articles.filter(a => a.tags.includes(tag as any));
  if (region) articles = articles.filter(a => a.region === region);

  // Sort by date
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const sources = RSS_FEEDS
    .filter((_, i) => results[i].status === 'fulfilled')
    .map(f => f.name);

  return NextResponse.json({
    articles: articles.slice(0, 80),
    fetchedAt: new Date().toISOString(),
    totalCount: articles.length,
    sources,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
