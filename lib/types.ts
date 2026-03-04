// Core news article type
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  sourceBias: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  image?: string;
  tags: ConflictTag[];
  region: Region;
  sentiment: number; // -1 (very negative) to 1 (very positive)
  escalationScore: number; // 0-10
}

// YouTube video type
export interface YTVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  videoUrl: string;
  embedUrl: string;
  tags: ConflictTag[];
}

// Conflict zone for globe
export interface ConflictZone {
  lat: number;
  lng: number;
  name: string;
  country: string;
  severity: number; // 1-10
  type: 'war' | 'insurgency' | 'tension' | 'civil-war' | 'cyber' | 'proxy';
  tag: ConflictTag;
  casualties?: string;
  startDate?: string;
  description: string;
  factions: string[];
  relatedCountries: string[];
}

// Arc for globe connections (news flow, alliances)
export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  label?: string;
}

// Regions
export type Region =
  | 'Eastern Europe'
  | 'Middle East'
  | 'East Asia'
  | 'South Asia'
  | 'Africa'
  | 'Central Asia'
  | 'Americas'
  | 'Southeast Asia'
  | 'Global';

// Conflict tags for filtering
export type ConflictTag =
  | 'ukraine'
  | 'russia'
  | 'gaza'
  | 'israel'
  | 'taiwan'
  | 'china'
  | 'iran'
  | 'sudan'
  | 'myanmar'
  | 'yemen'
  | 'sahel'
  | 'drc'
  | 'korea'
  | 'kashmir'
  | 'afghanistan'
  | 'ethiopia'
  | 'libya'
  | 'lebanon'
  | 'iraq'
  | 'syria'
  | 'nato'
  | 'nuclear'
  | 'cyber'
  | 'economy'
  | 'diplomacy'
  | 'humanitarian';

// Regional risk score
export interface RegionalRisk {
  region: Region;
  score: number;
  trend: 'escalating' | 'stable' | 'de-escalating';
  topThreat: string;
  articleCount: number;
}

// API response types
export interface NewsAPIResponse {
  articles: NewsArticle[];
  fetchedAt: string;
  totalCount: number;
  sources: string[];
}

export interface YouTubeAPIResponse {
  videos: YTVideo[];
  fetchedAt: string;
}

export interface AIDigestResponse {
  summary: string;
  keyEvents: string[];
  riskAssessment: string;
  generatedAt: string;
}

// Dashboard filter state
export interface FilterState {
  region: Region | 'all';
  tag: ConflictTag | 'all';
  source: string | 'all';
  timeRange: '1h' | '6h' | '24h' | '7d';
  view: 'dashboard' | 'globe' | 'news' | 'videos' | 'timeline' | 'analysis';
}

// Economic indicator
export interface EconIndicator {
  symbol: string;
  name: string;
  value: number;
  change: number;
  unit: string;
  conflictLinked: boolean;
}
