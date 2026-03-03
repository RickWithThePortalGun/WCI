'use client';

import { useState, useCallback } from 'react';
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
import BackgroundMusic from './widgets/BackgroundMusic';
import { Loader2, Github } from 'lucide-react';

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

  const articles = newsData?.articles ?? [];
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
              <div className="panel-header">
                <span>THREAT GLOBE</span>
                <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">CLICK ZONE FOR INTEL</span>
              </div>
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

        {/* ── ANALYSIS TAB  */}
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-x-0 lg:divide-x divide-[#1a3a1a] lg:h-full lg:overflow-hidden">

          {/* Timeline */}
          <div className="lg:col-span-5 flex flex-col overflow-hidden border-r-0 lg:border-r border-[#1a3a1a]">
            <div className="panel-header flex-shrink-0">
              <span>CONFLICT TIMELINE</span>
              <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">CHRONOLOGICAL VIEW</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ConflictTimeline articles={articles} />
            </div>
          </div>

          {/* Source triangulation */}
          <div className="lg:col-span-4 flex flex-col overflow-hidden border-r-0 lg:border-r border-[#1a3a1a]">
            <div className="panel-header flex-shrink-0">
              <span>SOURCE TRIANGULATION</span>
              <span className="text-[8px] text-[#2a4a2a] hidden sm:inline">MULTI-OUTLET ANALYSIS</span>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <SourceTriangulation articles={articles} />
            </div>
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
          DATA: BBC · AL JAZEERA · REUTERS · THE GUARDIAN · DW · FRANCE 24 · RFI | OPEN SOURCE INTELLIGENCE
        </div>
        <div className="flex items-center gap-3">
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
