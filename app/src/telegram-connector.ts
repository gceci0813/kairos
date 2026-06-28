import * as cheerio from 'cheerio';
import { BaseDataConnector, StandardizedData } from './base-connector';

// Telegram's Bot API has no search-across-public-channels endpoint, so this
// connector reads the public web preview (t.me/s/<channel>) for a configured
// list of public channels and filters client-side by query. This only sees
// content from channels you've explicitly listed, not arbitrary search.
export class TelegramConnector extends BaseDataConnector {
  private channels: string[];

  constructor(channels: string[]) {
    // No real API key needed for the public preview path; apiKey kept empty
    // to satisfy BaseDataConnector's constructor shape.
    super('', {
      requestsPerSecond: 1,
      requestsPerHour: 200,
    });
    this.channels = channels;
  }

  async fetchData(query: string, options?: any): Promise<StandardizedData[]> {
    const results: StandardizedData[] = [];
    const lowerQuery = query.toLowerCase();

    for (const channel of this.channels) {
      await this.waitForRateLimit();
      try {
        const response = await fetch(`https://t.me/s/${encodeURIComponent(channel)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });

        if (!response.ok) {
          console.warn(`Telegram preview unavailable for channel "${channel}": ${response.status}`);
          continue;
        }

        const html = await response.text();
        const messages = this.transformData(html, channel);
        results.push(...messages.filter((m) => m.content.toLowerCase().includes(lowerQuery)));
      } catch (error) {
        console.error(`Error fetching Telegram channel "${channel}":`, error);
      }
    }

    return results;
  }

  transformData(html: string, channel?: string): StandardizedData[] {
    const $ = cheerio.load(html);
    const results: StandardizedData[] = [];

    $('.tgme_widget_message').each((_, el) => {
      const $el = $(el);
      const postId = $el.attr('data-post');
      const text = $el.find('.tgme_widget_message_text').text().trim();
      const timeAttr = $el.find('.tgme_widget_message_date time').attr('datetime');

      if (!text || !postId) return;

      results.push({
        id: `telegram-${postId}`,
        source: 'Telegram',
        content: text,
        author: channel ?? postId.split('/')[0],
        timestamp: timeAttr ? new Date(timeAttr) : new Date(),
        metadata: {
          url: `https://t.me/${postId}`,
          channel,
        },
      });
    });

    return results;
  }
}
