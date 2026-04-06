'use client';

import useSWR from 'swr';
import type { TelegramChannelMessage } from '@/lib/types';

type TelegramFeedResponse = {
  channel: string;
  channelUrl: string;
  fetchedAt: string | null;
  messages: TelegramChannelMessage[];
};

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TelegramChannelFeed() {
  const { data, isLoading } = useSWR<TelegramFeedResponse>(
    '/api/telegram/mes',
    fetcher,
    { refreshInterval: 180_000 },
  );

  const messages = data?.messages ?? [];

  return (
    <div className="h-full flex flex-col border border-[#1a3a1a] bg-[#040c05] rounded">
      <div className="panel-header flex-shrink-0">
        <span>MIDDLE EAST SPECTATOR</span>
        <a
          href={data?.channelUrl ?? 'https://t.me/Middle_East_Spectator'}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] text-[#44aaff] hover:text-[#7ac7ff] transition-colors"
        >
          OPEN CHANNEL
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {isLoading && (
          <div className="text-[9px] font-mono text-[#3a6a4a]">LOADING TELEGRAM MESSAGES...</div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-[9px] font-mono text-[#3a6a4a]">
            NO CACHED MESSAGES YET. RUN THE TELETHON FETCH SCRIPT.
          </div>
        )}

        {messages.map(msg => (
          <a
            key={msg.id}
            href={msg.messageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-2 rounded border border-[#15301d] hover:border-[#2a5a3a] hover:bg-[#0a1a0c] transition-colors"
          >
            <div className="text-[10px] leading-snug text-[#b7d8b8] line-clamp-4">
              {msg.text || '(media-only message)'}
            </div>
            <div className="mt-1 text-[8px] font-mono text-[#3a6a4a]">
              {new Date(msg.date).toUTCString()}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
