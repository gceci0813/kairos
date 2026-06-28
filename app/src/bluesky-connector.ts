import { BaseDataConnector, StandardizedData } from './base-connector';

// Bluesky (AT Protocol) connector using the public AppView API — free, open,
// and unauthenticated for public post search. No API key required. Good
// real-time social signal and a legitimate alternative to X's paid API.
export class BlueskyConnector extends BaseDataConnector {
  constructor() {
    super('', {
      requestsPerSecond: 1,
      requestsPerHour: 1000,
    });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();

    try {
      const limit = Math.min(options?.limit ?? 50, 100);
      const params = new URLSearchParams({ q: query, limit: String(limit), sort: 'latest' });
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?${params}`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Kairos-SIGMA/1.0' },
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
