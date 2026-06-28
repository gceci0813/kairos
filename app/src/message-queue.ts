import { Redis } from '@upstash/redis';

// Queue abstraction for connector output. Uses Redis Streams when Upstash is
// configured (serverless-safe REST client), otherwise an in-process fallback.
// Same interface either way, so callers don't change.

export interface MessageQueue<T> {
  publish(topic: string, messages: T[]): Promise<void>;
  // Reads up to `count` oldest messages and removes them from the queue.
  consume(topic: string, count?: number): Promise<T[]>;
  // Number of messages currently waiting.
  size(topic: string): Promise<number>;
  // Discard all messages on a topic.
  purge(topic: string): Promise<void>;
}

export class InProcessQueue<T> implements MessageQueue<T> {
  private topics: Map<string, T[]> = new Map();

  async publish(topic: string, messages: T[]): Promise<void> {
    const existing = this.topics.get(topic) ?? [];
    this.topics.set(topic, [...existing, ...messages]);
  }

  async consume(topic: string, count = Infinity): Promise<T[]> {
    const all = this.topics.get(topic) ?? [];
    const take = all.slice(0, count);
    this.topics.set(topic, all.slice(count));
    return take;
  }

  async size(topic: string): Promise<number> {
    return (this.topics.get(topic) ?? []).length;
  }

  async purge(topic: string): Promise<void> {
    this.topics.delete(topic);
  }
}

// Real Redis Streams-backed queue using Upstash's REST client (works on
// serverless — no persistent TCP socket needed, unlike ioredis). Activated
// when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
//
// Each topic is a stream keyed `sigma:stream:<topic>`. publish → XADD;
// consume → XRANGE from the last-read id, then advance a per-topic cursor
// stored at `sigma:cursor:<topic>`. (XADD/XRANGE rather than consumer groups
// keeps it simple and idempotent for a single logical consumer.)
export class RedisStreamsQueue<T> implements MessageQueue<T> {
  private redis: Redis;

  constructor(url: string, token: string) {
    this.redis = new Redis({ url: url.replace(/\s/g, ''), token: token.replace(/\s/g, '') });
  }

  private streamKey(topic: string) {
    return `sigma:stream:${topic}`;
  }
  private cursorKey(topic: string) {
    return `sigma:cursor:${topic}`;
  }

  async publish(topic: string, messages: T[]): Promise<void> {
    if (messages.length === 0) return;
    for (const message of messages) {
      await this.redis.xadd(this.streamKey(topic), '*', { data: JSON.stringify(message) });
    }
  }

  // Correct, non-lossy consume: read the oldest `count` entries, then XDEL
  // exactly those ids. No cursor, no re-publishing — an entry is returned once
  // and removed, so nothing is skipped or duplicated.
  async consume(topic: string, count = 100): Promise<T[]> {
    const key = this.streamKey(topic);
    const entries = (await this.redis.xrange(key, '-', '+', count)) as Record<
      string,
      { data: unknown }
    >;

    const ids = Object.keys(entries);
    if (ids.length === 0) return [];

    const results: T[] = [];
    for (const id of ids) {
      const raw = entries[id]?.data;
      try {
        results.push((typeof raw === 'string' ? JSON.parse(raw) : raw) as T);
      } catch {
        if (raw !== undefined) results.push(raw as T);
      }
    }

    await this.redis.xdel(key, ids);
    return results;
  }

  async size(topic: string): Promise<number> {
    return (await this.redis.xlen(this.streamKey(topic))) as number;
  }

  async purge(topic: string): Promise<void> {
    await this.redis.del(this.streamKey(topic));
  }
}

let queueInstance: MessageQueue<any> | null = null;

export function getMessageQueue<T>(): MessageQueue<T> {
  if (!queueInstance) {
    const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
    queueInstance = url && token ? new RedisStreamsQueue<T>(url, token) : new InProcessQueue<T>();
  }
  return queueInstance;
}

export function isRedisQueueActive(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}
