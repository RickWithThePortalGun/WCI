'use client';

import { useMemo } from 'react';
import type { NewsArticle } from '@/lib/types';
import { REGION_COLORS } from '@/lib/constants';

interface Props {
  articles: NewsArticle[];
}

export default function RiskMeter({ articles }: Props) {
  const regional = useMemo(() => {
    const map: Record<string, { total: number; count: number; maxTitle: string; maxScore: number }> = {};
    for (const a of articles) {
      if (!map[a.region]) map[a.region] = { total: 0, count: 0, maxTitle: '', maxScore: 0 };
      map[a.region].total += a.escalationScore;
      map[a.region].count += 1;
      if (a.escalationScore > map[a.region].maxScore) {
        map[a.region].maxScore = a.escalationScore;
        map[a.region].maxTitle = a.title;
      }
    }
    return Object.entries(map)
      .map(([region, d]) => ({
        region,
        score: parseFloat((d.total / d.count).toFixed(1)),
        count: d.count,
        maxTitle: d.maxTitle,
        color: REGION_COLORS[region] ?? '#888',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [articles]);

  const globalIndex = regional.length
    ? parseFloat((regional.reduce((s, r) => s + r.score, 0) / regional.length).toFixed(1))
    : 0;

  const globalColor = globalIndex >= 7 ? '#ff0000' : globalIndex >= 5 ? '#ff8800' : '#ffcc00';
  const globalLabel = globalIndex >= 7.5 ? 'CRITICAL' : globalIndex >= 5.5 ? 'ELEVATED' : 'MODERATE';

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>REGIONAL RISK MATRIX</span>
        <span style={{ color: globalColor }} className="font-bold">{globalLabel}</span>
      </div>

      {/* Global index arc */}
      <div className="flex items-center justify-center py-4 border-b border-[#1a3a1a]">
        <div className="relative flex items-center justify-center">
          <svg width="120" height="66" viewBox="0 0 120 66">
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1a3a1a" strokeWidth="8" strokeLinecap="round" />
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={globalColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(globalIndex / 10) * 157} 157`}
              style={{ filter: `drop-shadow(0 0 4px ${globalColor})` }}
            />
          </svg>
          <div className="absolute bottom-0 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color: globalColor }}>{globalIndex}</div>
            <div className="font-mono text-[8px] text-[#3a6a4a] tracking-widest">GLOBAL ESC.</div>
          </div>
        </div>
      </div>

      {/* Regional bars */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {regional.map(r => (
          <div key={r.region} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-[#5a8a6a]">{r.region}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#3a6a4a]">{r.count} articles</span>
                <span className="font-mono text-[11px] font-bold" style={{ color: r.color }}>{r.score}</span>
              </div>
            </div>
            <div className="h-1.5 bg-[#0a1a0c] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(r.score / 10) * 100}%`, background: r.color, boxShadow: `0 0 4px ${r.color}88` }}
              />
            </div>
            <div className="hidden group-hover:block text-[9px] text-[#3a5a3a] mt-0.5 truncate">{r.maxTitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
