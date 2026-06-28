import { Redis } from '@upstash/redis';

// Queue abstraction for connector output. Uses Redis Streams when Upstash is
// configured (serverless-safe REST client), otherwise an in-process fallback.
// Same interface either way, so callers don't change.

export interface MessageQueue<T> {
  publish(topic: string, messages: T[]): Promise<void>;
  consume(topic: string): Promise<T[]>;
}

export class InProcessQueue<T> implements MessageQueue<T> {
  private topics: Map<string, T[]> = new Map();

  async publish(topic: string, messages: T[]): Promise<void> {
    const existing = this.topics.get(topic) ?? [];
    this.topics.set(topic, [...existing, ...messages]);
  }

  async consume(topic: string): Promise<T[]> {
    const messages = this.topics.get(topic) ?? [];
    this.topics.set(topic, []);
    return messages;
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

  async consume(topic: string): Promise<T[]> {
    const cursor = (await this.redis.get<string>(this.cursorKey(topic))) ?? '0';
    const entries = (await this.redis.xrange(this.streamKey(topic), cursor, '+')) as Record<
      string,
      { data: unknown }
    >;

    const ids = Object.keys(entries);
    const results: T[] = [];
    let lastId = cursor;
    for (const id of ids) {
      if (id === cursor) continue; // skip the inclusive boundary already consumed
      const raw = entries[id]?.data;
      // @upstash/redis may auto-deserialize JSON, so `data` can arrive as a
      // string OR an already-parsed object. Handle both.
      try {
        results.push((typeof raw === 'string' ? JSON.parse(raw) : raw) as T);
      } catch {
        if (raw !== undefined) results.push(raw as T);
      }
      lastId = id;
    }

    if (lastId !== cursor) {
      await this.redis.set(this.cursorKey(topic), lastId);
    }
    return results;
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
