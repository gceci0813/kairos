export interface StandardizedData {
  id: string;
  source: string;
  content: string;
  author: string;
  timestamp: Date;
  metadata: Record<string, any>;
  location?: {
    latitude: number;
    longitude: number;
    confidence: number;
  };
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerHour: number;
}

export abstract class BaseDataConnector {
  protected apiKey: string;
  protected rateLimitConfig: RateLimitConfig;
  protected lastRequestTime: number = 0;
  protected requestCount: number = 0;
  protected requestCountResetTime: number = Date.now() + (60 * 60 * 1000);

  constructor(apiKey: string, rateLimitConfig: RateLimitConfig) {
    this.apiKey = apiKey;
    this.rateLimitConfig = rateLimitConfig;
  }

  protected async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = 1000 / this.rateLimitConfig.requestsPerSecond;
    
    if (now > this.requestCountResetTime) {
      this.requestCount = 0;
      this.requestCountResetTime = now + (60 * 60 * 1000);
    }
    
    if (this.requestCount >= this.rateLimitConfig.requestsPerHour) {
      const timeToReset = this.requestCountResetTime - now;
      await new Promise(resolve => setTimeout(resolve, timeToReset));
      this.requestCount = 0;
    }
    
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      await new Promise(resolve => setTimeout(resolve, minTimeBetweenRequests - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  abstract fetchData(query: string, options?: any): Promise<StandardizedData[]>;
  abstract transformData(rawData: any): StandardizedData[];
}