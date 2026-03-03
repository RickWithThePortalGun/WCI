import { NextResponse } from 'next/server';

const activeVisitors = new Map<string, number>();

const VISITOR_TIMEOUT = 30000; 

setInterval(() => {
  const now = Date.now();
  Array.from(activeVisitors.entries()).forEach(([sessionId, lastSeen]) => {
    if (now - lastSeen > VISITOR_TIMEOUT) {
      activeVisitors.delete(sessionId);
    }
  });
}, 10000); // Clean up every 10 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId') || '';

  if (sessionId) {
    activeVisitors.set(sessionId, Date.now());
  }

  const now = Date.now();
  Array.from(activeVisitors.entries()).forEach(([id, lastSeen]) => {
    if (now - lastSeen > VISITOR_TIMEOUT) {
      activeVisitors.delete(id);
    }
  });

  return NextResponse.json({
    count: activeVisitors.size,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
