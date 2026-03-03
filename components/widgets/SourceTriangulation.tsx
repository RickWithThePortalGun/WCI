'use client';

import { useMemo, useState } from 'react';
import type { NewsArticle } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';

interface Props {
  articles: NewsArticle[];
}

interface EventCluster {
  topic: string;
  articles: NewsArticle[];
  avgSentiment: number;
  sources: string[];
  maxEsc: number;
}

// Very simple keyword-based clustering
function clusterArticles(articles: NewsArticle[]): EventCluster[] {
  const CLUSTER_TOPICS: { label: string; keywords: string[] }[] = [
    { label: 'Ukraine/Russia Frontline', keywords: ['ukraine', 'russia', 'kyiv', 'donbas', 'zelensky', 'putin'] },
    { label: 'Gaza / Middle East', keywords: ['gaza', 'hamas', 'rafah', 'ceasefire', 'hostage', 'israel', 'netanyahu'] },
    { label: 'Taiwan Strait', keywords: ['taiwan', 'strait', 'china', 'pla', 'beijing'] },
    { label: 'Sudan Crisis', keywords: ['sudan', 'rsf', 'darfur', 'khartoum', 'humanitarian'] },
    { label: 'Iran Tensions', keywords: ['iran', 'irgc', 'sanctions', 'nuclear', 'tehran'] },
    { label: 'Sahel Insurgency', keywords: ['mali', 'burkina', 'niger', 'sahel', 'jihadist', 'wagner'] },
    { label: 'DRC / East Africa', keywords: ['congo', 'drc', 'm23', 'goma', 'kivu'] },
    { label: 'North Korea / DPRK', keywords: ['north korea', 'dprk', 'kim jong', 'missile', 'pyongyang'] },
  ];

  return CLUSTER_TOPICS
    .map(topic => {
      const matched = articles.filter(a => {
        const text = `${a.title} ${a.description}`.toLowerCase();
        return topic.keywords.some(kw => text.includes(kw));
      });
      if (matched.length < 2) return null;

      const avgSentiment = matched.reduce((s, a) => s + a.sentiment, 0) / matched.length;
      const sources = Array.from(new Set(matched.map(a => a.source))).slice(0, 6);
      const maxEsc = Math.max(...matched.map(a => a.escalationScore));

      return {
        topic: topic.label,
        articles: matched.slice(0, 8),
        avgSentiment,
        sources,
        maxEsc,
      };
    })
    .filter((c): c is EventCluster => c !== null)
    .sort((a, b) => b.maxEsc - a.maxEsc);
}

const BIAS_LABEL: Record<string, { label: string; color: string }> = {
  'left': { label: 'L', color: '#4488ff' },
  'center-left': { label: 'CL', color: '#44aaff' },
  'center': { label: 'C', color: '#44cc88' },
  'center-right': { label: 'CR', color: '#ffaa44' },
  'right': { label: 'R', color: '#ff6644' },
};

export default function SourceTriangulation({ articles }: Props) {
  const clusters = useMemo(() => clusterArticles(articles), [articles]);
  const [selected, setSelected] = useState<EventCluster | null>(clusters[0] ?? null);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
      {/* Topic list */}
      <div className="w-full lg:w-64 flex-shrink-0 overflow-y-auto space-y-2 pr-2 border-r-0 lg:border-r border-[#1a3a1a] max-h-[200px] lg:max-h-none">
        <div className="font-mono text-[9px] text-[#3a6a4a] tracking-widest pb-2">ACTIVE CLUSTERS</div>
        {clusters.map(cluster => (
          <button
            key={cluster.topic}
            onClick={() => setSelected(cluster)}
            className={`w-full text-left p-2.5 rounded border transition-all duration-150 ${
              selected?.topic === cluster.topic
                ? 'bg-[#ff440015] border-[#ff440044] text-[#ff8844]'
                : 'bg-[#060f07] border-[#1a3a1a] text-[#5a8a6a] hover:border-[#2a5a3a]'
            }`}
          >
            <div className="text-[11px] font-medium leading-tight mb-1">{cluster.topic}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[9px]" style={{ color: SEVERITY_COLORS(cluster.maxEsc) }}>
                ESC {cluster.maxEsc.toFixed(1)}
              </span>
              <span className="text-[9px] text-[#2a4a2a]">·</span>
              <span className="font-mono text-[9px] text-[#2a4a2a]">{cluster.articles.length} articles</span>
            </div>
            <div className="mt-1.5 h-1 bg-[#0a1a0c] rounded overflow-hidden">
              <div
                className="h-full rounded"
                style={{ width: `${(cluster.maxEsc / 10) * 100}%`, background: SEVERITY_COLORS(cluster.maxEsc) }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Triangulation view */}
      {selected ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-4">
            <h2 className="font-mono text-sm text-[#ff8844] mb-1">{selected.topic}</h2>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="text-[#3a6a4a]">{selected.sources.length} sources reporting</span>
              <span
                className="flex items-center gap-1"
                style={{ color: selected.avgSentiment < -0.2 ? '#ff6644' : '#44cc88' }}
              >
                {selected.avgSentiment < -0.3 ? <ArrowDown size={10} /> : selected.avgSentiment > 0.1 ? <ArrowUp size={10} /> : <ArrowRight size={10} />}
                {selected.avgSentiment < -0.3 ? 'Generally negative' : selected.avgSentiment > 0.1 ? 'Generally positive' : 'Mixed coverage'}
              </span>
            </div>

            {/* Source coverage bar */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {selected.sources.map(s => (
                <span key={s} className="px-2 py-0.5 bg-[#0a1a0c] border border-[#1a3a1a] text-[8px] font-mono text-[#4a7a5a] rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {selected.articles.map((article, i) => {
              const bias = BIAS_LABEL[article.sourceBias] ?? { label: 'C', color: '#888' };
              return (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 border border-[#1a3a1a] rounded bg-[#060f07] hover:bg-[#0a1a0c] hover:border-[#2a5a3a] transition-all group"
                >
                  {/* Sentiment + bias column */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                    <div
                      className="text-[9px] font-mono font-bold px-1 rounded border"
                      style={{ color: bias.color, borderColor: bias.color + '44' }}
                      title={`Editorial bias: ${article.sourceBias}`}
                    >
                      {bias.label}
                    </div>
                    <div
                      className="text-[10px] flex items-center"
                      style={{ color: article.sentiment < -0.2 ? '#ff6644' : article.sentiment > 0.1 ? '#44cc88' : '#888' }}
                    >
                      {article.sentiment < -0.3 ? <ArrowDown size={10} /> : article.sentiment > 0.2 ? <ArrowUp size={10} /> : <ArrowRight size={10} />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[#8aaa8a] group-hover:text-[#aaccaa] leading-snug">{article.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono text-[#3a6a4a]">{article.source}</span>
                      <span className="text-[9px] font-mono text-[#2a4a2a]">·</span>
                      <span className="text-[9px] font-mono" style={{ color: SEVERITY_COLORS(article.escalationScore) }}>
                        ESC {article.escalationScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#3a6a4a] font-mono text-sm">
          SELECT A TOPIC CLUSTER
        </div>
      )}
    </div>
  );
}
