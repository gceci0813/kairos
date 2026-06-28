interface TimezoneInference {
  timezone: string;
  region: string;
  confidence: number;
  reasoning: string;
}

export class TimezoneInferenceService {
  private timezoneRegions: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeTimezoneRegions();
  }
  
  private initializeTimezoneRegions(): void {
    this.timezoneRegions.set('EST', ['New York', 'Toronto', 'Montreal', 'Boston', 'Washington']);
    this.timezoneRegions.set('PST', ['Los Angeles', 'San Francisco', 'Seattle', 'Vancouver']);
    this.timezoneRegions.set('GMT', ['London', 'Dublin', 'Lisbon', 'Edinburgh']);
    this.timezoneRegions.set('CET', ['Paris', 'Berlin', 'Rome', 'Madrid', 'Amsterdam']);
  }
  
  inferTimezone(locations: string[], activityHours: number[] = []): TimezoneInference[] {
    const inferences: TimezoneInference[] = [];
    
    for (const [timezone, regions] of this.timezoneRegions) {
      const matches = locations.filter(location => 
        regions.some(region => location.toLowerCase().includes(region.toLowerCase()))
      );
      
      if (matches.length > 0) {
        inferences.push({
          timezone,
          region: regions[0],
          confidence: matches.length / regions.length,
          reasoning: `Location mentions: ${matches.join(', ')}`
        });
      }
    }
    
    if (activityHours.length > 0) {
      const peakHour = this.findPeakActivityHour(activityHours);
      const timezoneFromActivity = this.getTimezoneFromPeakHour(peakHour);
      
      if (timezoneFromActivity) {
        inferences.push({
          timezone: timezoneFromActivity,
          region: 'Inferred from activity patterns',
          confidence: 0.6,
          reasoning: `Peak activity at hour ${peakHour} suggests ${timezoneFromActivity} timezone`
        });
      }
    }
    
    return inferences.sort((a, b) => b.confidence - a.confidence);
  }
  
  private findPeakActivityHour(hours: number[]): number {
    const hourCounts = new Map<number, number>();
    
    hours.forEach(hour => {
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    let peakHour = 0;
    let maxCount = 0;
    
    for (const [hour, count] of hourCounts) {
      if (count > maxCount) {
        maxCount = count;
        peakHour = hour;
      }
    }
    
    return peakHour;
  }
  
  private getTimezoneFromPeakHour(peakHour: number): string | null {
    if (peakHour >= 9 && peakHour <= 17) return 'EST';
    if (peakHour >= 18 && peakHour <= 22) return 'PST';
    if (peakHour >= 6 && peakHour <= 10) return 'GMT';
    
    return null;
  }
}