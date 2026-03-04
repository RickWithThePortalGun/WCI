'use client';

import { useMemo } from 'react';
import type { NewsArticle } from '@/lib/types';
import { REGION_COLORS } from '@/lib/constants';

interface Props {
  articles: NewsArticle[];
}

// ── Scoring weights ─────────────────────────────────────────────────────────
const W_RECENCY  = 0.55; // Time-decayed average   (controllable, reliable)
const W_PEAK     = 0.20; // Highest single article  (outlier / worst-case)
const W_VELOCITY = 0.15; // Trend within current day (escalating vs calming)
const W_COVERAGE = 0.10; // Source breadth           (confidence signal)

const DECAY_HALF_LIFE_H = 12; // Articles 12 h old count 50% as much
const MAX_SOURCES = 7;         // Number of RSS sources in the platform
const SURGE_THRESHOLD = 0.6;   // Quadratic vs simple gap that triggers SURGE badge

/** Exponential recency weight. Returns 1.0 for brand-new, ~0.5 at 12 h, ~0.25 at 24 h. */
function recencyWeight(pubDate: string): number {
  const ageH = (Date.now() - new Date(pubDate).getTime()) / 3_600_000;
  return Math.exp(-(ageH * Math.LN2) / DECAY_HALF_LIFE_H);
}

/** Velocity: average score of last-6h articles minus average of earlier articles.
 *  Falls back to chronological half/half split if all articles are within 6 h. */
function computeVelocity(sorted: NewsArticle[]): number {
  if (sorted.length < 2) return 0;
  const cutoff = Date.now() - 6 * 3_600_000;
  const recent = sorted.filter(a => new Date(a.pubDate).getTime() >= cutoff);
  const older  = sorted.filter(a => new Date(a.pubDate).getTime() <  cutoff);

  if (recent.length > 0 && older.length > 0) {
    const avg = (arr: NewsArticle[]) => arr.reduce((s, a) => s + a.escalationScore, 0) / arr.length;
    return avg(recent) - avg(older);
  }

  // Fallback: chronological split
  const mid     = Math.ceil(sorted.length / 2);
  const oldHalf = sorted.slice(0, mid);
  const newHalf = sorted.slice(mid);
  if (!newHalf.length) return 0;
  const avgOld = oldHalf.reduce((s, a) => s + a.escalationScore, 0) / oldHalf.length;
  const avgNew = newHalf.reduce((s, a) => s + a.escalationScore, 0) / newHalf.length;
  return avgNew - avgOld;
}

type VelocityDisplay = { arrow: string; label: string; color: string };
function velocityDisplay(v: number): VelocityDisplay {
  if (v >  1.5) return { arrow: '↑↑', label: 'SURGE',   color: '#ff2200' };
  if (v >  0.4) return { arrow: '↑',  label: 'ESC',     color: '#ff7700' };
  if (v < -1.5) return { arrow: '↓↓', label: 'RAPID↓',  color: '#22dd66' };
  if (v < -0.4) return { arrow: '↓',  label: 'DE-ESC',  color: '#44aa66' };
  return            { arrow: '→',  label: '',          color: '#3a6a4a' };
}

export default function RiskMeter({ articles }: Props) {
  const regional = useMemo(() => {
    type Acc = {
      list:     NewsArticle[];
      sources:  Set<string>;
      maxScore: number;
      maxTitle: string;
    };
    const map: Record<string, Acc> = {};

    for (const a of articles) {
      if (!map[a.region]) map[a.region] = { list: [], sources: new Set(), maxScore: 0, maxTitle: '' };
      map[a.region].list.push(a);
      map[a.region].sources.add(a.source);
      if (a.escalationScore > map[a.region].maxScore) {
        map[a.region].maxScore = a.escalationScore;
        map[a.region].maxTitle = a.title;
      }
    }

    return Object.entries(map).map(([region, d]) => {
      const sorted = [...d.list].sort(
        (a, b) => new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime(),
      );

      // 1 · Recency-weighted average
      let wSum = 0, wTotal = 0;
      for (const a of sorted) {
        const w = recencyWeight(a.pubDate);
        wTotal += a.escalationScore * w;
        wSum   += w;
      }
      const recencyAvg = wSum > 0 ? wTotal / wSum : 0;

      // 2 · Velocity (trend signal)
      const velocity = computeVelocity(sorted);

      // 3 · Coverage breadth (0 – 1)
      const coverage = Math.min(d.sources.size / MAX_SOURCES, 1);

      // 4 · Velocity-adjusted score (velocity shifts the average directionally)
      const velocityAdj = Math.max(0, Math.min(10, recencyAvg + velocity * 0.6));

      // 5 · Composite
      const composite = Math.max(0, Math.min(10,
        recencyAvg   * W_RECENCY  +
        d.maxScore   * W_PEAK     +
        velocityAdj  * W_VELOCITY +
        coverage * 10 * W_COVERAGE,
      ));

      return {
        region,
        score:    parseFloat(composite.toFixed(1)),
        rawScore: parseFloat(recencyAvg.toFixed(1)),
        velocity,
        count:    d.list.length,
        sources:  d.sources.size,
        maxTitle: d.maxTitle,
        color:    REGION_COLORS[region] ?? '#888',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
  }, [articles]);

  // Quadratic-weighted global: high-scoring regions pull the needle harder
  const scoreSum   = regional.reduce((s, r) => s + r.score,         0);
  const squaredSum = regional.reduce((s, r) => s + r.score * r.score, 0);
  const globalIndex = regional.length
    ? parseFloat((scoreSum > 0 ? squaredSum / scoreSum : 0).toFixed(1))
    : 0;

  const simpleAvg = regional.length ? scoreSum / regional.length : 0;
  const isSurging = (globalIndex - simpleAvg) > SURGE_THRESHOLD;

  const globalColor = globalIndex >= 7.5 ? '#ff2200' : globalIndex >= 5.5 ? '#ff8800' : '#ffcc00';
  const globalLabel = globalIndex >= 7.5 ? 'CRITICAL' : globalIndex >= 5.5 ? 'ELEVATED' : 'MODERATE';

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>REGIONAL RISK MATRIX</span>
        <div className="flex items-center gap-2">
          {isSurging && (
            <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold bg-[#ff220018] border border-[#ff220055] text-[#ff5522] rounded animate-pulse tracking-widest">
              SURGE
            </span>
          )}
          <span style={{ color: globalColor }} className="font-bold">{globalLabel}</span>
        </div>
      </div>

      {/* Global arc gauge */}
      <div className="flex items-center justify-center py-4 border-b border-[#1a3a1a]">
        <div className="relative flex items-center justify-center">
          <svg width="120" height="66" viewBox="0 0 120 66">
            {/* Track */}
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#1a3a1a" strokeWidth="8" strokeLinecap="round" />
            {/* Fill */}
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke={globalColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(globalIndex / 10) * 157} 157`}
              style={{ filter: `drop-shadow(0 0 6px ${globalColor})` }}
            />
          </svg>
          <div className="absolute bottom-0 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color: globalColor }}>{globalIndex}</div>
            <div className="font-mono text-[8px] text-[#3a6a4a] tracking-widest">COMPOSITE ESC.</div>
          </div>
        </div>
      </div>

      {/* Regional bars */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {regional.map(r => {
          const vd = velocityDisplay(r.velocity);
          return (
            <div key={r.region} className="group">
              <div className="flex items-center justify-between mb-1">
                {/* Left: region name + trend badge */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-[10px] text-[#5a8a6a] truncate">{r.region}</span>
                  {vd.label && (
                    <span
                      className="flex-shrink-0 font-mono text-[8px] px-1 py-0.5 rounded tracking-wider"
                      style={{ color: vd.color, border: `1px solid ${vd.color}44`, background: `${vd.color}11` }}
                    >
                      {vd.arrow} {vd.label}
                    </span>
                  )}
                </div>

                {/* Right: meta + score */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!vd.label && (
                    <span className="font-mono text-[9px]" style={{ color: vd.color }}>{vd.arrow}</span>
                  )}
                  <span className="font-mono text-[9px] text-[#2a4a2a]">
                    {r.count}art · {r.sources}src
                  </span>
                  <span className="font-mono text-[11px] font-bold" style={{ color: r.color }}>{r.score}</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1.5 bg-[#0a1a0c] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(r.score / 10) * 100}%`,
                    background: r.color,
                    boxShadow: `0 0 4px ${r.color}88`,
                  }}
                />
              </div>

              {/* Hover: worst headline */}
              <div className="hidden group-hover:block text-[9px] text-[#3a5a3a] mt-0.5 truncate">
                {r.maxTitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-3 pb-2 pt-1 border-t border-[#1a3a1a] flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[8px] text-[#2a4a2a]">↑ ESCALATING</span>
        <span className="font-mono text-[8px] text-[#2a4a2a]">↓ DE-ESC</span>
        <span className="font-mono text-[8px] text-[#2a4a2a]">→ STABLE</span>
        <span className="ml-auto font-mono text-[8px] text-[#1a3a1a]">Σ=recency·peak·velocity·coverage</span>
      </div>
    </div>
  );
}
