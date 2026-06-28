interface IPGeolocationResult {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  asn: string;
  timezone: string;
  accuracy: number;
}

export class IPGeolocationService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getLocationFromIP(ip: string): Promise<IPGeolocationResult> {
    try {
      const response = await fetch(`https://api.ipapi.com/${ip}?access_key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`IP geolocation failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        ip: data.ip,
        country: data.country_name,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.connection.isp,
        asn: data.connection.asn,
        timezone: data.timezone,
        accuracy: this.calculateAccuracy(data)
      };
    } catch (error) {
      console.error('Error getting IP location:', error);
      throw error;
    }
  }
  
  private calculateAccuracy(data: any): number {
    let score = 0;
    if (data.country_name) score += 30;
    if (data.region) score += 20;
    if (data.city) score += 25;
    if (data.latitude && data.longitude) score += 25;
    
    return Math.min(score, 100);
  }
}