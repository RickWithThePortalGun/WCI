import { NextResponse } from 'next/server';
import { decode } from 'he';
import type { TelegramChannelMessage } from '@/lib/types';

const CHANNEL_HANDLE = 'Middle_East_Spectator';
const CHANNEL_NAME = 'Middle East Spectator';
const CHANNEL_URL = `https://t.me/${CHANNEL_HANDLE}`;
const PUBLIC_CHANNEL_PAGE = `https://t.me/s/${CHANNEL_HANDLE}`;
const MAX_MESSAGES = 20;

function stripHtml(input: string): string {
  return decode(input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function parseCompactNumber(raw: string): number | undefined {
  const s = raw.replace(/,/g, '').trim();
  if (!s) return undefined;
  const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?$/i);
  if (!m) {
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  const base = Number(m[1]);
  const suffix = (m[2] ?? '').toUpperCase();
  const mult = suffix === 'K' ? 1_000 : suffix === 'M' ? 1_000_000 : suffix === 'B' ? 1_000_000_000 : 1;
  const n = base * mult;
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function parseReactions(chunk: string): Array<{ emoji: string; count: number }> | undefined {
  // Telegram's public HTML structure can vary; handle a couple common patterns.
  const out: Array<{ emoji: string; count: number }> = [];

  // Pattern A: reaction button contains emoji + count text nearby
  // (best-effort; may miss some variants)
  const blocks = chunk.match(/tgme_widget_message_reaction[\s\S]*?<\/span>\s*<\/span>/g) ?? [];
  for (const b of blocks) {
    const emoji = stripHtml((b.match(/tgme_widget_message_reaction_emoji[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '')).trim();
    const countRaw = stripHtml((b.match(/tgme_widget_message_reaction_count[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '')).trim();
    const count = parseCompactNumber(countRaw);
    if (emoji && typeof count === 'number') out.push({ emoji, count });
  }

  // Pattern B fallback: any "tgme_reactions" list items (older/newer markup)
  if (out.length === 0) {
    const items = chunk.match(/tgme_reactions__reaction[\s\S]*?<\/span>\s*<\/span>/g) ?? [];
    for (const it of items) {
      const emoji = stripHtml((it.match(/tgme_reactions__emoji[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '')).trim();
      const countRaw = stripHtml((it.match(/tgme_reactions__count[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '')).trim();
      const count = parseCompactNumber(countRaw);
      if (emoji && typeof count === 'number') out.push({ emoji, count });
    }
  }

  return out.length ? out : undefined;
}

function parseMessages(html: string): TelegramChannelMessage[] {
  const chunks = html.match(/<div class="tgme_widget_message_wrap[\s\S]*?<\/div>\s*<\/div>/g) ?? [];
  const output: TelegramChannelMessage[] = [];

  for (const chunk of chunks) {
    const postMatch = chunk.match(/data-post="([^"]+)"/);
    if (!postMatch) continue;

    const postId = postMatch[1].split('/')[1];
    if (!postId) continue;

    const dateMatch = chunk.match(/datetime="([^"]+)"/);
    const textMatch = chunk.match(
      /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );

    // Media thumb (best-effort) — photos/videos have a wrap with background-image
    const bgUrlMatch = chunk.match(/background-image:url\('([^']+)'\)/);
    const thumbUrl = bgUrlMatch?.[1];
    const hasVideo = /tgme_widget_message_video|tgme_widget_message_video_player/.test(chunk);
    const hasPhoto = /tgme_widget_message_photo_wrap/.test(chunk);
    const hasDoc = /tgme_widget_message_document/.test(chunk);

    // Try to find actual media URL (best-effort)
    // Photo: anchor href usually points to the post, but in some variants it points to media.
    const photoHref = chunk.match(/tgme_widget_message_photo_wrap[^>]*href="([^"]+)"/)?.[1];
    const videoSrc =
      chunk.match(/<video[^>]+src="([^"]+)"/)?.[1] ??
      chunk.match(/data-video="([^"]+)"/)?.[1];
    const docHref = chunk.match(/tgme_widget_message_document[^>]*href="([^"]+)"/)?.[1];

    const mediaUrl =
      (hasVideo ? videoSrc : undefined) ??
      (hasDoc ? docHref : undefined) ??
      (hasPhoto ? photoHref : undefined);

    const viewsMatch = chunk.match(/<span class="tgme_widget_message_views">([^<]+)<\/span>/);
    const views = viewsMatch ? parseCompactNumber(stripHtml(viewsMatch[1])) : undefined;

    const reactions = parseReactions(chunk);

    // Use caption/text if present; otherwise label media clearly
    const extractedText = stripHtml(textMatch?.[1] ?? '');
    const fallback =
      hasVideo ? '[Video]' :
      hasPhoto ? '[Photo]' :
      hasDoc ? '[Document]' :
      '[Post]';

    output.push({
      id: String(postId),
      channel: CHANNEL_NAME,
      channelUrl: CHANNEL_URL,
      text: extractedText || fallback,
      date: dateMatch?.[1] ?? new Date().toISOString(),
      messageUrl: `${CHANNEL_URL}/${postId}`,
      views,
      reactions,
      media: (thumbUrl || hasVideo || hasPhoto || hasDoc)
        ? {
            type: hasVideo ? 'video' : hasPhoto ? 'photo' : hasDoc ? 'document' : 'unknown',
            thumbUrl,
            url: mediaUrl,
          }
        : undefined,
    });

    if (output.length >= MAX_MESSAGES) break;
  }

  return output;
}

export async function GET() {
  try {
    const res = await fetch(PUBLIC_CHANNEL_PAGE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WCI/1.0; +https://www.wcintel.com.ng)',
      },
      next: { revalidate: 180 },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          channel: CHANNEL_NAME,
          channelUrl: CHANNEL_URL,
          fetchedAt: new Date().toISOString(),
          messages: [],
          warning: `Telegram source returned HTTP ${res.status}.`,
        },
        { status: 200 },
      );
    }

    const html = await res.text();
    const messages = parseMessages(html);

    return NextResponse.json(
      {
        channel: CHANNEL_NAME,
        channelUrl: CHANNEL_URL,
        fetchedAt: new Date().toISOString(),
        messages,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return NextResponse.json(
      {
        channel: CHANNEL_NAME,
        channelUrl: CHANNEL_URL,
        fetchedAt: new Date().toISOString(),
        messages: [],
        warning: 'Failed to load Telegram channel feed.',
      },
      { status: 200 },
    );
  }
}
