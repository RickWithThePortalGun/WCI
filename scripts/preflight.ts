#!/usr/bin/env tsx
/**
 * WCI Pre-Flight Verification Suite
 *
 * Tests every aspect of the platform against the live deployment.
 * Exits 0 on full pass (webhook auto-registered), 1 on any failure.
 *
 * Usage:
 *   tsx --env-file=.env scripts/preflight.ts
 *   tsx --env-file=.env scripts/preflight.ts --url https://staging.example.com
 *   tsx --env-file=.env scripts/preflight.ts --skip-register
 */

const args = process.argv.slice(2);
const urlIdx = args.indexOf('--url');
const BASE = ((urlIdx !== -1 ? args[urlIdx + 1] : null) ?? process.env.APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const SKIP_REGISTER = args.includes('--skip-register');

const BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN ?? '';
const CRON_SECRET = process.env.CRON_SECRET ?? '';

// ── Terminal colours ──────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
};

// ── Test runner ───────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
let warned = 0;
const failures: string[] = [];
const warnings: string[] = [];

async function check(name: string, fn: () => Promise<void>): Promise<boolean> {
  process.stdout.write(`  ${c.dim}○${c.reset} ${name} ... `);
  try {
    await fn();
    process.stdout.write(`${c.green}✓${c.reset}\n`);
    passed++;
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stdout.write(`${c.red}✗${c.reset}  ${c.dim}${msg}${c.reset}\n`);
    failed++;
    failures.push(`${name}: ${msg}`);
    return false;
  }
}

/** Warn-only check — logs but does NOT block deployment. Use for external dependencies. */
async function soft(name: string, fn: () => Promise<void>): Promise<void> {
  process.stdout.write(`  ${c.dim}◌${c.reset} ${name} ... `);
  try {
    await fn();
    process.stdout.write(`${c.green}✓${c.reset}\n`);
    passed++;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stdout.write(`${c.yellow}⚠${c.reset}  ${c.dim}${msg}${c.reset}\n`);
    warned++;
    warnings.push(`${name}: ${msg}`);
  }
}

function section(title: string) {
  console.log(`\n${c.bold}${c.cyan}▸ ${title}${c.reset}`);
}

function assert(condition: boolean, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

async function apiGet(path: string, opts?: RequestInit): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...opts,
    signal: AbortSignal.timeout(20_000),
  });
}

async function tgApi(method: string, body?: object): Promise<unknown> {
  assert(!!BOT_TOKEN, 'TELEGRAM_BOT_TOKEN not set');
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as { ok: boolean; description?: string; result?: unknown };
  assert(data.ok, data.description ?? `Telegram API error on ${method}`);
  return data.result;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}╔════════════════════════════════════════════╗`);
  console.log(`║   WCI PRE-FLIGHT VERIFICATION SUITE        ║`);
  console.log(`╚════════════════════════════════════════════╝${c.reset}`);
  console.log(`${c.dim}  Target : ${BASE}${c.reset}`);
  console.log(`${c.dim}  Time   : ${new Date().toUTCString()}${c.reset}`);

  // ── 1. Environment ──────────────────────────────────────────────────────────
  section('1 · Environment Variables');

  await check('TELEGRAM_BOT_TOKEN is set and shaped correctly', async () => {
    assert(!!BOT_TOKEN, 'not set');
    assert(BOT_TOKEN.includes(':'), 'missing ":" separator — token looks malformed');
  });

  await check('CRON_SECRET is set (≥ 32 chars)', async () => {
    assert(!!CRON_SECRET, 'not set');
    assert(CRON_SECRET.length >= 32, `only ${CRON_SECRET.length} chars — use openssl rand -hex 32`);
  });

  await check('APP_URL is HTTPS (or localhost for dev)', async () => {
    const url = process.env.APP_URL ?? '';
    assert(!!url, 'not set');
    assert(
      url.startsWith('https://') || url.startsWith('http://localhost'),
      'must start with https:// in production',
    );
  });

  await check('UPSTASH_REDIS_REST_URL is set', async () => {
    assert(!!process.env.UPSTASH_REDIS_REST_URL, 'not set');
  });

  await check('UPSTASH_REDIS_REST_TOKEN is set', async () => {
    assert(!!process.env.UPSTASH_REDIS_REST_TOKEN, 'not set');
  });

  await check('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is set', async () => {
    assert(!!process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, 'not set — bot link in web UI will be hidden');
  });

  // ── 2. API Endpoints ────────────────────────────────────────────────────────
  section('2 · API Endpoints');

  await check('GET /api/news → articles array with valid shape', async () => {
    const res = await apiGet('/api/news');
    assert(res.ok, `HTTP ${res.status}`);
    const data = (await res.json()) as { articles?: unknown[] };
    assert(Array.isArray(data.articles), '"articles" is not an array');
    assert(data.articles.length > 0, 'empty — RSS feeds may be down');
    const a = data.articles[0] as Record<string, unknown>;
    assert(typeof a.title === 'string', 'article.title missing');
    assert(typeof a.escalationScore === 'number', 'article.escalationScore missing');
    assert(typeof a.source === 'string', 'article.source missing');
  });

  // YouTube feeds are external — Vercel IPs can be throttled by YouTube. Warn-only.
  await soft('GET /api/youtube → videos array non-empty [external; warn only]', async () => {
    const res = await apiGet('/api/youtube');
    assert(res.ok, `HTTP ${res.status}`);
    const data = (await res.json()) as { videos?: unknown[] };
    assert(Array.isArray(data.videos), '"videos" is not an array');
    assert(data.videos.length > 0, 'empty — YouTube may be throttling Vercel IPs');
    const v = data.videos[0] as Record<string, unknown>;
    assert(typeof v.title === 'string', 'video.title missing');
    assert(typeof v.videoUrl === 'string', 'video.videoUrl missing');
    assert(typeof v.channelName === 'string', 'video.channelName missing');
  });

  await soft('GET /api/youtube → Predictive History channel present [external; warn only]', async () => {
    const res = await apiGet('/api/youtube');
    const data = (await res.json()) as { videos?: Array<{ channelName: string }> };
    const has = (data.videos ?? []).some(v => v.channelName === 'Predictive History');
    assert(has, 'channel not found — check YT_CHANNELS in constants.ts or YouTube may be throttling');
  });

  await check('GET /api/visitors?sessionId=preflight → count number', async () => {
    const res = await apiGet('/api/visitors?sessionId=preflight-check');
    assert(res.ok, `HTTP ${res.status}`);
    const data = (await res.json()) as { count?: unknown };
    assert(typeof data.count === 'number', `"count" is ${typeof data.count}`);
  });

  await check('POST /api/ai-digest → endpoint reachable (200 or 503)', async () => {
    const res = await apiGet('/api/ai-digest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articles: [] }),
    });
    // 200 = has API key; 503 = no key (expected); 400 = bad input
    assert(
      [200, 400, 503].includes(res.status),
      `Unexpected HTTP ${res.status} — route may be broken`,
    );
  });

  // ── 3. Auth Protection ──────────────────────────────────────────────────────
  section('3 · Auth Protection');

  await check('GET /api/telegram/cron without token → 401', async () => {
    const res = await apiGet('/api/telegram/cron');
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  await check('GET /api/telegram/cron with wrong token → 401', async () => {
    const res = await apiGet('/api/telegram/cron', {
      headers: { Authorization: 'Bearer definitely-wrong-secret' },
    });
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  await check('GET /api/telegram/cron with correct token → 200', async () => {
    const res = await apiGet('/api/telegram/cron', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    assert(res.ok, `expected 200, got ${res.status}`);
  });

  await check('GET /api/telegram/register without secret → 401', async () => {
    const res = await apiGet('/api/telegram/register');
    assert(res.status === 401, `expected 401, got ${res.status}`);
  });

  // ── 4. Telegram Bot ─────────────────────────────────────────────────────────
  section('4 · Telegram Bot');

  await check('Bot token is valid (getMe)', async () => {
    const me = (await tgApi('getMe')) as { is_bot: boolean; username: string };
    assert(me.is_bot, 'response says is_bot=false');
    assert(!!me.username, 'bot username is empty');
  });

  await check('Webhook is registered at correct path', async () => {
    const info = (await tgApi('getWebhookInfo')) as { url: string };
    assert(!!info.url, 'webhook URL is empty — run /api/telegram/register');
    assert(info.url.includes('/api/telegram/webhook'), `unexpected path: ${info.url}`);
    assert(info.url.startsWith('https://'), 'webhook must be HTTPS');
  });

  await check('Webhook domain matches APP_URL', async () => {
    const info = (await tgApi('getWebhookInfo')) as { url: string };
    const expectedHost = new URL(BASE).hostname;
    const actualHost   = new URL(info.url).hostname;
    assert(actualHost === expectedHost, `webhook host "${actualHost}" ≠ APP_URL host "${expectedHost}"`);
  });

  await check('No recent webhook errors (< 5 min)', async () => {
    const info = (await tgApi('getWebhookInfo')) as {
      last_error_message?: string;
      last_error_date?: number;
    };
    if (info.last_error_message && info.last_error_date) {
      const ageMs = Date.now() - info.last_error_date * 1000;
      if (ageMs < 5 * 60 * 1000) {
        throw new Error(`${info.last_error_message} (${Math.round(ageMs / 1000)}s ago)`);
      }
    }
  });

  await check('Webhook has no pending update backlog', async () => {
    const info = (await tgApi('getWebhookInfo')) as { pending_update_count: number };
    const backlog = info.pending_update_count ?? 0;
    assert(backlog < 100, `${backlog} updates pending — bot may not be processing updates`);
  });

  // ── 5. Bot Command Simulation ────────────────────────────────────────────────
  section('5 · Bot Commands (via webhook)');

  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
  const SIM_CHAT_ID = 999999999; // non-existent chat — Telegram will reject but route should process
  const simHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (WEBHOOK_SECRET) simHeaders['X-Telegram-Bot-Api-Secret-Token'] = WEBHOOK_SECRET;

  function buildUpdate(text: string, id: number) {
    return {
      update_id: id,
      message: {
        message_id: id,
        from: { id: SIM_CHAT_ID, is_bot: false, first_name: 'Preflight', username: 'preflight_test' },
        chat: { id: SIM_CHAT_ID, type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text,
        entities: text.startsWith('/') ? [{ offset: 0, length: text.split(' ')[0].length, type: 'bot_command' }] : [],
      },
    };
  }

  const BOT_COMMANDS = [
    '/start', '/sitrep', '/flash', '/top', '/compare',
    '/region ukraine', '/search ukraine', '/brief',
    '/watch', '/alerts', '/schedule', '/sources',
    '/profile', '/videos', '/predict', '/stats', '/help',
  ];

  for (const cmd of BOT_COMMANDS) {
    await check(`Webhook processes ${cmd}`, async () => {
      const res = await apiGet('/api/telegram/webhook', {
        method: 'POST',
        headers: simHeaders,
        body: JSON.stringify(buildUpdate(cmd, Math.floor(Math.random() * 1e9))),
      });
      // Webhook must always return 200 to prevent Telegram from retrying
      assert(res.status === 200, `expected 200, got ${res.status}`);
    });
  }

  // ── 6. Webhook Registration ─────────────────────────────────────────────────
  if (!SKIP_REGISTER && failed === 0) {
    section('6 · Webhook Re-Registration');

    await check('Register webhook & set bot commands', async () => {
      const res = await apiGet(`/api/telegram/register?secret=${encodeURIComponent(CRON_SECRET)}`);
      assert(res.ok, `register endpoint returned HTTP ${res.status}`);
      const data = (await res.json()) as { webhook?: { ok: boolean; description?: string } };
      assert(data.webhook?.ok === true, `Telegram rejected webhook: ${data.webhook?.description ?? JSON.stringify(data)}`);
    });
  } else if (SKIP_REGISTER) {
    console.log(`\n${c.dim}  ⊘ Webhook registration skipped (--skip-register)${c.reset}`);
  } else {
    console.log(`\n${c.yellow}  ⚠ Webhook registration skipped — fix failures first${c.reset}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const total = passed + failed + warned;
  console.log(`\n${c.bold}════════════════════════════════════════════════${c.reset}`);

  if (failed === 0) {
    console.log(`${c.green}${c.bold}  ✓ ${passed}/${total} CHECKS PASSED — DEPLOYMENT APPROVED${c.reset}`);
    if (warned > 0) {
      console.log(`${c.yellow}  ⚠ ${warned} warning(s) — external dependencies may be degraded${c.reset}`);
      for (const w of warnings) console.log(`    ${c.dim}•${c.reset} ${c.yellow}${w}${c.reset}`);
    }
  } else {
    console.log(`${c.red}${c.bold}  ✗ ${failed} / ${total} CHECKS FAILED — DEPLOYMENT BLOCKED${c.reset}`);
    if (warned > 0) console.log(`${c.yellow}  ⚠ ${warned} additional warning(s)${c.reset}`);
    console.log(`\n${c.red}  Failures:${c.reset}`);
    for (const f of failures) console.log(`    ${c.dim}•${c.reset} ${f}`);
  }

  console.log(`${c.bold}════════════════════════════════════════════════${c.reset}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`\n${c.red}FATAL: ${err instanceof Error ? err.message : String(err)}${c.reset}\n`);
  process.exit(1);
});
