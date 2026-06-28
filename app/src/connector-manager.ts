import { BaseDataConnector, StandardizedData } from './base-connector';
import { GDELTConnector } from './gdelt-connector';
import { RedditConnector } from './reddit-connector';
import { NewsAPIConnector } from './newsapi-connector';
import { TwitterConnector } from './twitter-connector';
import { YouTubeConnector } from './youtube-connector';
import { TelegramConnector } from './telegram-connector';

const CACHE_TTL_MS = 60 * 1000;

interface CacheEntry {
  data: StandardizedData[];
  expiresAt: number;
}

export class ConnectorManager {
  private connectors: Map<string, BaseDataConnector> = new Map();
  private cache: Map<string, CacheEntry> = new Map();

  constructor() {
    // Initialize connectors with API keys from environment variables
    if (process.env.GDELT_API_KEY) {
      this.connectors.set('gdelt', new GDELTConnector(process.env.GDELT_API_KEY));
    }
    
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      this.connectors.set('reddit', new RedditConnector(
        process.env.REDDIT_CLIENT_ID,
        process.env.REDDIT_CLIENT_SECRET,
        'Kairos/1.0.0'
      ));
    }

    if (process.env.NEWSAPI_KEY) {
      this.connectors.set('newsapi', new NewsAPIConnector(process.env.NEWSAPI_KEY));
    }

    if (process.env.TWITTER_BEARER_TOKEN) {
      this.connectors.set('twitter', new TwitterConnector(process.env.TWITTER_BEARER_TOKEN));
    }

    if (process.env.YOUTUBE_API_KEY) {
      this.connectors.set('youtube', new YouTubeConnector(process.env.YOUTUBE_API_KEY));
    }

    if (process.env.TELEGRAM_CHANNELS) {
      const channels = process.env.TELEGRAM_CHANNELS.split(',').map((c) => c.trim()).filter(Boolean);
      if (channels.length > 0) {
        this.connectors.set('telegram', new TelegramConnector(channels));
      }
    }
  }

  private getCached(key: string): StandardizedData[] | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  private setCached(key: string, data: StandardizedData[]): void {
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  async fetchDataFromSource(source: string, query: string, options?: any): Promise<StandardizedData[]> {
    const connector = this.connectors.get(source);
    if (!connector) {
      throw new Error(`Connector for source '${source}' not found or not configured`);
    }

    const cacheKey = `${source}:${query}:${JSON.stringify(options ?? {})}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const results = await connector.fetchData(query, options);
    this.setCached(cacheKey, results);
    return results;
  }

  async fetchDataFromAllSources(query: string, options?: any): Promise<StandardizedData[]> {
    const cacheKey = `all:${query}:${JSON.stringify(options ?? {})}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    const results: StandardizedData[] = [];

    for (const [source, connector] of this.connectors) {
      try {
        const sourceResults = await connector.fetchData(query, options);
        results.push(...sourceResults);
      } catch (error) {
        console.error(`Error fetching data from ${source}:`, error);
        // Continue with other sources even if one fails
      }
    }

    this.setCached(cacheKey, results);
    return results;
  }

  getAvailableSources(): string[] {
    return Array.from(this.connectors.keys());
  }
}