'use client';

import { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import type { NewsArticle } from '@/lib/types';
import { format, parseISO, startOfHour, subHours } from 'date-fns';

interface Props {
  articles: NewsArticle[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#060f07] border border-[#1a3a1a] rounded p-2 text-[10px] font-mono">
        <div className="text-[#4a7a5a] mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function EscalationChart({ articles }: Props) {
  const data = useMemo(() => {
    // Group articles by hour bucket
    const now = new Date();
    const buckets: Record<string, { scores: number[]; count: number }> = {};

    for (let h = 23; h >= 0; h--) {
      const key = format(subHours(now, h), 'HH:00');
      buckets[key] = { scores: [], count: 0 };
    }

    for (const a of articles) {
      try {
        const hourKey = format(startOfHour(parseISO(a.pubDate)), 'HH:00');
        if (buckets[hourKey]) {
          buckets[hourKey].scores.push(a.escalationScore);
          buckets[hourKey].count += 1;
        }
      } catch {}
    }

    return Object.entries(buckets).map(([time, d]) => ({
      time,
      escalation: d.scores.length ? parseFloat((d.scores.reduce((s, x) => s + x, 0) / d.scores.length).toFixed(2)) : null,
      articles: d.count,
    }));
  }, [articles]);

  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of articles) counts[a.source] = (counts[a.source] ?? 0) + 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([source, count]) => ({ source: source.replace(' World', '').slice(0, 12), count }));
  }, [articles]);

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header">
        <span>24H ESCALATION INDEX</span>
        <span className="text-[#3a6a4a]">LIVE FEED ANALYSIS</span>
      </div>

      <div className="flex-1 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="escGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4400" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ff4400" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="artGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#44aaff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#44aaff" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: '#3a6a4a', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: '#1a3a1a' }}
              interval={3}
            />
            <YAxis
              yAxisId="esc"
              domain={[0, 10]}
              tick={{ fill: '#3a6a4a', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              width={24}
            />
            <YAxis yAxisId="art" orientation="right" hide />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId="esc" y={7.5} stroke="#ff000033" strokeDasharray="4 4" />
            <ReferenceLine yAxisId="esc" y={5} stroke="#ff880033" strokeDasharray="4 4" />
            <Area
              yAxisId="art"
              type="monotone"
              dataKey="articles"
              name="Articles"
              stroke="#44aaff"
              fill="url(#artGradient)"
              strokeWidth={1}
              dot={false}
              connectNulls
            />
            <Area
              yAxisId="esc"
              type="monotone"
              dataKey="escalation"
              name="Escalation"
              stroke="#ff4400"
              fill="url(#escGradient)"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
