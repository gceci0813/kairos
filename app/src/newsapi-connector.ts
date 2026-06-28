import { BaseDataConnector, StandardizedData } from './base-connector';

export class NewsAPIConnector extends BaseDataConnector {
  constructor(apiKey: string) {
    super(apiKey, {
      requestsPerSecond: 1,
      requestsPerHour: 100, // NewsAPI free tier: 100 requests/day, conservative hourly cap
    });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();

    try {
      const pageSize = options?.pageSize ?? 50;
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=${pageSize}&apiKey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText} — ${body.slice(0, 200)}`);
      }

      const data = await response.json();
      return this.transformData(data);
    } catch (error) {
      console.error('Error fetching NewsAPI data:', error);
      throw error;
    }
  }

  transformData(rawData: any): StandardizedData[] {
    if (!rawData.articles || !Array.isArray(rawData.articles)) {
      return [];
    }

    return rawData.articles.map((article: any) => ({
      id: `newsapi-${article.url}`,
      source: 'NewsAPI',
      content: `${article.title ?? ''}\n\n${article.description ?? ''}`.trim(),
      author: article.author || article.source?.name || 'Unknown',
      timestamp: new Date(article.publishedAt),
      metadata: {
        url: article.url,
        sourceName: article.source?.name,
        imageUrl: article.urlToImage,
      },
    }));
  }
}
