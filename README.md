# World Conflict Intel

**Real-time geopolitical intelligence dashboard** — a full-stack Next.js application aggregating global conflict news from multiple authoritative sources, with an interactive 3D globe, live escalation analytics, YouTube news integration, and optional AI-powered briefings.

[![GitHub](https://img.shields.io/github/license/RickWithThePortalGun/WCI)](LICENSE)
[![GitHub forks](https://img.shields.io/github/forks/RickWithThePortalGun/WCI?style=social)](https://github.com/RickWithThePortalGun/WCI/fork)
[![GitHub stars](https://img.shields.io/github/stars/RickWithThePortalGun/WCI?style=social)](https://github.com/RickWithThePortalGun/WCI)

> **💡 Want to contribute?** [Fork this repository](https://github.com/RickWithThePortalGun/WCI/fork) and submit a pull request!

---

## Features

| Feature | Description |
|---|---|
| **Live RSS Aggregation** | 7 news sources: BBC, Al Jazeera, Reuters, The Guardian, DW, France 24, RFI |
| **YouTube Integration** | 6 news channels via YouTube RSS feeds (no API key needed) |
| **Interactive 3D Globe** | 14 active conflict zones with severity rings, click for intel |
| **Escalation Index** | Real-time scoring of news content by conflict severity |
| **Source Triangulation** | Same event cross-referenced across multiple outlets + editorial bias |
| **AI Intelligence Brief** | OpenAI-powered synthesis of breaking news (optional API key) |
| **Conflict Timeline** | Chronological event view with expandable detail |
| **Regional Risk Matrix** | Escalation scores by geographic region |
| **Breaking News Ticker** | Auto-scrolling high-severity article feed |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - for AI features)
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY

# 3. Run development server
npm run dev

# Open http://localhost:3000
```

---

## Architecture

```
app/
├── api/
│   ├── news/route.ts        → RSS aggregator (7 sources, proxied for CORS)
│   ├── youtube/route.ts     → YouTube channel RSS feeds
│   └── ai-digest/route.ts  → OpenAI API for intelligence briefings
├── layout.tsx               → Root layout with fonts + meta
└── page.tsx                 → Entry point

components/
├── Dashboard.tsx            → Main orchestrator + tab router
├── layout/
│   └── Header.tsx           → Navigation + UTC clock
├── globe/
│   └── ConflictGlobe.tsx    → react-globe.gl 3D visualization
├── charts/
│   └── EscalationChart.tsx  → 24h area chart (Recharts)
├── news/
│   ├── NewsFeed.tsx         → Filter + grid controller
│   └── ArticleCard.tsx      → Individual article component
├── media/
│   └── VideoPanel.tsx       → YouTube grid + inline embed
└── widgets/
    ├── AlertTicker.tsx      → Breaking news scroll
    ├── StatsBar.tsx         → KPI metrics bar
    ├── RiskMeter.tsx        → Regional risk gauge
    ├── AIDigest.tsx         → OpenAI intelligence briefing
    ├── ConflictTimeline.tsx → Chronological event view
    └── SourceTriangulation.tsx → Multi-source event clusters

lib/
├── types.ts                 → TypeScript interfaces
├── constants.ts             → RSS feeds, YouTube channels, conflict zones
└── utils.ts                 → Sentiment analysis, tag classification, helpers
```

---

## Data Sources

### News RSS Feeds (auto-refresh every 2 minutes)
- **BBC World News** — `feeds.bbci.co.uk/news/world/rss.xml`
- **Al Jazeera** — `aljazeera.com/xml/rss/all.xml`
- **Reuters World** — `feeds.reuters.com/reuters/worldNews`
- **The Guardian World** — `theguardian.com/world/rss`
- **Deutsche Welle** — `rss.dw.com/xml/rss-en-world`
- **France 24** — `france24.com/en/rss`
- **RFI English** — `rfi.fr/en/rss`

### YouTube Channels (no API key needed)
- BBC News, Al Jazeera English, DW News, France 24, WION, TRT World

---

## Conflict Zones on Globe

14 active conflict zones with severity ratings, faction analysis, and casualty data:
- **CRITICAL (9-10)**: Gaza War, Ukraine-Russia War
- **HIGH (7.5-9)**: Sudan, Lebanon, Iran-Israel Shadow War, Taiwan Strait
- **ELEVATED (6-7.5)**: DRC, Yemen, Sahel, Myanmar, Iran, Korea, Afghanistan

---

## Intelligence Algorithms

### Escalation Score (0-10)
Computed per article from keyword frequency:
- HIGH keywords: `nuclear, missile, killed, attack, explosion, war, invasion` (+1.2 each)
- MED keywords: `tension, military, deploy, clash, conflict, sanction` (+0.5 each)
- Capped at 10

### Sentiment Analysis
Simple lexicon-based scoring from -1 (very negative) to +1 (very positive):
- Negative words: attack, bomb, death, collapse, massacre, siege...
- Positive words: ceasefire, peace, agreement, diplomatic, cooperation...

### Source Triangulation
Articles grouped by topic using keyword matching → cross-referenced with editorial bias labels for media perspective analysis.

---

## Optional: AI Intelligence Briefings

Add `OPENAI_API_KEY=sk-...` to `.env.local` to enable the AI Digest feature. It sends the top 15 high-escalation headlines to OpenAI and returns:
- Situation overview paragraph
- 3-5 key event bullets
- Single-sentence risk assessment

---

## Extending the App

**Add more RSS sources** → `lib/constants.ts` → `RSS_FEEDS` array

**Add conflict zones** → `lib/constants.ts` → `CONFLICT_ZONES` array

**Add YouTube channels** → `lib/constants.ts` → `YT_CHANNELS` array

**Add new conflict tags** → `lib/types.ts` → `ConflictTag` union, then `TAG_KEYWORDS` in constants

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository** — Click the "Fork" button at the top of this page
2. **Create a feature branch** — `git checkout -b feature/amazing-feature`
3. **Make your changes** — Add features, fix bugs, or improve documentation
4. **Commit your changes** — `git commit -m 'Add some amazing feature'`
5. **Push to your fork** — `git push origin feature/amazing-feature`
6. **Open a Pull Request** — We'll review and merge your changes!

### Ideas for Contributions
- Add more news sources or RSS feeds
- Improve the escalation scoring algorithm
- Add new conflict zones or update existing ones
- Enhance the UI/UX
- Fix bugs or improve performance
- Add tests or improve documentation

---

## Disclaimer

All data comes from public, open-source news feeds. This platform is for **informational and educational purposes only**. Content reflects what major international news organizations are reporting. The escalation scores and sentiment analysis are algorithmic estimates, not editorial judgments.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with Next.js 14 · TypeScript · Tailwind CSS · react-globe.gl · Recharts · Framer Motion · rss-parser*
