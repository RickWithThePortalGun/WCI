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

    output.push({
      id: String(postId),
      channel: CHANNEL_NAME,
      channelUrl: CHANNEL_URL,
      text: stripHtml(textMatch?.[1] ?? ''),
      date: dateMatch?.[1] ?? new Date().toISOString(),
      messageUrl: `${CHANNEL_URL}/${postId}`,
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
