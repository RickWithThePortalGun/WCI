import { NextResponse } from 'next/server';
import { getArticleHash, getCachedScore, setCachedScore, getAIScore } from '@/lib/escalation-cache';

export async function POST(request: Request) {
  try {
    const { title, description }: { title: string; description: string } = await request.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const hash = getArticleHash(title, description);
    
    // Check cache first
    const cached = getCachedScore(hash);
    if (cached !== null) {
      return NextResponse.json({ 
        score: cached, 
        cached: true,
        timestamp: Date.now()
      });
    }

    // Get AI score
    const score = await getAIScore(title, description);
    
    // Cache the result
    setCachedScore(hash, score);

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
