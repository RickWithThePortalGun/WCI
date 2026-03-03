import type { ConflictTag, Region, NewsArticle } from './types';
import { TAG_KEYWORDS, NEGATIVE_WORDS, POSITIVE_WORDS, TAG_TO_REGION } from './constants';
import { nanoid } from 'nanoid'; // fallback: we'll use a simple id fn

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function classifyTags(text: string): ConflictTag[] {
  const lower = text.toLowerCase();
  return (Object.entries(TAG_KEYWORDS) as [ConflictTag, string[]][])
    .filter(([, kws]) => kws.some(kw => lower.includes(kw)))
    .map(([tag]) => tag)
    .slice(0, 5);
}

export function classifyRegion(tags: ConflictTag[]): Region {
  for (const tag of tags) {
    if (TAG_TO_REGION[tag]) return TAG_TO_REGION[tag];
  }
  return 'Global';
}

export function analyzeSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 0.15;
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 0.1;
  return Math.max(-1, Math.min(1, score));
}

export function computeEscalationScore(title: string, desc: string, sentiment?: number): number {
  // Critical phrases (highest weight) - must match exactly
  const CRITICAL_PHRASES = [
    'nuclear war', 'nuclear weapon', 'nuclear strike', 'nuclear attack',
    'mass casualty', 'mass killing', 'genocide', 'ethnic cleansing',
    'full scale war', 'world war', 'declared war',
    'chemical weapon', 'biological weapon',
    'ceasefire violated', 'peace deal broken'
  ];
  
  // High severity words (count frequency, not just presence)
  const HIGH = ['nuclear', 'missile', 'bomb', 'killed', 'attack', 'explosion', 'war', 'strike', 'invasion', 'offensive', 'casualties', 'massacre', 'siege', 'bombardment', 'shelling', 'artillery'];
  
  // Medium severity words
  const MED = ['tension', 'military', 'clash', 'conflict', 'sanction', 'troops', 'deploy', 'protest', 'violence', 'fighting', 'combat', 'skirmish'];
  
  // Lower severity indicators
  const LOW = ['diplomatic', 'talks', 'negotiation', 'meeting', 'summit'];
  
  const titleLower = title.toLowerCase();
  const descLower = desc.toLowerCase();
  const fullText = `${titleLower} ${descLower}`;
  
  let score = 2.5; 
  
  // Check for critical phrases (highest weight, title weighted 3x)
  for (const phrase of CRITICAL_PHRASES) {
    const inTitle = titleLower.includes(phrase);
    const inDesc = descLower.includes(phrase);
    if (inTitle) score += 2.5; // Critical phrase in title is very serious
    if (inDesc) score += 1.0;
  }
  
  // Count frequency of high-severity words (title weighted 2x)
  for (const word of HIGH) {
    const titleMatches = (titleLower.match(new RegExp(`\\b${word}\\w*`, 'g')) || []).length;
    const descMatches = (descLower.match(new RegExp(`\\b${word}\\w*`, 'g')) || []).length;
    score += (titleMatches * 1.0) + (descMatches * 0.4); // Title words worth more
  }
  
  // Count medium-severity words (less weight)
  for (const word of MED) {
    const titleMatches = (titleLower.match(new RegExp(`\\b${word}\\w*`, 'g')) || []).length;
    const descMatches = (descLower.match(new RegExp(`\\b${word}\\w*`, 'g')) || []).length;
    score += (titleMatches * 0.4) + (descMatches * 0.2);
  }
  
  // Reduce score for de-escalation words
  for (const word of LOW) {
    if (fullText.includes(word)) score -= 0.3;
  }
  
  if (sentiment !== undefined) {
    if (sentiment < -0.3) score += 0.8; // Very negative = more serious
    else if (sentiment < -0.1) score += 0.4;
    else if (sentiment > 0.2) score -= 0.5; // Positive sentiment reduces escalation
  }
  
  const highWordCount = HIGH.reduce((count, word) => {
    return count + (fullText.includes(word) ? 1 : 0);
  }, 0);
  if (highWordCount >= 3) score += 0.8; // Multiple indicators = more serious
  if (highWordCount >= 5) score += 0.5; // Many indicators = even more serious
  
  // Clamp to 0-10 and round
  return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
}

export function stripHtml(str: string): string {
  return str?.replace(/<[^>]+>/g, '') ?? '';
}

export function truncate(str: string, n: number): string {
  return str?.length > n ? str.slice(0, n - 1) + '…' : str;
}

export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
