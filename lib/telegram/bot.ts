import { Telegraf, Markup } from 'telegraf';
import type { Context } from 'telegraf';
import type { InlineQueryResult } from '@telegraf/types';
import type { ConflictTag } from '@/lib/types';
import { CONFLICT_ZONES } from '@/lib/constants';

import {
  createSubscriber,
  getSubscriber,
  updateSubscriber,
  removeSubscriber,
  getAllSubscribers,
  hasAlertBeenSent,
  markAlertSent,
  getStats,
} from './store';
import {
  h,
  formatWelcome,
  formatSitrep,
  formatFlash,
  formatTopStories,
  formatRegionIntel,
  formatCompare,
  formatSearchResults,
  formatAlert,
  formatBriefing,
  formatWatchMenu,
  formatAlertConfig,
  formatSchedule,
  formatHelp,
  formatProfile,
  formatStats,
} from './formatters';
import {
  fetchArticles,
  fetchAIDigest,
  findZone,
  getConflictZones,
  articleAlertKey,
} from './intel';

// ── Constants ──────────────────────────────────────────────────────────

const WATCHABLE_TAGS: ConflictTag[] = [
  'ukraine', 'russia', 'gaza', 'israel', 'taiwan', 'china',
  'iran', 'sudan', 'myanmar', 'yemen', 'sahel', 'drc',
  'korea', 'lebanon', 'kashmir', 'ethiopia', 'nuclear', 'cyber', 'nato',
];

const ALL_SOURCES = [
  'BBC World', 'Al Jazeera', 'Reuters World',
  'The Guardian', 'DW News', 'France 24', 'RFI English',
];

const LINK_PREVIEW_OFF = { is_disabled: true } as const;
const HTML_OPTS = { parse_mode: 'HTML' as const, link_preview_options: LINK_PREVIEW_OFF };

// ── Helpers ────────────────────────────────────────────────────────────

async function send(ctx: Context, text: string): Promise<void> {
  await ctx.replyWithHTML(text, { link_preview_options: LINK_PREVIEW_OFF });
}

async function typing(ctx: Context): Promise<void> {
  try { await ctx.sendChatAction('typing'); } catch {}
}

/** Resolve subscriber, creating one if it doesn't exist yet. */
async function resolveSub(id: number, username?: string, firstName?: string) {
  return (await getSubscriber(id)) ?? (await createSubscriber(id, username, firstName));
}

/** Build the inline keyboard for /watch */
function buildWatchKeyboard(watchlist: ConflictTag[]) {
  const buttons = WATCHABLE_TAGS.map(tag => {
    const on = watchlist.includes(tag);
    const zone = CONFLICT_ZONES.find(z => z.tag === tag);
    const emoji = zone
      ? (zone.severity >= 9 ? '🔴' : zone.severity >= 7.5 ? '🟠' : zone.severity >= 6 ? '🟡' : '🟢')
      : '⚪';
    return Markup.button.callback(`${on ? '✅' : emoji} ${tag}`, `watch:${tag}`);
  });
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 3) rows.push(buttons.slice(i, i + 3));
  rows.push([
    Markup.button.callback('📡 Watch ALL', 'watch:__all'),
    Markup.button.callback('🗑 Clear all', 'watch:__none'),
  ]);
  return Markup.inlineKeyboard(rows);
}

/** Build the inline keyboard for /region zone selection */
function buildRegionKeyboard() {
  const buttons = CONFLICT_ZONES.map(z => {
    const emoji = z.severity >= 9 ? '🔴' : z.severity >= 7.5 ? '🟠' : z.severity >= 6 ? '🟡' : '🟢';
    const short = z.name.length > 22 ? z.name.slice(0, 21) + '…' : z.name;
    return Markup.button.callback(`${emoji} ${short}`, `region:${z.tag}`);
  });
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  return Markup.inlineKeyboard(rows);
}

// ── Bot Factory ────────────────────────────────────────────────────────

export function createBot(token: string): Telegraf {
  const bot = new Telegraf(token);

  // ── /start ─────────────────────────────────────────────────────────
  bot.start(async ctx => {
    const { id, username, first_name } = ctx.from;
    await createSubscriber(id, username, first_name);
    await send(ctx, formatWelcome(first_name));
  });

  // ── /help ──────────────────────────────────────────────────────────
  bot.help(async ctx => { await send(ctx, formatHelp()); });
  bot.command('help', async ctx => { await send(ctx, formatHelp()); });

  // ── /sitrep ────────────────────────────────────────────────────────
  bot.command('sitrep', async ctx => {
    await send(ctx, formatSitrep(getConflictZones()));
  });

  // ── /flash ─────────────────────────────────────────────────────────
  bot.command('flash', async ctx => {
    await typing(ctx);
    try {
      const articles = await fetchArticles();
      const high = articles.filter(a => a.escalationScore >= 7.0);
      await send(ctx, formatFlash(high.length >= 3 ? high : articles));
    } catch {
      await ctx.reply('⚠️ Could not fetch latest intel. Please try again shortly.');
    }
  });

  // ── /top ───────────────────────────────────────────────────────────
  bot.command('top', async ctx => {
    await typing(ctx);
    const arg = ctx.message.text.split(' ')[1];
    const count = Math.min(15, Math.max(1, parseInt(arg ?? '8', 10) || 8));
    try {
      const articles = await fetchArticles();
      await send(ctx, formatTopStories(articles, count));
    } catch {
      await ctx.reply('⚠️ Could not fetch stories. Please try again shortly.');
    }
  });

  // ── /compare ───────────────────────────────────────────────────────
  bot.command('compare', async ctx => {
    await send(ctx, formatCompare(getConflictZones()));
  });

  // ── /region ────────────────────────────────────────────────────────
  bot.command('region', async ctx => {
    const input = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!input) {
      await ctx.replyWithHTML('🗺 <b>SELECT A CONFLICT ZONE:</b>', buildRegionKeyboard());
      return;
    }
    const zone = findZone(input);
    if (!zone) {
      await ctx.replyWithHTML(
        `❌ No zone found matching <b>"${h(input)}"</b>\n\nTry /region to browse all zones.`,
        { link_preview_options: LINK_PREVIEW_OFF },
      );
      return;
    }
    await typing(ctx);
    try {
      const articles = await fetchArticles(zone.tag);
      await send(ctx, formatRegionIntel(zone, articles));
    } catch {
      await ctx.reply('⚠️ Could not fetch regional intel.');
    }
  });

  // ── /search ────────────────────────────────────────────────────────
  bot.command('search', async ctx => {
    const query = ctx.message.text.split(' ').slice(1).join(' ').trim();
    if (!query) {
      await ctx.reply('Usage: /search [query]\nExample: /search missile strike');
      return;
    }
    await typing(ctx);
    try {
      const articles = await fetchArticles();
      const q = query.toLowerCase();
      const results = articles.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some(t => t.includes(q)) ||
          a.source.toLowerCase().includes(q) ||
          a.region.toLowerCase().includes(q),
      );
      await send(ctx, formatSearchResults(query, results));
    } catch {
      await ctx.reply('⚠️ Search failed. Please try again.');
    }
  });

  // ── /brief ─────────────────────────────────────────────────────────
  bot.command('brief', async ctx => {
    await typing(ctx);
    try {
      const articles = await fetchArticles();
      const digest = await fetchAIDigest(articles);
      await send(ctx, formatBriefing(digest));
    } catch (err: any) {
      if (err.message?.includes('503') || err.message?.includes('API key')) {
        await ctx.reply('⚠️ AI briefings require OPENAI_API_KEY to be configured on the server.\n\nTry /flash for raw breaking intel instead.');
      } else {
        await ctx.reply('⚠️ Briefing generation failed. Try /flash for raw intel.');
      }
    }
  });

  // ── /watch ─────────────────────────────────────────────────────────
  bot.command('watch', async ctx => {
    const { id, username, first_name } = ctx.from;
    const arg = ctx.message.text.split(' ')[1]?.trim() as ConflictTag | undefined;
    const sub = await resolveSub(id, username, first_name);

    if (arg && WATCHABLE_TAGS.includes(arg)) {
      const already = sub.watchlist.includes(arg);
      await updateSubscriber(id, {
        watchlist: already
          ? sub.watchlist.filter(t => t !== arg)
          : [...sub.watchlist, arg],
      });
      await ctx.replyWithHTML(
        already
          ? `○ Removed <code>${arg}</code> from your watchlist.`
          : `✅ Now watching <code>${arg}</code>. You'll receive alerts when escalation exceeds your threshold.`,
      );
      return;
    }
    await ctx.replyWithHTML(formatWatchMenu(sub.watchlist), buildWatchKeyboard(sub.watchlist));
  });

  // ── /alerts ────────────────────────────────────────────────────────
  bot.command('alerts', async ctx => {
    const { id, username, first_name } = ctx.from;
    const sub = await resolveSub(id, username, first_name);
    const thresholds = [5.0, 6.0, 7.0, 7.5, 8.0, 9.0];
    const rows = thresholds.map(t =>
      Markup.button.callback(
        `${t === sub.alertThreshold ? '✅ ' : ''}${t.toFixed(1)} — ${
          t >= 9 ? 'Critical only' : t >= 8 ? 'High severity' : t >= 7 ? 'Elevated+' : 'Any tension'
        }`,
        `threshold:${t}`,
      ),
    ).map(b => [b]);
    await ctx.replyWithHTML(formatAlertConfig(sub.alertThreshold), Markup.inlineKeyboard(rows));
  });

  // ── /schedule ──────────────────────────────────────────────────────
  bot.command('schedule', async ctx => {
    const { id, username, first_name } = ctx.from;
    const sub = await resolveSub(id, username, first_name);
    const input = ctx.message.text.split(' ').slice(1).join(' ').trim();

    if (input === 'off' || input === 'disable') {
      await updateSubscriber(id, { briefingTime: null });
      await ctx.reply('✅ Daily briefing disabled.');
      return;
    }
    if (/^\d{1,2}:\d{2}$/.test(input)) {
      const [hh, mm] = input.split(':').map(Number);
      if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
        const formatted = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        await updateSubscriber(id, { briefingTime: formatted });
        await ctx.replyWithHTML(
          `✅ Daily intelligence briefing scheduled for <b>${formatted} UTC</b>.\n\nYou'll receive an AI-generated digest every day at that time.`,
        );
        return;
      }
    }
    await ctx.replyWithHTML(formatSchedule(sub.briefingTime));
  });

  // ── /sources ───────────────────────────────────────────────────────
  bot.command('sources', async ctx => {
    const { id, username, first_name } = ctx.from;
    const sub = await resolveSub(id, username, first_name);
    const enabled = sub.enabledSources.length === 0 ? ALL_SOURCES : sub.enabledSources;
    const buttons = ALL_SOURCES.map(s =>
      Markup.button.callback(`${enabled.includes(s) ? '✅' : '○'} ${s}`, `source:${s}`),
    ).map(b => [b]);
    buttons.push([
      Markup.button.callback('✅ Enable all', 'source:__all'),
      Markup.button.callback('Save ✓', 'source:__save'),
    ]);
    await ctx.replyWithHTML(
      `📡 <b>NEWS SOURCES</b>\n\nActive: <i>${h(enabled.join(', '))}</i>\n\nToggle sources you want to receive alerts from:`,
      Markup.inlineKeyboard(buttons),
    );
  });

  // ── /profile ───────────────────────────────────────────────────────
  bot.command('profile', async ctx => {
    const { id, username, first_name } = ctx.from;
    const sub = await resolveSub(id, username, first_name);
    await ctx.replyWithHTML(
      formatProfile(sub.profile),
      Markup.inlineKeyboard([[
        Markup.button.callback(`${sub.profile === 'analyst' ? '✅ ' : ''}Analyst`, 'profile:analyst'),
        Markup.button.callback(`${sub.profile === 'summary' ? '✅ ' : ''}Summary`, 'profile:summary'),
      ]]),
    );
  });

  // ── /stats ─────────────────────────────────────────────────────────
  bot.command('stats', async ctx => {
    await send(ctx, formatStats(await getStats()));
  });

  // ── Callback Queries ───────────────────────────────────────────────

  // Region deep-dive from /region keyboard
  bot.action(/^region:(.+)$/, async ctx => {
    const tag = ctx.match[1];
    const zone = CONFLICT_ZONES.find(z => z.tag === tag);
    if (!zone) { await ctx.answerCbQuery('Zone not found'); return; }
    await ctx.answerCbQuery(`Loading ${zone.name}…`);
    await ctx.sendChatAction('typing');
    try {
      const articles = await fetchArticles(tag);
      await ctx.replyWithHTML(formatRegionIntel(zone, articles), { link_preview_options: LINK_PREVIEW_OFF });
    } catch {
      await ctx.reply('⚠️ Could not fetch regional intel.');
    }
  });

  // Watch toggle
  bot.action(/^watch:(.+)$/, async ctx => {
    const chatId = ctx.from.id;
    const value = ctx.match[1];
    const sub = await resolveSub(chatId, ctx.from.username, ctx.from.first_name);

    if (value === '__all') {
      await updateSubscriber(chatId, { watchlist: [...WATCHABLE_TAGS] });
      await ctx.answerCbQuery('✅ Now watching all zones');
    } else if (value === '__none') {
      await updateSubscriber(chatId, { watchlist: [] });
      await ctx.answerCbQuery('🗑 Cleared all watches');
    } else {
      const tag = value as ConflictTag;
      const isOn = sub.watchlist.includes(tag);
      await updateSubscriber(chatId, {
        watchlist: isOn
          ? sub.watchlist.filter(t => t !== tag)
          : [...sub.watchlist, tag],
      });
      await ctx.answerCbQuery(isOn ? `○ Removed ${tag}` : `✅ Added ${tag}`);
    }

    const updated = await getSubscriber(chatId);
    if (updated) {
      try {
        await ctx.editMessageReplyMarkup(buildWatchKeyboard(updated.watchlist).reply_markup);
      } catch {}
    }
  });

  // Alert threshold
  bot.action(/^threshold:(\d+\.?\d*)$/, async ctx => {
    const t = parseFloat(ctx.match[1]);
    await updateSubscriber(ctx.from.id, { alertThreshold: t });
    await ctx.answerCbQuery(`✅ Threshold set to ${t.toFixed(1)}`);
    await ctx.editMessageText(
      `✅ Alert threshold updated: <b>${t.toFixed(1)}/10</b>\n\nYou'll only receive alerts for articles scoring at or above this level.`,
      { parse_mode: 'HTML' },
    );
  });

  // Source toggle
  bot.action(/^source:(.+)$/, async ctx => {
    const value = ctx.match[1];
    const chatId = ctx.from.id;
    const sub = await resolveSub(chatId, ctx.from.username, ctx.from.first_name);
    const enabled = sub.enabledSources.length === 0 ? [...ALL_SOURCES] : [...sub.enabledSources];

    if (value === '__all') {
      await updateSubscriber(chatId, { enabledSources: [] });
      await ctx.answerCbQuery('✅ All sources enabled');
      await ctx.editMessageText('✅ All news sources enabled.', { parse_mode: 'HTML' });
    } else if (value === '__save') {
      await ctx.answerCbQuery('✅ Saved');
      await ctx.editMessageText('✅ Source preferences saved.', { parse_mode: 'HTML' });
    } else {
      const toggled = enabled.includes(value)
        ? enabled.filter(s => s !== value)
        : [...enabled, value];
      await updateSubscriber(chatId, {
        enabledSources: toggled.length === ALL_SOURCES.length ? [] : toggled,
      });
      await ctx.answerCbQuery(enabled.includes(value) ? `○ Disabled ${value}` : `✅ Enabled ${value}`);
    }
  });

  // Profile switch
  bot.action(/^profile:(analyst|summary)$/, async ctx => {
    const profile = ctx.match[1] as 'analyst' | 'summary';
    await updateSubscriber(ctx.from.id, { profile });
    await ctx.answerCbQuery(`✅ Profile set to ${profile}`);
    await ctx.editMessageText(
      `✅ Report profile updated to <b>${profile.toUpperCase()}</b>.`,
      { parse_mode: 'HTML' },
    );
  });

  // ── Inline Mode ────────────────────────────────────────────────────
  bot.on('inline_query', async ctx => {
    const query = ctx.inlineQuery.query.trim();
    try {
      const articles = await fetchArticles(query || undefined);
      const top = articles
        .sort((a, b) => b.escalationScore - a.escalationScore)
        .slice(0, 8);

      const results: InlineQueryResult[] = top.map((a, i) => ({
        type: 'article' as const,
        id: String(i),
        title: `${a.escalationScore >= 9 ? '🔴' : a.escalationScore >= 7.5 ? '🟠' : a.escalationScore >= 6 ? '🟡' : '🟢'} ${a.title}`,
        description: `${a.source} · ${a.region} · ${a.escalationScore.toFixed(1)}/10`,
        url: a.link,
        input_message_content: {
          message_text:
            `<b>${h(a.title)}</b>\n\n${h(a.description)}\n\n<i>${h(a.source)} · ${h(a.region)}</i>\n<a href="${h(a.link)}">→ Read more</a>`,
          parse_mode: 'HTML' as const,
          link_preview_options: LINK_PREVIEW_OFF,
        },
      }));

      await ctx.answerInlineQuery(results, { cache_time: 120 });
    } catch {
      await ctx.answerInlineQuery([]);
    }
  });

  // ── Handle blocked users gracefully ───────────────────────────────
  bot.catch((err: any, ctx) => {
    if (err?.response?.error_code === 403) {
      if (ctx.from?.id) removeSubscriber(ctx.from.id); // fire-and-forget
    } else {
      console.error(`[bot] Error for ${ctx.updateType}:`, err);
    }
  });

  return bot;
}

// ── Alert Broadcasting ─────────────────────────────────────────────────

export async function broadcastAlerts(bot: Telegraf): Promise<void> {
  try {
    const [articles, subscribers] = await Promise.all([
      fetchArticles(),
      getAllSubscribers(),
    ]);
    const watchers = subscribers.filter(s => s.watchlist.length > 0);
    if (watchers.length === 0) return;

    for (const article of articles) {
      const key = articleAlertKey(article);
      if (await hasAlertBeenSent(key)) continue;

      const targets = watchers.filter(
        s =>
          article.escalationScore >= s.alertThreshold &&
          article.tags.some(t => s.watchlist.includes(t as ConflictTag)) &&
          (s.enabledSources.length === 0 || s.enabledSources.includes(article.source)),
      );

      if (targets.length === 0) continue;
      await markAlertSent(key);

      for (const sub of targets) {
        try {
          await bot.telegram.sendMessage(sub.chatId, formatAlert(article), HTML_OPTS);
        } catch (err: any) {
          if (err?.response?.error_code === 403) await removeSubscriber(sub.chatId);
          else console.error(`[alerts] Failed to notify ${sub.chatId}:`, err?.message);
        }
      }
    }
  } catch (err) {
    console.error('[alerts] Broadcast failed:', err);
  }
}

// ── Scheduled Briefings ────────────────────────────────────────────────

export async function sendScheduledBriefings(bot: Telegraf): Promise<void> {
  const now = new Date();
  const currentTime = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;

  const all = await getAllSubscribers();
  const targets = all.filter(s => s.briefingTime === currentTime);
  if (targets.length === 0) return;

  let text: string;
  try {
    const articles = await fetchArticles();
    const digest = await fetchAIDigest(articles);
    text = formatBriefing(digest);
  } catch {
    try {
      text = formatTopStories(await fetchArticles(), 5);
    } catch {
      return;
    }
  }

  for (const sub of targets) {
    try {
      await bot.telegram.sendMessage(sub.chatId, text, HTML_OPTS);
    } catch (err: any) {
      if (err?.response?.error_code === 403) await removeSubscriber(sub.chatId);
      else console.error(`[briefings] Failed to send to ${sub.chatId}:`, err?.message);
    }
  }
}
