import { NextRequest, NextResponse } from 'next/server';
import { createBot, broadcastAlerts, sendScheduledBriefings } from '@/lib/telegram/bot';

let bot: ReturnType<typeof createBot> | null = null;

function getBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  if (!bot) bot = createBot(token);
  return bot;
}

/**
 * Called on a schedule (e.g. every 2 minutes via Vercel Cron).
 * Checks for new high-severity articles to alert on and dispatches
 * any scheduled daily briefings whose time matches the current UTC minute.
 */
export async function GET(req: NextRequest) {
  // Vercel injects Authorization: Bearer <CRON_SECRET> automatically.
  // You can also call this manually with the same header.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('Authorization');
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
  }

  try {
    const b = getBot();
    const [alertResult, briefingResult] = await Promise.allSettled([
      broadcastAlerts(b),
      sendScheduledBriefings(b),
    ]);

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      alerts: alertResult.status,
      briefings: briefingResult.status,
    });
  } catch (err: any) {
    console.error('[telegram/cron] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
