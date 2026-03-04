import { NextRequest, NextResponse } from 'next/server';

/**
 * Registers the Telegram webhook with BotFather's API.
 * Call once after deploying: GET /api/telegram/register?secret=<CRON_SECRET>
 *
 * Telegram will then POST updates to /api/telegram/webhook.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const incoming = req.nextUrl.searchParams.get('secret');
  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 503 });
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: 'APP_URL not configured' }, { status: 503 });
  }

  const webhookUrl = `${appUrl.replace(/\/$/, '')}/api/telegram/webhook`;
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  const body: Record<string, string> = { url: webhookUrl };
  if (webhookSecret) body.secret_token = webhookSecret;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  // Also enable inline mode (allows @bot queries in any chat)
  await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start',    description: 'Initialize WCI bot & register' },
        { command: 'sitrep',   description: 'Global situation report' },
        { command: 'flash',    description: 'Top 5 breaking high-severity stories' },
        { command: 'top',      description: 'Top stories by escalation score' },
        { command: 'compare',  description: 'Escalation matrix for all conflict zones' },
        { command: 'region',   description: 'Deep-dive on a specific conflict zone' },
        { command: 'search',   description: 'Search current headlines' },
        { command: 'brief',    description: 'AI-generated intelligence digest' },
        { command: 'watch',    description: 'Manage zone watchlist & alerts' },
        { command: 'alerts',   description: 'Configure escalation alert threshold' },
        { command: 'schedule', description: 'Set daily briefing time (HH:MM UTC)' },
        { command: 'sources',  description: 'Toggle news sources' },
        { command: 'profile',  description: 'Switch Analyst / Summary mode' },
        { command: 'videos',   description: 'Live video feeds from BBC, Al Jazeera & more' },
        { command: 'predict',  description: 'Prof. Jiang\'s analysis matched to your watchlist' },
        { command: 'stats',    description: 'Bot statistics' },
        { command: 'help',     description: 'Full command reference' },
      ],
    }),
  });

  return NextResponse.json({
    webhook: data,
    webhookUrl,
  });
}
