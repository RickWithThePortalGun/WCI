'use client';

import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Globe, Radio, Play, BarChart3, Github } from 'lucide-react';
import useSWR from 'swr';

export type TabId = 'dashboard' | 'globe' | 'news' | 'videos' | 'analysis';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  articleCount: number;
  lastUpdated: string;
}

const TABS: { id: TabId; label: string; icon: React.ReactNode; mobileIcon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'DASHBOARD', icon: <LayoutDashboard size={14} />, mobileIcon: <LayoutDashboard size={18} /> },
  { id: 'globe', label: 'GLOBE', icon: <Globe size={14} />, mobileIcon: <Globe size={18} /> },
  { id: 'news', label: 'INTELLIGENCE', icon: <Radio size={14} />, mobileIcon: <Radio size={18} /> },
  { id: 'videos', label: 'VIDEO INTEL', icon: <Play size={14} />, mobileIcon: <Play size={18} /> },
  { id: 'analysis', label: 'ANALYSIS', icon: <BarChart3 size={14} />, mobileIcon: <BarChart3 size={18} /> },
];

export default function Header({ activeTab, onTabChange, articleCount, lastUpdated }: Props) {
  const [time, setTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const sessionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    setMounted(true);
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Track active visitors
  const { data: visitorData } = useSWR<{ count: number }>(
    `/api/visitors?sessionId=${sessionIdRef.current}`,
    (url) => fetch(url).then(r => r.json()),
    { refreshInterval: 5000 } // Update every 5 seconds
  );

  const activeAgents = visitorData?.count || 0;

  const timeStr = time ? time.toISOString().slice(11, 19) : '--:--:--';
  const dateStr = time ? time.toUTCString().slice(0, 16) : '';

  return (
    <header className="border-b border-[#1a3a1a] bg-[#030805] flex-shrink-0">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-2 sm:py-3 border-b border-[#1a3a1a] gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#ff2200] pulse-dot" />
              <span className="font-mono text-[9px] text-[#ff4400] tracking-widest">LIVE</span>
            </div>

            <div className="h-4 w-px bg-[#1a3a1a]" />

            <div className="font-display text-lg sm:text-2xl tracking-[2px] sm:tracking-[6px] text-[#ff4400]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              <span className="hidden sm:inline">WORLD CONFLICT INTEL</span>
              <span className="sm:hidden">WCI</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#ff220015] border border-[#ff220033] rounded text-[8px] font-mono text-[#ff6644] tracking-widest">
              CLASSIFIED
            </span>
            <span className="px-2 py-0.5 bg-[#44ff8815] border border-[#44ff8833] rounded text-[8px] font-mono text-[#44ff88]">
              {activeAgents} AGENTS ONLINE
            </span>
            <span className="px-2 py-0.5 bg-[#44aaff15] border border-[#44aaff33] rounded text-[8px] font-mono text-[#66bbff]">
              {articleCount} ARTICLES LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6 font-mono text-[10px] w-full sm:w-auto justify-between sm:justify-end">
          {/* Mobile icon buttons - top right */}
          <div className="sm:hidden flex items-center gap-2">
            {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME && (
              <a
                href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME}?start=web`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#040c05] border border-[#1a3a1a] hover:border-[#229ED9] hover:bg-[#0a1520] transition-all"
                title="Open Telegram Bot"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" className="text-[#3a6a4a] hover:text-[#229ED9]">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            )}
            <a
              href="https://github.com/RickWithThePortalGun/WCI"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#040c05] border border-[#1a3a1a] hover:border-[#2a5a3a] hover:bg-[#060f07] transition-all"
              title="View on GitHub"
            >
              <Github size={16} className="text-[#3a6a4a] hover:text-[#44aaff]" />
            </a>
          </div>

          <div className="text-[#2a4a2a] hidden lg:block">{dateStr}</div>
          <div className="text-[#ff8844] text-xs sm:text-sm tracking-widest font-bold">{timeStr} UTC</div>
          <div className="hidden md:flex items-center gap-2 text-[9px] text-[#2a4a2a]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#44ff88]" />
            ALL SYSTEMS NOMINAL
          </div>
        </div>
      </div>

      {/* Tab navigation - Desktop */}
      <div className="hidden sm:flex items-center px-3 sm:px-6 bg-[#040c05] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 font-mono text-[9px] sm:text-[10px] tracking-widest border-b-2 transition-all duration-150 flex-shrink-0
              ${activeTab === tab.id
                ? 'border-[#ff4400] text-[#ff6633] bg-[#ff440011]'
                : 'border-transparent text-[#3a6a4a] hover:text-[#5a8a6a] hover:bg-[#060f07]'
              }
            `}
          >
            <span className="flex-shrink-0">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}

        <div className="ml-auto text-[8px] sm:text-[9px] font-mono text-[#2a4a2a] pr-2 flex-shrink-0">
          <span className="hidden md:inline">{lastUpdated ? `FETCHED ${new Date(lastUpdated).toLocaleTimeString()}` : 'FETCHING DATA...'}</span>
          <span className="md:hidden">{lastUpdated ? 'UPDATED' : 'FETCHING...'}</span>
        </div>
      </div>

      {/* Floating bottom tab bar - Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pointer-events-none">
        <div className="bg-[#040c05]/95 border border-[#1a3a1a] rounded-3xl shadow-2xl shadow-black/60 backdrop-blur-md pointer-events-auto">
          <div className="flex items-center justify-around px-1 py-2.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-2xl transition-all duration-300 ease-out flex-1 min-w-0
                  ${activeTab === tab.id
                    ? 'text-[#ff6633]'
                    : 'text-[#3a6a4a] active:scale-95 active:bg-[#060f07]'
                  }
                `}
              >
                {/* Active indicator background */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-[#ff440015] rounded-2xl animate-pulse-slow" />
                )}
                
                {/* Icon */}
                <span className={`
                  relative z-10 transition-all duration-300
                  ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_4px_rgba(255,102,51,0.5)]' : 'scale-100'}
                `}>
                  {tab.mobileIcon}
                </span>
                
                {/* Label */}
                <span className={`
                  relative z-10 font-mono text-[9px] tracking-wider transition-all duration-300 truncate w-full text-center leading-tight
                  ${activeTab === tab.id ? 'font-bold opacity-100' : 'opacity-70'}
                `}>
                  {tab.label.split(' ')[0]}
                </span>

                {/* Active dot indicator */}
                {activeTab === tab.id && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#ff4400] shadow-[0_0_4px_rgba(255,68,0,0.8)] animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
