import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import type { YTVideo } from '@/lib/types';
import { YT_CHANNELS } from '@/lib/constants';
import { generateId, classifyTags, stripHtml, truncate } from '@/lib/utils';

const parser = new Parser({ timeout: 8000 });

async function fetchChannel(channel: typeof YT_CHANNELS[number]): Promise<YTVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
  const feed = await parser.parseURL(url);

  return feed.items.slice(0, 6).map(item => {
    const videoId = item.id?.split(':').pop() ?? item.link?.split('v=').pop() ?? '';
    const text = `${item.title ?? ''} ${stripHtml(item.contentSnippet ?? '')}`;
    const tags = classifyTags(text);
    return {
      id: generateId(),
      title: stripHtml(item.title ?? ''),
      description: truncate(stripHtml(item.contentSnippet ?? item.summary ?? ''), 200),
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channelName: channel.name,
      channelId: channel.channelId,
      publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      tags,
    } satisfies YTVideo;
  });
}

export async function GET() {
  const results = await Promise.allSettled(YT_CHANNELS.map(fetchChannel));

  const videos: YTVideo[] = results
    .filter((r): r is PromiseFulfilledResult<YTVideo[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 36);

  return NextResponse.json(
    { videos, fetchedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
  );
}
