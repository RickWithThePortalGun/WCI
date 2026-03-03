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
| **AI-Powered Escalation Index** | GPT-4o-mini scoring with 24h caching + rule-based fallback |
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
│   ├── escalation-score/route.ts → AI-powered escalation scoring with caching
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
**AI-Powered with Smart Caching**

The system uses GPT-4o-mini for context-aware escalation scoring, with intelligent caching to ensure speed and cost-efficiency:

1. **Cache Check**: Articles are hashed by content. If scored within 24 hours, cached score is returned instantly (no API call)
2. **AI Scoring**: New articles are analyzed by GPT-4o-mini, which considers:
   - Context and nuance (not just keywords)
   - Severity levels: 0-2 (peaceful), 3-4 (tensions), 5-6 (active conflict), 7-8 (major operations), 9-10 (nuclear/genocide/full war)
   - Article title vs description importance
3. **Rule-Based Fallback**: If AI is unavailable or fails, uses enhanced rule-based scoring:
   - **Critical phrases**: `nuclear war`, `genocide`, `mass casualty` (+2.5 in title, +1.0 in desc)
   - **High keywords**: `nuclear, missile, bomb, killed, attack, war, invasion` (frequency-based, title weighted 2x)
   - **Medium keywords**: `tension, military, clash, conflict, sanction` (frequency-based)
   - **De-escalation words**: `diplomatic, talks, negotiation` (-0.3 each)
   - **Sentiment integration**: Negative sentiment amplifies, positive reduces
   - **Compound bonus**: Multiple high-severity indicators increase score
4. **Performance**: Cached articles return instantly; new articles ~200-500ms per article

### Sentiment Analysis
Simple lexicon-based scoring from -1 (very negative) to +1 (very positive):
- Negative words: attack, bomb, death, collapse, massacre, siege...
- Positive words: ceasefire, peace, agreement, diplomatic, cooperation...

### Source Triangulation
Articles grouped by topic using keyword matching → cross-referenced with editorial bias labels for media perspective analysis.

---

## Optional: AI Features

Add `OPENAI_API_KEY=sk-...` to `.env.local` to enable AI-powered features:

### AI Escalation Scoring
- Uses GPT-4o-mini for context-aware conflict severity analysis
- **24-hour caching**: Once an article is scored, it's cached for 24 hours (no repeated API calls)
- **Smart fallback**: If AI fails or API key is missing, uses enhanced rule-based scoring
- **Cost-effective**: ~$0.15 per 1M tokens (very cheap for scoring)
- **Fast**: Cached articles return instantly; new articles processed in parallel

### AI Intelligence Briefings
Sends the top 15 high-escalation headlines to OpenAI and returns:
- Situation overview paragraph
- 3-5 key event bullets
- Single-sentence risk assessment

**Note**: The system works perfectly without an API key - it will use rule-based escalation scoring instead.

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
- Improve the AI escalation scoring prompts or rule-based fallback
- Add persistent caching (Redis/database) for multi-instance deployments
- Add new conflict zones or update existing ones
- Enhance the UI/UX
- Fix bugs or improve performance
- Add tests or improve documentation
- Optimize AI scoring batch processing

---

## Disclaimer

All data comes from public, open-source news feeds. This platform is for **informational and educational purposes only**. Content reflects what major international news organizations are reporting. The escalation scores and sentiment analysis are algorithmic estimates, not editorial judgments.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with Next.js 14 · TypeScript · Tailwind CSS · react-globe.gl · Recharts · Framer Motion · rss-parser*
