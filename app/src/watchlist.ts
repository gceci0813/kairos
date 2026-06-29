import { Redis } from '@upstash/redis';
import { entitySentimentSeries } from './political-trends';
import { trendDeviations } from './baseline';

// Persistent watchlist: terms (regions / narratives / queries) an analyst
// wants to monitor, stored in Redis. Aggregate topics/places — a watchlist of
// SUBJECTS in public discourse, not of individuals.

const KEY = 'intel:watchlist';

function getRedis(): Redis | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  return url && token ? new Redis({ url, token }) : null;
}

export interface WatchItem {
  term: string;
  kind: 'region' | 'narrative' | 'query';
  addedAt: string;
}

export async function listWatch(): Promise<WatchItem[]> {
  const redis = getRedis();
  if (!redis) return [];
  const all = (await redis.hgetall<Record<string, any>>(KEY)) ?? {};
  return Object.entries(all)
    .map(([key, val]) => {
      // @upstash/redis may return the value already parsed (object) or as a
      // JSON string — handle both.
      if (val && typeof val === 'object') return val as WatchItem;
      try { return JSON.parse(val) as WatchItem; } catch { return { term: key, kind: 'query' as const, addedAt: '' }; }
    })
    .sort((a, b) => a.term.localeCompare(b.term));
}

export async function addWatch(term: string, kind: WatchItem['kind']): Promise<WatchItem> {
  const redis = getRedis();
  if (!redis) throw new Error('Redis not configured');
  const item: WatchItem = { term: term.trim(), kind, addedAt: new Date().toISOString() };
  await redis.hset(KEY, { [item.term.toLowerCase()]: JSON.stringify(item) });
  return item;
}

export async function removeWatch(term: string): Promise<void> {
  const redis = getRedis();
  if (!redis) throw new Error('Redis not configured');
  await redis.hdel(KEY, term.trim().toLowerCase());
}

export interface WatchStatus extends WatchItem {
  mentions: number;
  sentiment: number;
  momentum: number;
  deviationZ: number | null;
  flagged: boolean;
}

// Evaluate each watched term's current state. Reuses the trend engine for
// volume/sentiment/momentum and the baseline engine for deviation.
export async function watchlistStatus(windowDays = 90): Promise<WatchStatus[]> {
  const items = await listWatch();
  if (items.length === 0) return [];

  // One baseline pass shared across items.
  const dev = await trendDeviations({ windowDays: Math.max(120, windowDays * 4), recentDays: 14 }).catch(() => null);
  const devMap = new Map<string, number>();
  for (const d of [...(dev?.regions ?? []), ...(dev?.narratives ?? [])]) devMap.set(d.key.toLowerCase(), d.z);

  const out: WatchStatus[] = [];
  for (const it of items) {
    const trend = await entitySentimentSeries(it.term, { sinceDays: windowDays }).catch(() => null);
    const z = devMap.get(it.term.toLowerCase()) ?? null;
    out.push({
      ...it,
      mentions: trend?.totalVolume ?? 0,
      sentiment: Number((trend?.overallSentiment ?? 0).toFixed(2)),
      momentum: Number((trend?.momentum ?? 0).toFixed(2)),
      deviationZ: z != null ? Number(z.toFixed(1)) : null,
      flagged: (z != null && Math.abs(z) >= 2) || Math.abs(trend?.momentum ?? 0) >= 0.4,
    });
  }
  return out.sort((a, b) => Number(b.flagged) - Number(a.flagged) || b.mentions - a.mentions);
}
