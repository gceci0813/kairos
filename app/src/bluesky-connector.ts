import { Redis } from '@upstash/redis';
import { BaseDataConnector, StandardizedData } from './base-connector';

// Shared session cache across serverless invocations, so we don't call
// createSession (heavily rate-limited) on every request. Backed by Upstash
// when configured; falls back to per-instance memory otherwise.
function getRedis(): Redis | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? '').trim();
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? '').trim();
  return url && token ? new Redis({ url, token }) : null;
}
const SESSION_KEY = 'bluesky:session';

// Bluesky (AT Protocol) connector. Free, but post search requires an
// authenticated session — create a free Bluesky account and an App Password
// (Settings → App Passwords), then set BLUESKY_IDENTIFIER (handle or email)
// and BLUESKY_APP_PASSWORD. Far cheaper than X's paid read tier ($0 vs $200/mo).
export class BlueskyConnector extends BaseDataConnector {
  private identifier: string;
  private appPassword: string;
  private accessJwt: string | null = null;
  private sessionExpiry = 0;

  constructor(identifier: string, appPassword: string) {
    super(`${identifier}:${appPassword}`, {
      requestsPerSecond: 1,
      requestsPerHour: 1000,
    });
    // Strip any whitespace/newlines introduced when the values were pasted
    // into the env var (a recurring gremlin in this project's setup).
    this.identifier = identifier.replace(/\s/g, '');
    this.appPassword = appPassword.replace(/\s/g, '');
  }

  private async ensureSession(): Promise<string> {
    // 1) Warm in-memory session on this instance.
    if (this.accessJwt && Date.now() < this.sessionExpiry) return this.accessJwt;

    const redis = getRedis();

    // 2) Shared session cached in Redis (across invocations).
    if (redis) {
      const cached = await redis.get<{ accessJwt: string; refreshJwt: string; expiry: number }>(SESSION_KEY);
      if (cached && Date.now() < cached.expiry) {
        this.accessJwt = cached.accessJwt;
        this.sessionExpiry = cached.expiry;
        return cached.accessJwt;
      }
      // 2b) Try refreshing with the stored refresh token (cheap, not rate-limited like login).
      if (cached?.refreshJwt) {
        try {
          const refreshed = await this.refreshSession(cached.refreshJwt);
          await this.persistSession(redis, refreshed.accessJwt, refreshed.refreshJwt);
          return refreshed.accessJwt;
        } catch {
          /* fall through to full login */
        }
      }
    }

    // 3) Full login (rate-limited — only when nothing else worked).
    const session = await this.createSession();
    if (redis) await this.persistSession(redis, session.accessJwt, session.refreshJwt);
    return session.accessJwt;
  }

  private async createSession(): Promise<{ accessJwt: string; refreshJwt: string }> {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: this.identifier, password: this.appPassword }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Bluesky auth failed: ${res.status} — ${body.slice(0, 160)}`);
    }
    return res.json();
  }

  private async refreshSession(refreshJwt: string): Promise<{ accessJwt: string; refreshJwt: string }> {
    const res = await fetch('https://bsky.social/xrpc/com.atproto.server.refreshSession', {
      method: 'POST',
      headers: { Authorization: `Bearer ${refreshJwt}` },
    });
    if (!res.ok) throw new Error(`Bluesky refresh failed: ${res.status}`);
    return res.json();
  }

  private async persistSession(redis: Redis, accessJwt: string, refreshJwt: string): Promise<void> {
    // Access JWTs last ~2h; cache for 100 min.
    const expiry = Date.now() + 100 * 60 * 1000;
    this.accessJwt = accessJwt;
    this.sessionExpiry = expiry;
    await redis.set(SESSION_KEY, { accessJwt, refreshJwt, expiry }, { ex: 110 * 60 });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();

    try {
      const jwt = await this.ensureSession();
      const limit = Math.min(options?.limit ?? 50, 100);
      const params = new URLSearchParams({ q: query, limit: String(limit), sort: 'latest' });
      const url = `https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${jwt}`, 'User-Agent': 'Kairos-SIGMA/1.0' },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Bluesky API error: ${response.status} ${response.statusText} — ${body.slice(0, 160)}`);
      }

      const data = await response.json();
      return this.transformData(data);
    } catch (error) {
      console.error('Error fetching Bluesky data:', error);
      throw error;
    }
  }

  transformData(rawData: any): StandardizedData[] {
    if (!rawData.posts || !Array.isArray(rawData.posts)) {
      return [];
    }

    return rawData.posts.map((post: any) => {
      const author = post.author ?? {};
      const record = post.record ?? {};
      const handle = author.handle ?? 'unknown';
      const rkey = (post.uri ?? '').split('/').pop();
      const created = record.createdAt ? new Date(record.createdAt) : new Date();
      return {
        id: `bluesky-${post.cid ?? post.uri}`,
        source: 'Bluesky',
        content: record.text ?? '',
        author: handle,
        timestamp: isNaN(created.getTime()) ? new Date() : created,
        metadata: {
          url: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : undefined,
          displayName: author.displayName,
          likeCount: post.likeCount,
          repostCount: post.repostCount,
          replyCount: post.replyCount,
          langs: record.langs,
        },
      };
    });
  }
}
