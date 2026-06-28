import { BaseDataConnector, StandardizedData } from './base-connector';

export class YouTubeConnector extends BaseDataConnector {
  constructor(apiKey: string) {
    super(apiKey, {
      requestsPerSecond: 1,
      requestsPerHour: 100, // conservative slice of the 10k units/day quota
    });
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    await this.waitForRateLimit();

    try {
      const maxResults = options?.maxResults ?? 25;
      const searchParams = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        order: 'date',
        maxResults: String(maxResults),
        key: this.apiKey,
      });

      const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);

      if (!searchResponse.ok) {
        const body = await searchResponse.text();
        throw new Error(`YouTube API error: ${searchResponse.status} ${searchResponse.statusText} — ${body.slice(0, 200)}`);
      }

      const searchData = await searchResponse.json();
      const videoResults = this.transformVideos(searchData);

      if (!options?.includeComments) {
        return videoResults;
      }

      const commentResults = await this.fetchTopComments(
        videoResults.map((v) => v.metadata.videoId).filter(Boolean),
        options?.maxCommentsPerVideo ?? 10
      );

      return [...videoResults, ...commentResults];
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      throw error;
    }
  }

  private async fetchTopComments(videoIds: string[], maxPerVideo: number): Promise<StandardizedData[]> {
    const results: StandardizedData[] = [];

    for (const videoId of videoIds) {
      await this.waitForRateLimit();
      try {
        const params = new URLSearchParams({
          part: 'snippet',
          videoId,
          maxResults: String(maxPerVideo),
          order: 'relevance',
          key: this.apiKey,
        });

        const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`);
        if (!response.ok) continue; // comments may be disabled on a given video — skip, don't fail the batch

        const data = await response.json();
        results.push(...this.transformComments(data, videoId));
      } catch (error) {
        console.error(`Error fetching comments for video ${videoId}:`, error);
      }
    }

    return results;
  }

  transformVideos(rawData: any): (StandardizedData & { metadata: { videoId: string } })[] {
    if (!rawData.items || !Array.isArray(rawData.items)) {
      return [];
    }

    return rawData.items.map((item: any) => ({
      id: `youtube-video-${item.id.videoId}`,
      source: 'YouTube',
      content: `${item.snippet.title}\n\n${item.snippet.description ?? ''}`.trim(),
      author: item.snippet.channelTitle,
      timestamp: new Date(item.snippet.publishedAt),
      metadata: {
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        videoId: item.id.videoId,
        channelId: item.snippet.channelId,
        type: 'video',
      },
    }));
  }

  transformComments(rawData: any, videoId: string): StandardizedData[] {
    if (!rawData.items || !Array.isArray(rawData.items)) {
      return [];
    }

    return rawData.items.map((item: any) => {
      const comment = item.snippet.topLevelComment.snippet;
      return {
        id: `youtube-comment-${item.id}`,
        source: 'YouTube',
        content: comment.textDisplay,
        author: comment.authorDisplayName,
        timestamp: new Date(comment.publishedAt),
        metadata: {
          url: `https://www.youtube.com/watch?v=${videoId}&lc=${item.id}`,
          videoId,
          likeCount: comment.likeCount,
          type: 'comment',
        },
      };
    });
  }

  // BaseDataConnector requires a single transformData — dispatch by shape.
  transformData(rawData: any): StandardizedData[] {
    return this.transformVideos(rawData);
  }
}
