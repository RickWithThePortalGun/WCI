'use client';

import { useState } from 'react';
import type { NewsArticle } from '@/lib/types';
import { SEVERITY_COLORS } from '@/lib/constants';
import { relativeTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowRight, ExternalLink } from 'lucide-react';

const BIAS_LABEL: Record<string, string> = {
  'left': 'L',
  'center-left': 'CL',
  'center': 'C',
  'center-right': 'CR',
  'right': 'R',
};

const BIAS_COLOR: Record<string, string> = {
  'left': '#4488ff',
  'center-left': '#44aaff',
  'center': '#44cc88',
  'center-right': '#ffaa44',
  'right': '#ff6644',
};

interface Props {
  article: NewsArticle;
  index: number;
  compact?: boolean;
}

export default function ArticleCard({ article, index, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const sevColor = SEVERITY_COLORS(article.escalationScore);
  const time = relativeTime(article.pubDate);

  if (compact) {
    return (
      <motion.a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className="flex gap-2 sm:gap-3 p-2 sm:p-2.5 border border-[#1a3a1a] rounded article-card group bg-[#060f07] hover:bg-[#0a1a0c]"
      >
        <div className="flex-shrink-0 w-1 rounded-full self-stretch" style={{ background: sevColor }} />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] sm:text-[11px] text-[#8aaa8a] group-hover:text-[#aaccaa] leading-snug line-clamp-2">
            {article.title}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
            <span className="text-[8px] sm:text-[9px] font-mono text-[#3a6a4a]">{article.source}</span>
            <span className="text-[8px] sm:text-[9px] font-mono text-[#2a4a2a] hidden sm:inline">·</span>
            <span className="text-[8px] sm:text-[9px] font-mono text-[#2a4a2a]">{time}</span>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="font-mono text-[10px] sm:text-[11px] font-bold" style={{ color: sevColor }}>{article.escalationScore.toFixed(1)}</div>
        </div>
      </motion.a>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="panel article-card group overflow-hidden"
      onClick={() => setExpanded(e => !e)}
    >
      {!expanded && (
        <div className="relative w-full aspect-video overflow-hidden bg-[#0a1a0c]">
          {article.image ? (
            <>
              <img
                src={article.image}
                alt=""
                className="w-full h-full object-cover object-center opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060f07] to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0a1a0c] to-[#060f07] border-b border-[#1a3a1a]">
              <div className="font-display text-4xl sm:text-5xl text-[#1a3a1a] tracking-[8px] font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                WWC
              </div>
            </div>
          )}
          {/* Escalation indicator */}
          <div className="absolute top-2 right-2">
            <div
              className="px-1.5 py-0.5 font-mono text-[10px] font-bold rounded border"
              style={{ color: sevColor, borderColor: sevColor, background: `${sevColor}22` }}
            >
              ESC {article.escalationScore.toFixed(1)}
            </div>
          </div>
        </div>
      )}

      <div className="p-3">
        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-[#0a1a0c] border border-[#1a3a1a] text-[8px] font-mono text-[#4a7a5a] rounded uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="text-[12px] font-medium text-[#8aaa8a] group-hover:text-[#aaccaa] leading-snug mb-2 transition-colors">
          {article.title}
        </h3>

        {expanded && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-[11px] text-[#5a8a6a] leading-relaxed mb-3"
          >
            {article.description}
          </motion.p>
        )}

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-[#3a6a4a]">{article.source}</span>
            <span
              className="text-[8px] font-mono px-1 rounded border"
              style={{ color: BIAS_COLOR[article.sourceBias], borderColor: BIAS_COLOR[article.sourceBias] + '44' }}
              title={`Editorial bias: ${article.sourceBias}`}
            >
              {BIAS_LABEL[article.sourceBias]}
            </span>
            <span className="text-[9px] font-mono text-[#2a4a2a]">·</span>
            <span className="text-[9px] font-mono text-[#2a4a2a]">{time}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sentiment indicator */}
            <div
              className="text-[9px] font-mono flex items-center"
              title={`Sentiment: ${article.sentiment.toFixed(2)}`}
              style={{ color: article.sentiment < -0.3 ? '#ff6644' : article.sentiment > 0.2 ? '#44cc88' : '#888' }}
            >
              {article.sentiment < -0.3 ? <ArrowDown size={10} /> : article.sentiment > 0.2 ? <ArrowUp size={10} /> : <ArrowRight size={10} />}
            </div>

            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[9px] font-mono text-[#3a6a4a] hover:text-[#44aaff] transition-colors flex items-center gap-1"
            >
              READ
              <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>

      {/* Severity bar */}
      <div className="h-0.5 bg-[#0a1a0c]">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${(article.escalationScore / 10) * 100}%`, background: sevColor }}
        />
      </div>
    </motion.div>
  );
}
