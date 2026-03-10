'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import type { NewsArticle, YTVideo, ConflictZone } from '@/lib/types';
import type { TabId } from './layout/Header';
import Header from './layout/Header';
import AlertTicker from './widgets/AlertTicker';
import StatsBar from './widgets/StatsBar';
import RiskMeter from './widgets/RiskMeter';
import EscalationChart from './charts/EscalationChart';
import NewsFeed from './news/NewsFeed';
import VideoPanel from './media/VideoPanel';
import AIDigest from './widgets/AIDigest';
import ConflictTimeline from './widgets/ConflictTimeline';
import SourceTriangulation from './widgets/SourceTriangulation';
import FlashpointPredictor from './widgets/FlashpointPredictor';
import MilitaryBalance from './widgets/MilitaryBalance';
import { getZoneMilitaryData, TIER_COLORS, TIER_LABELS } from '@/lib/military-power';
import BackgroundMusic from './widgets/BackgroundMusic';
import { Loader2, Github, Shield } from 'lucide-react';

function ZoneMilitaryPanel({ zone }: { zone: ConflictZone }) {
  const powers = getZoneMilitaryData(zone.factions ?? [], zone.relatedCountries ?? []);
  const top = powers[0];

  if (powers.length === 0) {
    return (
      <div className="p-4 text-center text-[10px] font-mono text-[#334433]">
        NO MILITARY DATA FOR THIS ZONE
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="text-[9px] font-mono text-[#44aa66] tracking-widest mb-3">
        ◈ COMBATANT ANALYSIS — {zone.name.toUpperCase()}
      </div>

      {/* Pairwise comparison bars */}
      <div className="space-y-3">
        {powers.map((mp, i) => {
          const color = TIER_COLORS[mp.tier];
          const relStrength = top ? Math.max(5, (1 - mp.pwrIndex / 1.5) / (1 - top.pwrIndex / 1.5) * 100) : 50;

          return (
            <div key={mp.countryCode} className="border border-[#1a3320] rounded p-2 bg-[#040e06]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getFlagEmojiDash(mp.countryCode)}</span>
                  <span className="text-[11px] font-mono" style={{ color }}>
                    {mp.country.toUpperCase()}
                  </span>
                  {mp.nuclearWarheads && (
                    <span className="text-[9px] text-[#ff4400]">☢ NUCLEAR</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-[#334433]">
                  GFP #{mp.rank} · {TIER_LABELS[mp.tier]}
                </span>
              </div>
              {/* Relative power bar */}
              <div className="h-1.5 bg-[#0a1a10] rounded-sm overflow-hidden mb-2">
                <div
                  className="h-full rounded-sm transition-all"
                  style={{ width: `${relStrength}%`, backgroundColor: color }}
                />
              </div>
              {/* Key stats row */}
              <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-[#445544]">
                <div>
                  <div className="text-[#c8e6c8]">{(mp.activeTroops).toFixed(0)}k</div>
                  <div>TROOPS</div>
                </div>
                <div>
                  <div className="text-[#c8e6c8]">{mp.tanks.toLocaleString()}</div>
                  <div>TANKS</div>
                </div>
                <div>
                  <div className="text-[#c8e6c8]">{mp.aircraft.toLocaleString()}</div>
                  <div>AIRCRAFT</div>
                </div>
                <div>
                  <div className="text-[#c8e6c8]">${mp.defenseBudgetB >= 1 ? mp.defenseBudgetB.toFixed(0) + 'B' : (mp.defenseBudgetB * 1000).toFixed(0) + 'M'}</div>
                  <div>BUDGET</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {powers.length >= 2 && (
        <div className="mt-3 p-2 border border-[#1a3320] rounded bg-[#060e07] text-[9px] font-mono text-[#334433]">
          POWER RATIO:{' '}
          <span className="text-[#ffcc00]">
            {powers[0].country} vs {powers[1].country} ={' '}
            {(powers[1].pwrIndex / powers[0].pwrIndex).toFixed(2)}x advantage
          </span>
          {' '}(lower PwrIndx = stronger)
        </div>
      )}
    </div>
  );
}

function getFlagEmojiDash(code: string): string {
  const flags: Record<string, string> = {
    US: '🇺🇸', RU: '🇷🇺', CN: '🇨🇳', IN: '🇮🇳', KR: '🇰🇷',
    GB: '🇬🇧', JP: '🇯🇵', FR: '🇫🇷', TR: '🇹🇷', DE: '🇩🇪',
    PK: '🇵🇰', IL: '🇮🇱', EG: '🇪🇬', IR: '🇮🇷', SA: '🇸🇦',
    AU: '🇦🇺', PL: '🇵🇱', UA: '🇺🇦', KP: '🇰🇵', TW: '🇹🇼',
    AE: '🇦🇪', ET: '🇪🇹', JO: '🇯🇴', LB: '🇱🇧', SY: '🇸🇾',
    SD: '🇸🇩', RW: '🇷🇼', BY: '🇧🇾', QA: '🇶🇦', PH: '🇵🇭',
    TD: '🇹🇩', SO: '🇸🇴', MM: '🇲🇲', AO: '🇦🇴', NE: '🇳🇪',
    ER: '🇪🇷', UG: '🇺🇬', IQ: '🇮🇶', TH: '🇹🇭', EE: '🇪🇪', NT: '🛡️',
  };
  return flags[code] ?? '🏳';
}

const ConflictGlobe = dynamic(() => import('./globe/ConflictGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030805]">
      <div className="font-mono text-[#3a6a4a] text-sm animate-pulse tracking-widest flex items-center gap-2">
        <Loader2 size={16} className="animate-spin" />
        LOADING GLOBE...
      </div>
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedZone, setSelectedZone] = useState<ConflictZone | null>(null);

  const { data: newsData, isLoading: newsLoading } = useSWR<{
    articles: NewsArticle[];
    fetchedAt: string;
    totalCount: number;
  }>('/api/news', fetcher, { refreshInterval: 120_000 }); // refresh every 2min

  const { data: ytData, isLoading: ytLoading } = useSWR<{
    videos: YTVideo[];
    fetchedAt: string;
  }>('/api/youtube', fetcher, { refreshInterval: 300_000 }); // refresh every 5min

  const { data: gdeltData } = useSWR<{
    articles: NewsArticle[];
    fetchedAt: string;
  }>('/api/gdelt', fetcher, { refreshInterval: 120_000 });

  // Merge RSS + GDELT articles, deduplicate by title prefix
  const articles = useMemo(() => {
    const base = newsData?.articles ?? [];
    const gdelt = gdeltData?.articles ?? [];
    const seen = new Set(base.map(a => a.title.slice(0, 40).toLowerCase().replace(/\W/g, '')));
    const fresh = gdelt.filter(a => {
      const key = a.title.slice(0, 40).toLowerCase().replace(/\W/g, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...base, ...fresh].sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }, [newsData?.articles, gdeltData?.articles]);

  const videos = ytData?.videos ?? [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#030805]">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        articleCount={articles.length}
        lastUpdated={newsData?.fetchedAt ?? ''}
      />

      {/* Breaking news ticker */}
      {articles.length > 0 && <AlertTicker articles={articles} />}

      {/* KPI stats bar */}
      {activeTab !== 'globe' && <StatsBar articles={articles} />}

      {/* Main content with bottom padding for mobile floating tab */}
      <div
        className={`flex-1 overflow-y-auto sm:pb-0 ${
          activeTab === 'dashboard' || activeTab === 'globe' ? 'pb-20' : 'pb-6'
        }`}
      >
        {/* ── DASHBOARD TAB  */}
        {activeTab === 'dashboard' && (
          <div className="min-h-full overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-[#1a3a1a] lg:h-full">

          {/* Left: Globe + Risk */}
          <div className="lg:col-span-4 flex flex-col divide-y divide-[#1a3a1a] overflow-hidden">
            <div className="flex-1 overflow-hidden min-h-[280px] lg:min-h-0">
              <button
                className="panel-header w-full text-left hover:bg-[#0a1a0c] transition-colors group"
                onClick={() => setActiveTab('globe')}
                title="Open full-screen globe"
              >
                <span>THREAT GLOBE</span>
                <span className="text-[8px] font-mono text-[#2a4a2a] group-hover:text-[#44aa66] transition-colors tracking-wider">
                  EXPAND ↗
                </span>
              </button>
              <div style={{ height: 'calc(100% - 37px)' }}>
                <ConflictGlobe onSelectZone={setSelectedZone} selectedZone={selectedZone} />
              </div>
            </div>
            <div className="h-[260px] lg:h-auto lg:flex-1 overflow-hidden">
              <RiskMeter articles={articles} />
            </div>
          </div>

          {/* Center: News + Chart */}
          <div className="lg:col-span-5 flex flex-col divide-y divide-[#1a3a1a] overflow-hidden">
            <div className="h-[160px] lg:h-auto lg:flex-shrink-0 overflow-hidden" style={{ minHeight: 160 }}>
              <div className="panel-header">
                <span>ESCALATION INDEX — 24H</span>
                <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">RSS-DERIVED SCORING</span>
              </div>
              <div style={{ height: 'calc(100% - 37px)' }}>
                <EscalationChart articles={articles} />
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-[200px] sm:min-h-[300px]">
              <div className="panel-header flex-shrink-0">
                <span className="text-[9px] sm:text-[10px]">LIVE INTELLIGENCE FEED</span>
                <span className="text-[#44aaff] text-[8px] sm:text-[9px]">{articles.length} ARTICLES</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 sm:p-3">
                <NewsFeed articles={articles} loading={newsLoading} compact maxItems={30} />
              </div>
            </div>
          </div>

          {/* Right: AI Digest + Videos */}
          <div className="lg:col-span-3 flex flex-col divide-y divide-[#1a3a1a] overflow-hidden min-h-[calc(100vh-480px)] sm:min-h-[calc(100vh-420px)] lg:min-h-0 lg:h-auto">
            <div className="overflow-hidden h-[320px] lg:h-auto lg:flex-1 flex-shrink-0">
              <AIDigest articles={articles} />
            </div>
            <div className="flex-1 overflow-hidden flex flex-col min-h-[200px] lg:min-h-0">
              <div className="panel-header flex-shrink-0">
                <span>VIDEO INTEL</span>
                <span className="text-[#3a6a4a] text-[8px]">{videos.length} CLIPS</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <div className="grid grid-cols-1 gap-2">
                  {videos.slice(0, 6).map(v => (
                    <a
                      key={v.id}
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-2 p-2 border border-[#1a3a1a] rounded hover:border-[#2a5a3a] hover:bg-[#0a1a0c] transition-all group"
                    >
                      <img src={v.thumbnail} alt="" className="w-20 h-12 object-cover rounded opacity-70 group-hover:opacity-90 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] text-[#7a9a7a] group-hover:text-[#aaccaa] leading-tight line-clamp-2">{v.title}</div>
                        <div className="text-[8px] font-mono text-[#3a6a4a] mt-1">{v.channelName.slice(0, 14)}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ── GLOBE TAB */}
        {activeTab === 'globe' && (
          <div className="relative lg:h-full lg:overflow-hidden">
            <ConflictGlobe onSelectZone={setSelectedZone} selectedZone={selectedZone} />
          </div>
        )}

        {/* ── INTELLIGENCE TAB */}
        {activeTab === 'news' && (
          <div className="p-4 lg:h-full lg:overflow-hidden">
            <NewsFeed articles={articles} loading={newsLoading} />
          </div>
        )}

        {/* ── VIDEOS TAB  */}
        {activeTab === 'videos' && (
          <div className="p-4 lg:h-full lg:overflow-hidden">
            <VideoPanel videos={videos} loading={ytLoading} />
          </div>
        )}

        {/* ── MILITARY TAB  */}
        {activeTab === 'military' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:divide-x divide-[#1a3a1a] lg:h-full lg:overflow-hidden">
            {/* Left: full ranking table */}
            <div className="lg:col-span-7 flex flex-col overflow-hidden">
              <div className="panel-header flex-shrink-0">
                <span>GLOBAL MILITARY POWER INDEX</span>
                <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">
                  GFP 2025 · CLICK ROW FOR DETAILS
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <MilitaryBalance
                  highlightCountries={
                    selectedZone
                      ? [...(selectedZone.factions ?? []), ...(selectedZone.relatedCountries ?? [])]
                      : []
                  }
                />
              </div>
            </div>

            {/* Right: zone-context panel */}
            <div className="lg:col-span-5 flex flex-col divide-y divide-[#1a3a1a] overflow-hidden">
              {/* Active zone combatant breakdown */}
              <div className="flex-1 overflow-y-auto">
                {selectedZone ? (
                  <ZoneMilitaryPanel zone={selectedZone} />
                ) : (
                  <div className="p-6 text-center">
                    <Shield size={32} className="text-[#1a3a1a] mx-auto mb-3" />
                    <p className="text-[10px] font-mono text-[#334433] tracking-wider">
                      SELECT A CONFLICT ZONE ON THE GLOBE OR DASHBOARD<br />
                      TO SEE COMBATANT MILITARY COMPARISON
                    </p>
                  </div>
                )}
              </div>
              {/* Tier legend */}
              <div className="p-3 flex-shrink-0">
                <div className="text-[9px] font-mono text-[#334433] mb-2 tracking-wider">POWER TIERS</div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['superpower', '#ff2200', 'Nuclear hegemon, global force projection'],
                    ['major',      '#ff8800', 'Regional dominance, significant force'],
                    ['regional',   '#ffcc00', 'Capable within theater of operations'],
                    ['limited',    '#44aa66', 'Constrained capacity, local operations'],
                  ] as const).map(([tier, color, desc]) => (
                    <div key={tier} className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-sm mt-0.5 flex-shrink-0" style={{ backgroundColor: color }} />
                      <div>
                        <div className="text-[9px] font-mono" style={{ color }}>{tier.toUpperCase()}</div>
                        <div className="text-[8px] font-mono text-[#334433] leading-tight">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[8px] font-mono text-[#1a3a1a]">
                  SOURCE: GLOBALFIREPOWER.COM · SIPRI · FAS NUCLEAR NOTEBOOK 2025<br />
                  PwrIndx: 0.0000 = PERFECT SCORE (THEORETICAL)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYSIS TAB  */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-x-0 lg:divide-x divide-[#1a3a1a] lg:h-full lg:overflow-hidden">

          {/* Timeline */}
          <div className="lg:col-span-4 flex flex-col overflow-hidden border-r-0 lg:border-r border-[#1a3a1a]">
            <div className="panel-header flex-shrink-0">
              <span>CONFLICT TIMELINE</span>
              <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">CHRONOLOGICAL VIEW</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConflictTimeline articles={articles} />
            </div>
          </div>

          {/* Source triangulation */}
          <div className="lg:col-span-3 flex flex-col overflow-hidden border-r-0 lg:border-r border-[#1a3a1a]">
            <div className="panel-header flex-shrink-0">
              <span>SOURCE TRIANGULATION</span>
              <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">MULTI-OUTLET ANALYSIS</span>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <SourceTriangulation articles={articles} />
            </div>
          </div>

          {/* Flashpoint Predictor */}
          <div className="lg:col-span-2 overflow-hidden border-r-0 lg:border-r border-[#1a3a1a]">
            <FlashpointPredictor articles={articles} />
          </div>

          {/* AI Digest */}
          <div className="lg:col-span-3 overflow-hidden">
            <AIDigest articles={articles} />
          </div>
        </div>
        )}
      </div>

      {/* Background Music Player */}
      <BackgroundMusic />

      {/* Footer */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-2 border-t border-[#1a3a1a] bg-[#040c05] gap-2 sm:gap-0">
        <div className="font-mono text-[8px] text-[#1a3a1a] tracking-widest">
          DATA: BBC · AL JAZEERA · REUTERS · GUARDIAN · DW · RFI · ISW · BELLINGCAT · UN NEWS · GDELT · GFP | OPEN SOURCE INTELLIGENCE
        </div>
        <div className="flex items-center gap-3">
          {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
            <a
              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=web`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 font-mono text-[8px] text-[#3a6a4a] hover:text-[#229ED9] transition-colors"
              title="Open Telegram Bot"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>TELEGRAM BOT</span>
            </a>
          )}
          <a
            href="https://github.com/RickWithThePortalGun/WCI"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 font-mono text-[8px] text-[#3a6a4a] hover:text-[#44aaff] transition-colors"
            title="View on GitHub"
          >
            <Github size={12} />
            <span>VIEW REPO</span>
          </a>
          <div className="font-mono text-[8px] text-[#1a3a1a]">
            ALL SOURCES ARE PUBLIC. FOR INFORMATIONAL PURPOSES ONLY. WCI © 2026
          </div>
        </div>
      </div>
    </div>
  );
}
