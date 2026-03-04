/**
 * Development polling mode for the WCI Telegram bot.
 *
 * Usage:
 *   npm run bot:dev
 *
 * This uses Telegraf's long-polling — no webhook or public URL needed.
 * The bot checks for new alerts every 2 minutes while running.
 *
 * Required env:  TELEGRAM_BOT_TOKEN
 * Optional env:  APP_URL (defaults to http://localhost:3000)
 *                BOT_DATA_PATH (defaults to ./data/bot-store.json)
 */

import path from 'path';

// Register path aliases so @/lib/... imports work outside Next.js
import { register } from 'tsconfig-paths';
register({
  baseUrl: path.resolve(__dirname, '..'),
  paths: { '@/*': ['./*'] },
});

import { createBot, broadcastAlerts, sendScheduledBriefings } from '../lib/telegram/bot';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('❌  TELEGRAM_BOT_TOKEN is required. Add it to your .env file.');
  process.exit(1);
}

const bot = createBot(token);

// Poll for alerts and trigger any scheduled briefings every 2 minutes
const INTERVAL_MS = 2 * 60 * 1000;
let alertTimer: NodeJS.Timeout;

async function runChecks() {
  await Promise.allSettled([
    broadcastAlerts(bot),
    sendScheduledBriefings(bot),
  ]);
}

// Run immediately on startup, then on interval
runChecks().catch(console.error);
alertTimer = setInterval(() => { runChecks().catch(console.error); }, INTERVAL_MS);

bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log('✅  WCI Bot is running in polling mode.');
  console.log(`    Checking for alerts every ${INTERVAL_MS / 1000}s`);
  console.log('    Press Ctrl+C to stop.\n');
}).catch(err => {
  console.error('❌  Failed to launch bot:', err.message);
  process.exit(1);
});

function shutdown(signal: string) {
  console.log(`\n[${signal}] Shutting down…`);
  clearInterval(alertTimer);
  bot.stop(signal);
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
