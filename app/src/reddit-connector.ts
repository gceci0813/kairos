import { BaseDataConnector, StandardizedData } from './base-connector';

export class RedditConnector extends BaseDataConnector {
  constructor(clientId: string, clientSecret: string, userAgent: string) {
    super(`${clientId}:${clientSecret}`, {
      requestsPerSecond: 0.5,
      requestsPerHour: 60
    });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();
    
    try {
      const token = await this.getOAuthToken();
      const subreddit = options?.subreddit || 'worldnews';
      const url = `https://oauth.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=new&limit=25`;
      
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Kairos/1.0.0"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return this.transformData(data);
    } catch (error) {
      console.error('Error fetching Reddit data:', error);
      throw error;
    }
  }

  private async getOAuthToken(): Promise<string> {
    const credentials = Buffer.from(this.apiKey).toString('base64');
    
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: 'grant_type=client_credentials'
    });
    
    if (!response.ok) {
      throw new Error(`Reddit OAuth error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  }

  transformData(rawData: any): StandardizedData[] {
    if (!rawData.data || !rawData.data.children || !Array.isArray(rawData.data.children)) {
      return [];
    }
    
    return rawData.data.children.map((post: any) => {
      const postData = post.data;
      
      return {
        id: `reddit-${postData.id}`,
        source: 'Reddit',
        content: postData.title + (postData.selftext ? `\n\n${postData.selftext}` : ''),
        author: postData.author,
        timestamp: new Date(postData.created_utc * 1000),
        metadata: {
          url: `https://reddit.com${postData.permalink}`,
          subreddit: postData.subreddit,
          score: postData.score,
          num_comments: postData.num_comments,
          upvote_ratio: postData.upvote_ratio,
          flair: postData.link_flair_text,
          awards: postData.total_awards_received
        }
      };
    });
  }
}