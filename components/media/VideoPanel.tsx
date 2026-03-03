'use client';

import { useState } from 'react';
import type { YTVideo } from '@/lib/types';
import { relativeTime } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  videos: YTVideo[];
  loading: boolean;
}

export default function VideoPanel({ videos, loading }: Props) {
  const [activeVideo, setActiveVideo] = useState<YTVideo | null>(null);
  const [channel, setChannel] = useState<string>('all');

  const channels = ['all', ...Array.from(new Set(videos.map(v => v.channelName)))];

  const filtered = channel === 'all' ? videos : videos.filter(v => v.channelName === channel);

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-video rounded shimmer" />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Channel filter */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0 overflow-x-auto pb-1">
        {channels.map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`flex-shrink-0 px-3 py-1 text-[10px] font-mono rounded border transition-all duration-150 ${
              channel === ch
                ? 'bg-[#ff440022] border-[#ff4400] text-[#ff6633]'
                : 'bg-[#060f07] border-[#1a3a1a] text-[#3a6a4a] hover:border-[#2a5a3a]'
            }`}
          >
            {ch === 'all' ? 'ALL CHANNELS' : ch.toUpperCase()}
          </button>
        ))}
        <span className="ml-auto flex-shrink-0 font-mono text-[10px] text-[#3a6a4a]">{filtered.length} VIDEOS</span>
      </div>

      {/* Embed player */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex-shrink-0"
          >
            <div className="relative bg-black rounded overflow-hidden border border-[#1a3a1a]">
              <div className="flex items-center justify-between px-3 py-2 bg-[#060f07] border-b border-[#1a3a1a]">
                <div className="font-mono text-[10px] text-[#ff6633] truncate flex-1 mr-4">▶ {activeVideo.title}</div>
                <button
                  onClick={() => setActiveVideo(null)}
                  className="text-[#3a6a4a] hover:text-[#8aaa8a] font-mono text-sm"
                >
                  ✕ CLOSE
                </button>
              </div>
              <div className="relative" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={activeVideo.embedUrl}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? <LoadingSkeleton /> : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActiveVideo(video)}
                className="group cursor-pointer rounded overflow-hidden border border-[#1a3a1a] hover:border-[#2a5a3a] transition-all bg-[#060f07]"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-300 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060f07] via-transparent to-transparent" />

                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-[#ff4400cc] border border-[#ff6600] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-sm ml-0.5">▶</span>
                    </div>
                  </div>

                  {/* Channel badge */}
                  <div className="absolute top-2 left-2">
                    <span className="px-1.5 py-0.5 bg-[#060f07cc] border border-[#1a3a1a] text-[8px] font-mono text-[#4a7a5a] rounded backdrop-blur-sm">
                      {video.channelName.replace(' English', '').slice(0, 14)}
                    </span>
                  </div>

                  {/* Tags */}
                  {video.tags.length > 0 && (
                    <div className="absolute bottom-2 right-2">
                      <span className="px-1.5 py-0.5 bg-[#ff440022] border border-[#ff440044] text-[8px] font-mono text-[#ff8844] rounded uppercase">
                        {video.tags[0]}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2">
                  <div className="text-[10px] text-[#7a9a7a] group-hover:text-[#aaccaa] leading-snug line-clamp-2 transition-colors">
                    {video.title}
                  </div>
                  <div className="text-[9px] font-mono text-[#2a4a2a] mt-1">{relativeTime(video.publishedAt)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
