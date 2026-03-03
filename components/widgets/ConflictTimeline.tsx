'use client';

import { useMemo, useState } from 'react';
import type { NewsArticle } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';
import { relativeTime } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowRight, ExternalLink } from 'lucide-react';

interface Props {
  articles: NewsArticle[];
}

export default function ConflictTimeline({ articles }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const timelineItems = useMemo(() => {
    return [...articles]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 50)
      .map(a => ({ ...a, formattedDate: format(parseISO(a.pubDate), 'HH:mm') }));
  }, [articles]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof timelineItems> = {};
    for (const item of timelineItems) {
      const date = format(parseISO(item.pubDate), 'dd MMM yyyy');
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return Object.entries(groups).slice(0, 5);
  }, [timelineItems]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="max-w-3xl mx-auto">
        {grouped.map(([date, items]) => (
          <div key={date} className="mb-8">
            {/* Day header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="font-mono text-[10px] text-[#ff8800] tracking-widest">{date.toUpperCase()}</div>
              <div className="flex-1 h-px bg-[#1a3a1a]" />
              <div className="font-mono text-[9px] text-[#2a4a2a]">{items.length} events</div>
            </div>

            {/* Events */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[47px] top-0 bottom-0 w-px bg-[#1a3a1a]" />

              <div className="space-y-3">
                {items.map((item, i) => {
                  const isExpanded = expandedId === item.id;
                  const sevColor = SEVERITY_COLORS(item.escalationScore);

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex gap-4 group cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {/* Time */}
                      <div className="w-10 flex-shrink-0 font-mono text-[10px] text-[#2a4a2a] text-right pt-1.5">
                        {item.formattedDate}
                      </div>

                      {/* Dot */}
                      <div className="flex-shrink-0 relative z-10">
                        <div
                          className="w-3 h-3 rounded-full border-2 mt-1.5 transition-all duration-200"
                          style={{
                            borderColor: sevColor,
                            background: isExpanded ? sevColor : `${sevColor}33`,
                            boxShadow: isExpanded ? `0 0 8px ${sevColor}` : 'none',
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-3 border-b border-[#1a3a1a] last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* Tags */}
                            {item.tags.slice(0, 2).map(t => (
                              <span key={t} className="mr-1.5 text-[8px] font-mono uppercase text-[#4a7a5a]">[{t}]</span>
                            ))}
                            <div className="text-[12px] text-[#8aaa8a] group-hover:text-[#aaccaa] leading-snug mt-0.5 transition-colors">
                              {item.title}
                            </div>
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            <span className="font-mono text-[10px] font-bold" style={{ color: sevColor }}>
                              {item.escalationScore.toFixed(1)}
                            </span>
                            <span className="font-mono text-[9px] text-[#3a6a4a]">{item.source}</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 space-y-2"
                          >
                            <p className="text-[11px] text-[#5a8a6a] leading-relaxed">{item.description}</p>
                            <div className="flex items-center gap-3">
                              <div
                                className="text-[9px] font-mono px-2 py-0.5 rounded border flex items-center gap-1"
                                style={{ color: item.sentiment < -0.2 ? '#ff6644' : '#44cc88', borderColor: 'currentColor', opacity: 0.7 }}
                              >
                                {item.sentiment < -0.3 ? <ArrowDown size={9} /> : item.sentiment > 0.2 ? <ArrowUp size={9} /> : <ArrowRight size={9} />}
                                {item.sentiment < -0.3 ? 'NEGATIVE' : item.sentiment > 0.2 ? 'POSITIVE' : 'NEUTRAL'}
                              </div>
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-[9px] font-mono text-[#44aaff] hover:underline flex items-center gap-1"
                              >
                                FULL ARTICLE
                                <ExternalLink size={9} />
                              </a>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
