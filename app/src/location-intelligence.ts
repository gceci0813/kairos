import { IPGeolocationService } from './ip-geolocation';
import { ProfileLocationExtractor } from './bio-location-extractor';
import { LinguisticDialectAnalyzer } from './dialect-analyzer';
import { TimezoneInferenceService } from './timezone-inference';

export interface LocationIntelligenceResult {
  ipLocation?: any;
  bioLocations?: any[];
  dialectAnalysis?: any[];
  timezoneInference?: any[];
  consolidatedLocation: {
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
    city?: string;
    confidence: number;
    sources: string[];
  };
}

export class LocationIntelligenceService {
  private ipService: IPGeolocationService;
  private bioExtractor: ProfileLocationExtractor;
  private dialectAnalyzer: LinguisticDialectAnalyzer;
  private timezoneService: TimezoneInferenceService;
  
  constructor(ipApiKey?: string) {
    this.ipService = new IPGeolocationService(ipApiKey || '');
    this.bioExtractor = new ProfileLocationExtractor();
    this.dialectAnalyzer = new LinguisticDialectAnalyzer();
    this.timezoneService = new TimezoneInferenceService();
  }
  
  async analyzeLocation(data: {
    ip?: string;
    bio?: string;
    text?: string;
    activityHours?: number[];
  }): Promise<LocationIntelligenceResult> {
    const result: LocationIntelligenceResult = {
      consolidatedLocation: {
        confidence: 0,
        sources: []
      }
    };
    
    // IP geolocation
    if (data.ip) {
      try {
        result.ipLocation = await this.ipService.getLocationFromIP(data.ip);
      } catch (error) {
        console.error('IP geolocation failed:', error);
      }
    }
    
    // Bio location extraction
    if (data.bio) {
      result.bioLocations = this.bioExtractor.extractLocations(data.bio);
    }
    
    // Dialect analysis
    if (data.text) {
      result.dialectAnalysis = this.dialectAnalyzer.analyzeDialect(data.text);
    }
    
    // Timezone inference
    const locations = result.bioLocations?.map(loc => loc.text) || [];
    result.timezoneInference = this.timezoneService.inferTimezone(locations, data.activityHours || []);
    
    // Consolidate results
    result.consolidatedLocation = this.consolidateLocationData(result);
    
    return result;
  }
  
  private consolidateLocationData(result: LocationIntelligenceResult): any {
    const sources: string[] = [];
    let confidence = 0;
    let latitude, longitude, country, region, city;
    
    // Use IP location as primary source if available
    if (result.ipLocation && result.ipLocation.accuracy > 70) {
      latitude = result.ipLocation.latitude;
      longitude = result.ipLocation.longitude;
      country = result.ipLocation.country;
      region = result.ipLocation.region;
      city = result.ipLocation.city;
      confidence = result.ipLocation.accuracy;
      sources.push('IP Geolocation');
    }
    
    // Supplement with bio locations
    if (result.bioLocations && result.bioLocations.length > 0) {
      const topBioLocation = result.bioLocations[0];
      if (topBioLocation.confidence > 70) {
        if (!country) country = topBioLocation.text;
        sources.push('Bio Analysis');
        confidence = Math.max(confidence, topBioLocation.confidence);
      }
    }
    
    // Supplement with timezone inference
    if (result.timezoneInference && result.timezoneInference.length > 0) {
      const topTimezone = result.timezoneInference[0];
      if (topTimezone.confidence > 60) {
        sources.push('Timezone Inference');
        confidence = Math.max(confidence, topTimezone.confidence * 0.8);
      }
    }
    
    return {
      latitude,
      longitude,
      country,
      region,
      city,
      confidence,
      sources
    };
  }
}