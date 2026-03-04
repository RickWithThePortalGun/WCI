import { NextRequest, NextResponse } from 'next/server';
import { createBot } from '@/lib/telegram/bot';

// Module-level singleton so the bot isn't re-created on every warm request
let bot: ReturnType<typeof createBot> | null = null;

function getBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!bot) bot = createBot(token);
  return bot;
}

export async function POST(req: NextRequest) {
  // Optional: verify Telegram's secret token header to reject spoofed requests
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const incoming = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
    if (incoming !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    await getBot().handleUpdate(body as any);
  } catch (err) {
    console.error('[telegram/webhook] handleUpdate error:', err);
    // Return 200 anyway — Telegram retries on non-2xx responses, causing spam
  }

  return NextResponse.json({ ok: true });
}
