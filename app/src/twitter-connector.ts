import { BaseDataConnector, StandardizedData } from './base-connector';

export class TwitterConnector extends BaseDataConnector {
  constructor(bearerToken: string) {
    super(bearerToken, {
      requestsPerSecond: 0.3,
      requestsPerHour: 180, // X API v2 recent search, Basic tier conservative cap
    });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();

    try {
      const maxResults = options?.maxResults ?? 50;
      const params = new URLSearchParams({
        query,
        max_results: String(maxResults),
        'tweet.fields': 'created_at,author_id,public_metrics,lang,geo',
        expansions: 'author_id',
        'user.fields': 'username,name',
      });

      const response = await fetch(`https://api.x.com/2/tweets/search/recent?${params}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`X API error: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`);
      }

      const data = await response.json();
      return this.transformData(data);
    } catch (error) {
      console.error('Error fetching X/Twitter data:', error);
      throw error;
    }
  }

  transformData(rawData: any): StandardizedData[] {
    if (!rawData.data || !Array.isArray(rawData.data)) {
      return [];
    }

    const usersById = new Map<string, any>(
      (rawData.includes?.users ?? []).map((u: any) => [u.id, u])
    );

    return rawData.data.map((tweet: any) => {
      const user = usersById.get(tweet.author_id);
      return {
        id: `twitter-${tweet.id}`,
        source: 'X/Twitter',
        content: tweet.text,
        author: user?.username ?? tweet.author_id ?? 'Unknown',
        timestamp: new Date(tweet.created_at),
        metadata: {
          url: user ? `https://x.com/${user.username}/status/${tweet.id}` : undefined,
          language: tweet.lang,
          likeCount: tweet.public_metrics?.like_count,
          retweetCount: tweet.public_metrics?.retweet_count,
          replyCount: tweet.public_metrics?.reply_count,
        },
      };
    });
  }
}
