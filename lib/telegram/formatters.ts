import type { NewsArticle, ConflictZone, AIDigestResponse } from '@/lib/types';

// ── Utilities ──────────────────────────────────────────────────────────

/** Escape characters that have special meaning in Telegram HTML mode. */
export function h(text: string | number): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function utcTimestamp(): string {
  const now = new Date();
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mm = String(now.getUTCMinutes()).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const mo = now.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  return `${dd} ${mo} ${now.getUTCFullYear()} · ${hh}${mm}Z`;
}

function escalationBar(score: number): string {
  const n = Math.max(0, Math.min(10, Math.round(score)));
  return '█'.repeat(n) + '░'.repeat(10 - n);
}

function threatBadge(score: number): string {
  if (score >= 9)   return '🔴 CRITICAL';
  if (score >= 7.5) return '🟠 HIGH';
  if (score >= 6)   return '🟡 ELEVATED';
  if (score >= 4)   return '🟢 MODERATE';
  return '⚪ LOW';
}

function threatEmoji(score: number): string {
  if (score >= 9)   return '🔴';
  if (score >= 7.5) return '🟠';
  if (score >= 6)   return '🟡';
  if (score >= 4)   return '🟢';
  return '⚪';
}

function trendLabel(score: number, baseline = 7): string {
  if (score >= baseline + 1) return '↑ ESCALATING';
  if (score <= baseline - 1) return '↓ DE-ESCALATING';
  return '↔ STABLE';
}

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const HR = '──────────────────────────';

// ── Message Formatters ─────────────────────────────────────────────────

export function formatWelcome(firstName?: string): string {
  const name = firstName ? h(firstName) : 'Operative';
  return `<b>◈ WORLD CONFLICT INTEL</b>
<code>SECURE CHANNEL ESTABLISHED
CLEARANCE: OPEN SOURCE OSINT
${utcTimestamp()}</code>

Welcome, <b>${name}</b>.

Real-time geopolitical intelligence from 7 global sources — RSS-aggregated, AI-scored, delivered to your terminal.

<b>QUICK START</b>
<code>/sitrep   </code>→ All 14 active conflict zones
<code>/flash    </code>→ Breaking high-severity stories
<code>/region   </code>→ Deep-dive on a specific zone
<code>/watch    </code>→ Subscribe to escalation alerts
<code>/brief    </code>→ AI intelligence digest

<i>Type /help for the full command reference.</i>`;
}

export function formatSitrep(zones: ConflictZone[]): string {
  const sorted = [...zones].sort((a, b) => b.severity - a.severity);

  const rows = sorted.map(z => {
    const emoji = threatEmoji(z.severity);
    const trend = trendLabel(z.severity, z.severity); // static zones show STABLE by default
    const cas = z.casualties ? ` · ${h(z.casualties)}` : '';
    return `${emoji} <b>${h(z.severity.toFixed(1))}</b>  <b>${h(z.name)}</b>
     <i>${h(z.type.replace('-', ' '))} · ${h(z.country)}${cas}</i>`;
  }).join('\n\n');

  return `🌍 <b>GLOBAL SITREP</b>
<code>${utcTimestamp()}
${HR}</code>

${rows}

<code>${HR}</code>
<i>/region [zone] for deep-dive · /flash for breaking intel · /compare for matrix view</i>`;
}

export function formatFlash(articles: NewsArticle[]): string {
  const top = articles
    .sort((a, b) => b.escalationScore - a.escalationScore)
    .slice(0, 5);

  if (top.length === 0) {
    return `⚡ <b>FLASH INTEL</b>\n<code>${utcTimestamp()}</code>\n\n<i>No high-severity events at this time.</i>`;
  }

  const items = top.map((a, i) => {
    const tags = a.tags.slice(0, 2).map(t => `<code>#${t}</code>`).join(' ');
    return `<b>${i + 1}. ${h(a.title)}</b>
${threatBadge(a.escalationScore)} · <code>${a.escalationScore.toFixed(1)}/10</code> · <i>${h(a.source)}</i>
${tags ? tags + '  ' : ''}<i>${h(a.region)} · ${relTime(a.pubDate)}</i>
<a href="${h(a.link)}">→ Read full article</a>`;
  }).join('\n\n');

  return `⚡ <b>FLASH INTEL</b>
<code>${utcTimestamp()}
${HR}</code>

${items}

<code>${HR}</code>
<i>/watch to receive auto-alerts · /top for full feed · /region for zone deep-dive</i>`;
}

export function formatTopStories(articles: NewsArticle[], count = 8): string {
  const top = articles
    .sort((a, b) => b.escalationScore - a.escalationScore)
    .slice(0, count);

  const items = top.map((a, i) => {
    const bar = escalationBar(a.escalationScore);
    return `<b>${i + 1}. ${h(a.title)}</b>
<code>${bar} ${a.escalationScore.toFixed(1)}</code>
<i>${h(a.source)} · ${h(a.region)} · ${relTime(a.pubDate)}</i>
<a href="${h(a.link)}">→ Read more</a>`;
  }).join('\n\n');

  return `📡 <b>TOP STORIES</b>
<code>${utcTimestamp()}
${HR}</code>

${items}

<code>${HR}</code>
<i>/flash for breaking intel · /region [zone] for context</i>`;
}

export function formatRegionIntel(zone: ConflictZone, articles: NewsArticle[]): string {
  const bar = escalationBar(zone.severity);
  const badge = threatBadge(zone.severity);
  const factionsStr = zone.factions.map(f => h(f)).join(' <b>vs</b> ');
  const relatedStr = zone.relatedCountries.map(c => h(c)).join(' · ');

  const relevant = articles
    .filter(a => a.tags.includes(zone.tag))
    .sort((a, b) => b.escalationScore - a.escalationScore)
    .slice(0, 5);

  const headlines = relevant.length > 0
    ? relevant.map(a =>
        `• <a href="${h(a.link)}">${h(a.title)}</a>\n  <i>${h(a.source)} · ${relTime(a.pubDate)} · ${a.escalationScore.toFixed(1)}/10</i>`
      ).join('\n\n')
    : '<i>No recent articles found for this zone.</i>';

  const startLine = zone.startDate ? `\n<b>ACTIVE SINCE</b>   ${h(zone.startDate)}` : '';
  const casLine = zone.casualties ? `\n<b>CASUALTIES</b>     ${h(zone.casualties)}` : '';

  return `📍 <b>REGIONAL INTEL: ${h(zone.name.toUpperCase())}</b>
<code>${utcTimestamp()}
${HR}</code>
<b>TYPE</b>           ${h(zone.type.replace('-', ' ').toUpperCase())}
<b>SEVERITY</b>       <code>${bar} ${zone.severity.toFixed(1)}/10</code>
<b>STATUS</b>         ${badge}${startLine}${casLine}

<b>BELLIGERENTS</b>
${factionsStr}

<b>RELATED ACTORS</b>
<i>${relatedStr}</i>

<b>BACKGROUND</b>
${h(zone.description)}

<code>${HR}</code>
<b>CURRENT HEADLINES</b>

${headlines}

<code>${HR}</code>
<i>/watch ${zone.tag} to subscribe · /compare for all zones</i>`;
}

export function formatCompare(zones: ConflictZone[]): string {
  const sorted = [...zones].sort((a, b) => b.severity - a.severity);

  const rows = sorted.map(z => {
    const emoji = threatEmoji(z.severity);
    const bar = escalationBar(z.severity);
    const name = z.name.length > 20 ? z.name.slice(0, 19) + '…' : z.name.padEnd(20);
    return `<code>${emoji} ${h(name)} ${bar} ${z.severity.toFixed(1)}</code>`;
  }).join('\n');

  return `📊 <b>ESCALATION MATRIX</b>
<code>${utcTimestamp()}
${HR}
   CONFLICT ZONE        SEVERITY
${HR}</code>

${rows}

<code>${HR}</code>
<i>/region [zone] for deep-dive · /watch to subscribe to alerts</i>`;
}

export function formatSearchResults(query: string, articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return `🔍 <b>SEARCH: "${h(query)}"</b>\n\n<i>No articles matched that query in the current feed.</i>`;
  }

  const items = articles.slice(0, 6).map(a => {
    const badge = threatBadge(a.escalationScore);
    return `${badge} <code>${a.escalationScore.toFixed(1)}</code>
<b><a href="${h(a.link)}">${h(a.title)}</a></b>
<i>${h(a.source)} · ${h(a.region)} · ${relTime(a.pubDate)}</i>`;
  }).join('\n\n');

  return `🔍 <b>SEARCH: "${h(query)}"</b>
<code>${articles.length} result${articles.length !== 1 ? 's' : ''} · ${utcTimestamp()}
${HR}</code>

${items}`;
}

export function formatAlert(article: NewsArticle): string {
  const badge = threatBadge(article.escalationScore);
  const bar = escalationBar(article.escalationScore);
  const tags = article.tags.slice(0, 3).map(t => `<code>#${t}</code>`).join(' ');
  const desc = article.description
    ? `\n<i>${h(article.description)}</i>\n`
    : '';

  return `🚨 <b>ESCALATION ALERT</b>
<code>${utcTimestamp()}
${HR}</code>

${badge}
<code>${bar} ${article.escalationScore.toFixed(1)}/10</code>

<b>${h(article.title)}</b>
${desc}
<b>SOURCE</b>   ${h(article.source)}
<b>REGION</b>   ${h(article.region)}
<b>TIME</b>     ${relTime(article.pubDate)}
${tags}

<a href="${h(article.link)}">→ Read full article</a>

<code>${HR}</code>
<i>Adjust threshold: /alerts · Manage zones: /watch</i>`;
}

export function formatBriefing(digest: AIDigestResponse): string {
  const events = digest.keyEvents.map(e => `• ${h(e)}`).join('\n');

  return `📋 <b>INTELLIGENCE BRIEFING</b>
<code>${utcTimestamp()}
${HR}</code>

<b>EXECUTIVE SUMMARY</b>
${h(digest.summary)}

<b>KEY DEVELOPMENTS</b>
${events}

<b>RISK ASSESSMENT</b>
<i>${h(digest.riskAssessment)}</i>

<code>${HR}
GENERATED BY AI ANALYSIS
Sources: 7 RSS feeds · Top 15 articles by escalation score</code>

<i>/flash for raw breaking intel · /region [zone] for context</i>`;
}

export function formatWatchMenu(watchlist: string[]): string {
  const status = watchlist.length > 0
    ? watchlist.map(w => `<code>${w}</code>`).join(' ')
    : '<i>none — use buttons below to subscribe</i>';

  return `👁 <b>WATCH CONFIGURATION</b>
<code>${HR}</code>

<b>Currently monitoring:</b>
${status}

Toggle zones on/off with the buttons below. You'll receive a push alert when a watched zone produces an article at or above your escalation threshold.

<i>Threshold: /alerts · Schedule daily digest: /schedule</i>`;
}

export function formatAlertConfig(threshold: number): string {
  const bar = escalationBar(threshold);
  return `⚙️ <b>ALERT THRESHOLD</b>

Current: <code>${bar} ${threshold.toFixed(1)}/10</code>

Only articles at or above this score will trigger a push alert. Select a new level:`;
}

export function formatSchedule(briefingTime: string | null): string {
  const status = briefingTime
    ? `✅ Daily briefing set for <b>${briefingTime} UTC</b>`
    : '○ No daily briefing scheduled';

  return `🗓 <b>BRIEFING SCHEDULE</b>

${status}

Reply with a time in <b>HH:MM</b> format (24h UTC) to set your daily AI digest.
Examples: <code>07:30</code>  <code>12:00</code>  <code>21:00</code>

Send <code>/schedule off</code> to disable.`;
}

export function formatHelp(): string {
  return `📖 <b>COMMAND REFERENCE</b>
<code>${HR}</code>
<b>INTELLIGENCE FEED</b>
<code>/sitrep          </code>Global situation report (all zones)
<code>/flash           </code>Top 5 breaking high-severity stories
<code>/top [n]         </code>Top n stories by escalation score
<code>/compare         </code>Escalation matrix for all conflict zones
<code>/brief           </code>AI-generated intelligence digest

<b>ZONE DEEP-DIVE</b>
<code>/region          </code>Select a conflict zone (interactive)
<code>/region [name]   </code>Direct zone lookup — e.g. /region ukraine

<b>SEARCH</b>
<code>/search [query]  </code>Search current headlines

<b>ALERTS &amp; SUBSCRIPTIONS</b>
<code>/watch           </code>Manage zone watchlist (interactive)
<code>/alerts          </code>Set escalation alert threshold
<code>/schedule [time] </code>Daily briefing time in UTC (HH:MM)
<code>/sources         </code>Toggle which news sources you receive
<code>/profile         </code>Switch between Analyst / Summary mode

<b>INLINE MODE</b>
Type <code>@YourBotUsername</code> in any chat to share intel cards.
<code>${HR}</code>
<i>All timestamps in UTC · Feed refreshes every 2 minutes</i>`;
}

export function formatProfile(profile: 'analyst' | 'summary'): string {
  return `👤 <b>REPORT PROFILE</b>

Current: <b>${profile.toUpperCase()}</b>

• <b>Analyst</b> — Full details: description, source bias, region context, tags
• <b>Summary</b> — Concise: headline and score only

Select below:`;
}

export function formatStats(stats: { totalSubscribers: number; activeWatchers: number; alertsSentToday: number }): string {
  return `📈 <b>BOT STATISTICS</b>
<code>${utcTimestamp()}
${HR}</code>
<b>SUBSCRIBERS</b>     ${stats.totalSubscribers}
<b>ACTIVE WATCHERS</b> ${stats.activeWatchers}
<b>ALERTS TODAY</b>    ${stats.alertsSentToday}
<code>${HR}</code>`;
}
