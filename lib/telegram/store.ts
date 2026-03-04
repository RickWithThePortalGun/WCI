import { Redis } from '@upstash/redis';
import type { Subscriber } from './types';

// Redis.fromEnv() reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

const K = {
  sub: (chatId: number) => `wci:sub:${chatId}`,
  subs: 'wci:subs',
  alert: (hash: string) => `wci:alert:${hash}`,
  alertCount: () => `wci:alerts:${new Date().toISOString().slice(0, 10)}`, // YYYY-MM-DD
};

// ── Subscriber CRUD ────────────────────────────────────────────────────

export async function getSubscriber(chatId: number): Promise<Subscriber | null> {
  return redis.get<Subscriber>(K.sub(chatId));
}

export async function upsertSubscriber(sub: Subscriber): Promise<void> {
  await Promise.all([
    redis.set(K.sub(sub.chatId), sub),
    redis.sadd(K.subs, String(sub.chatId)),
  ]);
}

export async function createSubscriber(
  chatId: number,
  username?: string,
  firstName?: string,
): Promise<Subscriber> {
  const existing = await getSubscriber(chatId);
  if (existing) {
    existing.lastActive = new Date().toISOString();
    await upsertSubscriber(existing);
    return existing;
  }
  const sub: Subscriber = {
    chatId,
    username,
    firstName,
    watchlist: [],
    alertThreshold: 8.0,
    briefingTime: null,
    enabledSources: [],
    profile: 'analyst',
    joinedAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
  };
  await upsertSubscriber(sub);
  return sub;
}

export async function updateSubscriber(chatId: number, updates: Partial<Subscriber>): Promise<void> {
  const existing = await getSubscriber(chatId);
  if (!existing) return;
  await redis.set(K.sub(chatId), {
    ...existing,
    ...updates,
    lastActive: new Date().toISOString(),
  });
}

export async function removeSubscriber(chatId: number): Promise<void> {
  await Promise.all([
    redis.del(K.sub(chatId)),
    redis.srem(K.subs, String(chatId)),
  ]);
}

export async function getAllSubscribers(): Promise<Subscriber[]> {
  const ids = await redis.smembers(K.subs);
  if (ids.length === 0) return [];
  // Fetch all in one pipeline round-trip
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get<Subscriber>(K.sub(Number(id)));
  const results = await pipeline.exec<(Subscriber | null)[]>();
  return results.filter((s): s is Subscriber => s !== null);
}

// ── Alert Deduplication ────────────────────────────────────────────────

const ALERT_TTL_SECS = 60 * 60; // 1 hour — prevents re-alerting the same story

export async function hasAlertBeenSent(hash: string): Promise<boolean> {
  return (await redis.exists(K.alert(hash))) === 1;
}

export async function markAlertSent(hash: string): Promise<void> {
  await Promise.all([
    redis.set(K.alert(hash), 1, { ex: ALERT_TTL_SECS }),
    // Increment today's counter; expires after 48h so it auto-cleans
    redis.incr(K.alertCount()).then(count => {
      if (count === 1) redis.expire(K.alertCount(), 60 * 60 * 48);
    }),
  ]);
}

// ── Stats ──────────────────────────────────────────────────────────────

export async function getStats(): Promise<{
  totalSubscribers: number;
  activeWatchers: number;
  alertsSentToday: number;
}> {
  const [ids, alertsSentToday] = await Promise.all([
    redis.smembers(K.subs),
    redis.get<number>(K.alertCount()),
  ]);

  // Count active watchers without fetching full objects — use a pipeline
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get<Subscriber>(K.sub(Number(id)));
  const subs = (await pipeline.exec<(Subscriber | null)[]>()).filter(
    (s): s is Subscriber => s !== null,
  );

  return {
    totalSubscribers: subs.length,
    activeWatchers: subs.filter(s => s.watchlist.length > 0).length,
    alertsSentToday: alertsSentToday ?? 0,
  };
}
