import type { ConflictTag } from '@/lib/types';

export interface Subscriber {
  chatId: number;
  username?: string;
  firstName?: string;
  watchlist: ConflictTag[];
  alertThreshold: number;        // 0–10, default 8.0
  briefingTime: string | null;   // "HH:MM" UTC or null
  enabledSources: string[];      // empty = all sources
  profile: 'analyst' | 'summary';
  joinedAt: string;
  lastActive: string;
}

