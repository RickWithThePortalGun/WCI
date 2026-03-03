'use client';

import { useMemo } from 'react';
import type { NewsArticle, ConflictZone } from '@/lib/types';
import { CONFLICT_ZONES } from '@/lib/constants';

interface Props {
  articles: NewsArticle[];
}

export default function StatsBar({ articles }: Props) {
  const stats = useMemo(() => {
    const activeConflicts = CONFLICT_ZONES.filter(z => z.type !== 'tension').length;
    const avgEscalation = articles.length
      ? (articles.reduce((s, a) => s + a.escalationScore, 0) / articles.length).toFixed(1)
      : '0.0';
    const critical = articles.filter(a => a.escalationScore >= 7.5).length;
    const sources = new Set(articles.map(a => a.source)).size;
    const regions = new Set(articles.map(a => a.region)).size;
    const latestTime = articles[0]
      ? new Date(articles[0].pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--:--';
    return { activeConflicts, avgEscalation, critical, sources, regions, latestTime };
  }, [articles]);

  const items = [
    { label: 'ACTIVE CONFLICTS', value: stats.activeConflicts, color: '#ff4400', unit: '' },
    { label: 'ESC. INDEX AVG', value: stats.avgEscalation, color: '#ff8800', unit: '/10' },
    { label: 'HIGH-RISK ARTICLES', value: stats.critical, color: '#ff2200', unit: '' },
    { label: 'LIVE SOURCES', value: stats.sources, color: '#44aaff', unit: '' },
    { label: 'REGIONS TRACKED', value: stats.regions, color: '#44ff88', unit: '' },
    { label: 'LAST UPDATE', value: stats.latestTime, color: '#ffaa00', unit: ' UTC' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border-b border-[#1a3a1a] bg-[#060f07]">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col justify-center px-3 sm:px-4 py-2 sm:py-3 border-r border-[#1a3a1a] last:border-r-0"
        >
          <div className="text-[8px] sm:text-[9px] font-mono tracking-[2px] text-[#3a6a4a] mb-1">{item.label}</div>
          <div className="font-mono text-lg sm:text-xl font-bold leading-none" style={{ color: item.color }}>
            {item.value}
            {item.unit && <span className="text-[9px] sm:text-[10px] font-normal text-[#3a6a4a] ml-0.5">{item.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
