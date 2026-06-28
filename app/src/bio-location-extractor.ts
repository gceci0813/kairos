interface LocationMention {
  text: string;
  confidence: number;
  type: 'city' | 'country' | 'region' | 'timezone' | 'language';
}

export class ProfileLocationExtractor {
  private locationKeywords: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeLocationKeywords();
  }
  
  private initializeLocationKeywords(): void {
    this.locationKeywords.set('country', [
      'USA', 'US', 'United States', 'UK', 'Canada', 'Australia', 
      'Germany', 'France', 'Spain', 'Italy', 'Russia', 'China', 'Japan',
      'India', 'Brazil', 'Mexico', 'Argentina', 'Egypt', 'South Africa'
    ]);
    
    this.locationKeywords.set('city', [
      'New York', 'Los Angeles', 'London', 'Paris', 'Tokyo', 'Beijing',
      'Moscow', 'Mumbai', 'Sydney', 'Toronto', 'Berlin', 'Madrid'
    ]);
    
    this.locationKeywords.set('timezone', [
      'EST', 'PST', 'CST', 'MST', 'GMT', 'CET', 'IST', 'JST', 'AEST'
    ]);
    
    this.locationKeywords.set('language', [
      'English', 'Spanish', 'French', 'German', 'Russian', 'Arabic',
      'Chinese', 'Japanese', 'Hindi', 'Portuguese'
    ]);
  }
  
  extractLocations(bio: string): LocationMention[] {
    const mentions: LocationMention[] = [];
    const bioLower = bio.toLowerCase();
    
    for (const [type, keywords] of this.locationKeywords) {
      for (const keyword of keywords) {
        if (bioLower.includes(keyword.toLowerCase())) {
          mentions.push({
            text: keyword,
            confidence: this.calculateConfidence(keyword, type, bioLower),
            type: type as any
          });
        }
      }
    }
    
    return mentions.sort((a, b) => b.confidence - a.confidence);
  }
  
  private calculateConfidence(keyword: string, type: string, bio: string): number {
    let confidence = 50;
    
    if (bio.includes(` ${keyword} `)) {
      confidence += 20;
    }
    
    if (type === 'city') confidence += 15;
    if (type === 'country') confidence += 10;
    
    return Math.min(confidence, 100);
  }
}