import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

// Simple in-memory cache with TTL (24 hours)
interface CacheEntry {
  score: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

export function getArticleHash(title: string, description: string): string {
  const content = `${title}|${description}`.toLowerCase().trim();
  return createHash('md5').update(content).digest('hex');
}

export function getCachedScore(hash: string): number | null {
  const cached = cache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.score;
  }
  return null;
}

export function setCachedScore(hash: string, score: number): void {
  cache.set(hash, {
    score,
    timestamp: Date.now(),
  });
}

export async function getAIScore(title: string, description: string): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const prompt = `Analyze this news article and assign an escalation score from 0.0 to 10.0 based on conflict severity.

Title: ${title}
Description: ${description}

Consider:
- 0-2: Peaceful, diplomatic, or routine news
- 3-4: Tensions, protests, or minor incidents
- 5-6: Active conflict, military actions, casualties
- 7-8: Major military operations, significant casualties, war escalation
- 9-10: Nuclear threats, genocide, full-scale war, mass casualties

Return ONLY a number between 0.0 and 10.0 with one decimal place. No explanation, just the number.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini', // Fast and cost-effective
      max_tokens: 10,
      temperature: 0.3, // Lower temperature for more consistent scoring
      messages: [
        {
          role: 'system',
          content: 'You are a conflict intelligence analyst. Return only a number from 0.0 to 10.0.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`OpenAI API error: ${res.status} - ${error}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  
  // Extract number from response
  const match = text.match(/(\d+\.?\d*)/);
  if (!match) {
    throw new Error('Invalid AI response format');
  }

  const score = parseFloat(match[1]);
  if (isNaN(score) || score < 0 || score > 10) {
    throw new Error(`Invalid score: ${score}`);
  }

  return Math.max(0, Math.min(10, parseFloat(score.toFixed(1))));
}

export async function POST(request: Request) {
  try {
    const { title, description }: { title: string; description: string } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const hash = getArticleHash(title, description);
    
    // Check cache first
    const cached = cache.get(hash);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ 
        score: cached.score, 
        cached: true,
        timestamp: cached.timestamp 
      });
    }

    // Get AI score
    const score = await getAIScore(title, description);
    
    // Cache the result
    cache.set(hash, {
      score,
      timestamp: Date.now(),
    });

    return NextResponse.json({ 
      score, 
      cached: false,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Escalation score error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to compute escalation score',
      fallback: true 
    }, { status: 500 });
  }
}
