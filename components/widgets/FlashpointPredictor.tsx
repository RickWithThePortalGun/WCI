'use client';

import { useMemo } from 'react';
import type { NewsArticle } from '@/lib/types';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  articles: NewsArticle[];
}

interface TagVelocity {
  tag: string;
  velocity: number;    // positive = rising, negative = de-escalating
  currentAvg: number;  // avg escalation score last 12h
  count: number;
}

function computeVelocities(articles: NewsArticle[]): TagVelocity[] {
  const now = Date.now();
  const h12 = 12 * 3_600_000;
  const h24 = 24 * 3_600_000;

  // Group by tag
  const byTag: Record<string, { recent: number[]; older: number[] }> = {};
  for (const a of articles) {
    const age = now - new Date(a.pubDate).getTime();
    if (age > h24) continue;
    const bucket = age <= h12 ? 'recent' : 'older';
    for (const tag of a.tags) {
      if (!byTag[tag]) byTag[tag] = { recent: [], older: [] };
      byTag[tag][bucket].push(a.escalationScore);
    }
  }

  const results: TagVelocity[] = [];
  for (const [tag, { recent, older }] of Object.entries(byTag)) {
    if (recent.length + older.length < 3) continue;
    const avg = (arr: number[]) => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null;
    const rAvg = avg(recent);
    const oAvg = avg(older);
    if (rAvg === null) continue;
    const velocity = rAvg - (oAvg ?? rAvg);
    results.push({ tag, velocity, currentAvg: rAvg, count: recent.length + older.length });
  }

  // Sort by absolute velocity (most movement first), take top 8
  return results
    .sort((a, b) => Math.abs(b.velocity) - Math.abs(a.velocity))
    .slice(0, 8);
}

export default function FlashpointPredictor({ articles }: Props) {
  const velocities = useMemo(() => computeVelocities(articles), [articles]);

  if (velocities.length === 0) {
    return (
      <div className="panel h-full flex flex-col">
        <div className="panel-header">
          <span>FLASHPOINT ANALYSIS</span>
          <span className="text-[8px] text-[#2a4a2a]">VELOCITY</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-[#2a4a2a] font-mono text-[10px]">
          AWAITING DATA...
        </div>
      </div>
    );
  }

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>FLASHPOINT ANALYSIS</span>
        <span className="text-[8px] text-[#2a4a2a]">24H VELOCITY</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {velocities.map((item, i) => {
          const rising = item.velocity > 0.5;
          const falling = item.velocity < -0.5;
          const color = rising ? '#ff4400' : falling ? '#44aa66' : '#ffcc00';
          const barPct = Math.round((item.currentAvg / 10) * 100);
          const velStr = (item.velocity >= 0 ? '+' : '') + item.velocity.toFixed(1);
          const arrowCount = Math.min(3, Math.round(Math.abs(item.velocity)));

          return (
            <motion.div
              key={item.tag}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center gap-2 text-[10px] font-mono">
                {/* Direction icon */}
                {rising  && <TrendingUp  size={11} style={{ color }} className="flex-shrink-0" />}
                {falling && <TrendingDown size={11} style={{ color }} className="flex-shrink-0" />}
                {!rising && !falling && <Minus size={11} style={{ color }} className="flex-shrink-0" />}

                {/* Tag name */}
                <span style={{ color }} className="uppercase w-20 truncate tracking-wider">
                  {item.tag}
                </span>

                {/* Velocity */}
                <span className="ml-auto font-bold tabular-nums" style={{ color }}>
                  {velStr}
                </span>

                {/* Arrow chars */}
                <span style={{ color }} className="w-8 text-right tracking-tighter">
                  {rising  ? '↑'.repeat(arrowCount) : falling ? '↓'.repeat(arrowCount) : '→'}
                </span>
              </div>

              {/* Score bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-[#0a1a0c] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barPct}%`, background: color, opacity: 0.7 }}
                  />
                </div>
                <span className="text-[8px] font-mono text-[#3a6a4a] tabular-nums w-8 text-right">
                  {item.currentAvg.toFixed(1)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
