import { NextResponse } from 'next/server';
import type { NewsArticle } from '@/lib/types';

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
  }

  const { articles }: { articles: NewsArticle[] } = await request.json();
  const top = articles
    .sort((a, b) => b.escalationScore - a.escalationScore)
    .slice(0, 15)
    .map(a => `- [${a.source}] ${a.title}`)
    .join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content: `You are a senior geopolitical analyst at an intelligence think-tank. 
Provide concise, factual conflict intelligence briefings. 
Do not sensationalize. Always note uncertainty. 
Format: Brief opening paragraph, then 3-5 bullet key events, then 1-sentence risk assessment.`,
        },
        {
          role: 'user',
          content: `Analyze these top conflict headlines from the last few hours and provide an intelligence digest:\n\n${top}\n\nReturn JSON: { "summary": string, "keyEvents": string[], "riskAssessment": string }`,
        },
      ],
    }),
  });

  if (!res.ok) return NextResponse.json({ error: 'AI API error' }, { status: 502 });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  
  if (!text) {
    return NextResponse.json({ error: 'Empty response from AI' }, { status: 502 });
  }

  try {
    // Clean the text - remove markdown code blocks
    let clean = text.replace(/```json|```/g, '').trim();
    
    // Try to extract JSON object if it's embedded in text
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      clean = jsonMatch[0];
    }
    
    // Try to fix incomplete JSON by closing unclosed strings/objects
    let fixed = clean;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    
    // If JSON is incomplete, try to fix it
    if (openBraces > closeBraces) {
      // Close unclosed objects
      fixed = fixed + '}'.repeat(openBraces - closeBraces);
    }
    
    // Try to close unclosed strings
    const openQuotes = (fixed.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) {
      // Find the last unclosed quote and close it
      const lastQuoteIndex = fixed.lastIndexOf('"');
      if (lastQuoteIndex !== -1) {
        fixed = fixed.slice(0, lastQuoteIndex + 1) + '"' + fixed.slice(lastQuoteIndex + 1);
      }
    }
    
    const parsed = JSON.parse(fixed);
    
    // Validate and ensure all required fields exist
    const result = {
      summary: parsed.summary || text.slice(0, 300),
      keyEvents: Array.isArray(parsed.keyEvents) ? parsed.keyEvents : [],
      riskAssessment: parsed.riskAssessment || '',
      generatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(result);
  } catch (parseError) {
    // If JSON parsing fails, try to extract structured data manually
    const summaryMatch = text.match(/"summary"\s*:\s*"([^"]*)"/) || text.match(/summary["\s:]+([^"]+)/i);
    const keyEventsMatch = text.match(/"keyEvents"\s*:\s*\[([\s\S]*?)\]/);
    const riskMatch = text.match(/"riskAssessment"\s*:\s*"([^"]*)"/) || text.match(/riskAssessment["\s:]+([^"]+)/i);
    
    return NextResponse.json({
      summary: summaryMatch ? summaryMatch[1] : text.slice(0, 300),
      keyEvents: keyEventsMatch ? 
        keyEventsMatch[1].split(',').map((e: string) => e.trim().replace(/^["']|["']$/g, '')) : 
        [],
      riskAssessment: riskMatch ? riskMatch[1] : '',
      generatedAt: new Date().toISOString(),
    });
  }
}
