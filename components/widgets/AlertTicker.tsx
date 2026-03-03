'use client';

import { useEffect, useState } from 'react';
import type { NewsArticle } from '@/lib/types';

interface Props {
  articles: NewsArticle[];
}

export default function AlertTicker({ articles }: Props) {
  const [items, setItems] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const top = articles
      .filter(a => a.escalationScore >= 5)
      .slice(0, 20);
    setItems(top);
  }, [articles]);

  if (!items.length) return null;

  const text = items
    .map(a => `  •  [${a.source.toUpperCase()}]  ${a.title}`)
    .join('');

  const tickerContent = `${text}  •  `.repeat(6);

  return (
    <div className="border-b border-[#1a3a1a] bg-[#060f07] flex items-center overflow-hidden" style={{ height: 28 }}>
      <div className="flex-shrink-0 px-3 bg-[#ff2200] flex items-center h-full">
        <span className="font-mono text-[9px] font-bold tracking-widest text-white pulse-dot">BREAKING</span>
      </div>
      <div className="ticker-wrap flex-1 h-full flex items-center relative">
        <div className="ticker-text text-[11px] font-mono text-[#ff8844] tracking-wide whitespace-nowrap inline-block">
          {tickerContent}
        </div>
      </div>
    </div>
  );
}
