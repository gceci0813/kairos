import { BaseDataConnector, StandardizedData } from './base-connector';

export class GDELTConnector extends BaseDataConnector {
  constructor(apiKey: string) {
    super(apiKey, {
      requestsPerSecond: 1,
      requestsPerHour: 1000
    });
  }

  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_BASE_DELAY_MS = 5000;

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    for (let attempt = 0; attempt <= GDELTConnector.MAX_RETRIES; attempt++) {
      await this.waitForRateLimit();

      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

        const startDate = startTime.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
        const endDate = endTime.toISOString().replace(/[-:T.]/g, '').substring(0, 14);

        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&startdatetime=${startDate}&enddatetime=${endDate}&maxrecords=50`;

        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        });

        if (response.status === 429 && attempt < GDELTConnector.MAX_RETRIES) {
          const delay = GDELTConnector.RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(`GDELT rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${GDELTConnector.MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          throw new Error(`GDELT API error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const text = await response.text();
          if (attempt < GDELTConnector.MAX_RETRIES) {
            const delay = GDELTConnector.RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`GDELT returned non-JSON (likely throttled), retrying in ${delay}ms: ${text.slice(0, 120)}`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error(`GDELT API returned non-JSON response: ${text.slice(0, 200)}`);
        }

        const data = await response.json();
        return this.transformData(data);
      } catch (error) {
        if (attempt === GDELTConnector.MAX_RETRIES) {
          console.error('Error fetching GDELT data:', error);
          throw error;
        }
      }
    }

    throw new Error('GDELT API error: exhausted retries');
  }

  transformData(rawData: any): StandardizedData[] {
    if (!rawData.articles || !Array.isArray(rawData.articles)) {
      return [];
    }
    
    return rawData.articles.map((article: any) => ({
      id: `gdelt-${article.seen_date}-${Math.random().toString(36).substring(2, 9)}`,
      source: 'GDELT',
      content: article.title || '',
      author: article.seename || 'Unknown',
      timestamp: new Date(article.seen_date),
      metadata: {
        url: article.url,
        language: article.language,
        domain: article.domain,
        tone: article.tone,
        themes: article.themes ? article.themes.split(';') : [],
        locations: article.locations ? article.locations.split(';') : [],
        persons: article.persons ? article.persons.split(';') : [],
        organizations: article.organizations ? article.organizations.split(';') : []
      }
    }));
  }
}