import { BaseDataConnector, StandardizedData } from './base-connector';
import { GDELTConnector } from './gdelt-connector';
import { RedditConnector } from './reddit-connector';

export class ConnectorManager {
  private connectors: Map<string, BaseDataConnector> = new Map();

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
  }

  async fetchDataFromSource(source: string, query: string, options?: any): Promise<StandardizedData[]> {
    const connector = this.connectors.get(source);
    if (!connector) {
      throw new Error(`Connector for source '${source}' not found or not configured`);
    }
    
    return await connector.fetchData(query, options);
  }

  async fetchDataFromAllSources(query: string, options?: any): Promise<StandardizedData[]> {
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
    
    return results;
  }

  getAvailableSources(): string[] {
    return Array.from(this.connectors.keys());
  }
}