// Queue abstraction for connector output. Runs in-process (synchronous
// hand-off) until REDIS_STREAMS_URL is configured, at which point
// RedisStreamsQueue should be used instead — same interface, so callers
// don't change.

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

// Placeholder for a real Redis Streams-backed queue. Needs ioredis (or a
// Redis Streams-compatible client) and a REDIS_STREAMS_URL connection
// string — not wired up because no broker has been provisioned yet.
// Once you have one (e.g. Upstash Redis), implement publish/consume here
// using XADD/XREAD and swap getMessageQueue() below to return this.
export class RedisStreamsQueue<T> implements MessageQueue<T> {
  constructor(_connectionUrl: string) {
    throw new Error(
      'RedisStreamsQueue is not implemented yet — provision a Redis Streams broker ' +
      '(e.g. Upstash Redis) and set REDIS_STREAMS_URL, then implement publish/consume with XADD/XREAD.'
    );
  }

  async publish(): Promise<void> {
    throw new Error('RedisStreamsQueue not implemented');
  }

  async consume(): Promise<T[]> {
    throw new Error('RedisStreamsQueue not implemented');
  }
}

let queueInstance: MessageQueue<any> | null = null;

export function getMessageQueue<T>(): MessageQueue<T> {
  if (!queueInstance) {
    // Swap to `new RedisStreamsQueue(process.env.REDIS_STREAMS_URL!)` once
    // a broker is provisioned and the class above is implemented.
    queueInstance = new InProcessQueue<T>();
  }
  return queueInstance;
}
