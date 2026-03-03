'use client';

import { useState, useMemo } from 'react';
import type { NewsArticle, ConflictTag, Region } from '@/lib/types';
import ArticleCard from './ArticleCard';
import { RSS_FEEDS } from '@/lib/constants';

const REGIONS: (Region | 'all')[] = ['all', 'Eastern Europe', 'Middle East', 'East Asia', 'Africa', 'Southeast Asia', 'South Asia', 'Global'];
const TAGS: (ConflictTag | 'all')[] = ['all', 'ukraine', 'gaza', 'taiwan', 'sudan', 'iran', 'myanmar', 'sahel', 'drc', 'lebanon', 'korea', 'nuclear', 'cyber', 'humanitarian'];

interface Props {
  articles: NewsArticle[];
  loading: boolean;
  compact?: boolean;
  maxItems?: number;
}

export default function NewsFeed({ articles, loading, compact, maxItems }: Props) {
  const [region, setRegion] = useState<Region | 'all'>('all');
  const [tag, setTag] = useState<ConflictTag | 'all'>('all');
  const [sort, setSort] = useState<'date' | 'severity' | 'source'>('date');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = [...articles];

    if (region !== 'all') list = list.filter(a => a.region === region);
    if (tag !== 'all') list = list.filter(a => a.tags.includes(tag));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }

    if (sort === 'severity') list.sort((a, b) => b.escalationScore - a.escalationScore);
    else if (sort === 'source') list.sort((a, b) => a.source.localeCompare(b.source));
    else list.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return maxItems ? list.slice(0, maxItems) : list;
  }, [articles, region, tag, sort, search, maxItems]);

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="panel h-24 shimmer" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      {!compact && (
        <div className="flex flex-wrap items-center gap-2 mb-3 flex-shrink-0">
          <input
            type="text"
            placeholder="Search intelligence..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-32 bg-[#0a1a0c] border border-[#1a3a1a] rounded px-3 py-1.5 text-[11px] font-mono text-[#8aaa8a] placeholder-[#2a4a2a] focus:outline-none focus:border-[#2a5a3a]"
          />
          <select value={region} onChange={e => setRegion(e.target.value as any)} className="text-[10px]">
            {REGIONS.map(r => <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>)}
          </select>
          <select value={tag} onChange={e => setTag(e.target.value as any)} className="text-[10px]">
            {TAGS.map(t => <option key={t} value={t}>{t === 'all' ? 'All Tags' : t.toUpperCase()}</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="text-[10px]">
            <option value="date">Latest</option>
            <option value="severity">Severity</option>
            <option value="source">Source</option>
          </select>

          <span className="font-mono text-[10px] text-[#3a6a4a] ml-auto">
            {filtered.length} ARTICLES
          </span>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 font-mono text-[#3a6a4a] text-sm">
            NO INTELLIGENCE MATCHING FILTERS
          </div>
        ) : (
          <div className={compact ? 'space-y-1 sm:space-y-1.5' : 'grid gap-3 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}>
            {filtered.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} compact={compact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
