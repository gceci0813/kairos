import { NextRequest, NextResponse } from 'next/server';

// Define proper types
interface LocationData {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  confidence: number;
}

interface IpLocationData extends LocationData {
  ip: string;
  timezone: string;
}

interface TextLocationData extends LocationData {
  keyword: string;
}

interface TimezoneData {
  timezone: string;
  confidence: number;
}

interface LocationWithSource {
  source: string;
  weight: number;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  confidence: number;
}

// Real IP geolocation using ipapi.com (free tier)
async function getIpLocation(ip: string): Promise<IpLocationData | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      ip,
      country: data.country_name || 'Unknown',
      region: data.region || data.region_name || 'Unknown',
      city: data.city || 'Unknown',
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || 'Unknown',
      confidence: 0.85
    };
  } catch (error) {
    console.error('IP location error:', error);
    return null;
  }
}

// Real text analysis for location indicators
function extractLocationFromText(text: string): TextLocationData[] | null {
  const locationKeywords = {
    'new york': { city: 'New York', region: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    'nyc': { city: 'New York', region: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    'los angeles': { city: 'Los Angeles', region: 'California', country: 'United States', lat: 34.0522, lng: -118.2437 },
    'la': { city: 'Los Angeles', region: 'California', country: 'United States', lat: 34.0522, lng: -118.2437 },
    'chicago': { city: 'Chicago', region: 'Illinois', country: 'United States', lat: 41.8781, lng: -87.6298 },
    'houston': { city: 'Houston', region: 'Texas', country: 'United States', lat: 29.7604, lng: -95.3698 },
    'philadelphia': { city: 'Philadelphia', region: 'Pennsylvania', country: 'United States', lat: 39.9526, lng: -75.1652 },
    'phoenix': { city: 'Phoenix', region: 'Arizona', country: 'United States', lat: 33.4484, lng: -112.0740 },
    'san antonio': { city: 'San Antonio', region: 'Texas', country: 'United States', lat: 29.4241, lng: -98.4936 },
    'san diego': { city: 'San Diego', region: 'California', country: 'United States', lat: 32.7157, lng: -117.1611 },
    'dallas': { city: 'Dallas', region: 'Texas', country: 'United States', lat: 32.7767, lng: -96.7970 },
    'san jose': { city: 'San Jose', region: 'California', country: 'United States', lat: 37.3382, lng: -121.8863 },
    'austin': { city: 'Austin', region: 'Texas', country: 'United States', lat: 30.2672, lng: -97.7431 },
    'jacksonville': { city: 'Jacksonville', region: 'Florida', country: 'United States', lat: 30.3322, lng: -81.6557 },
    'fort worth': { city: 'Fort Worth', region: 'Texas', country: 'United States', lat: 32.7555, lng: -97.3308 },
    'columbus': { city: 'Columbus', region: 'Ohio', country: 'United States', lat: 39.9612, lng: -82.9988 },
    'charlotte': { city: 'Charlotte', region: 'North Carolina', country: 'United States', lat: 35.2271, lng: -80.8431 },
    'san francisco': { city: 'San Francisco', region: 'California', country: 'United States', lat: 37.7749, lng: -122.4194 },
    'sf': { city: 'San Francisco', region: 'California', country: 'United States', lat: 37.7749, lng: -122.4194 },
    'seattle': { city: 'Seattle', region: 'Washington', country: 'United States', lat: 47.6062, lng: -122.3321 },
    'denver': { city: 'Denver', region: 'Colorado', country: 'United States', lat: 39.7392, lng: -104.9903 },
    'washington': { city: 'Washington', region: 'District of Columbia', country: 'United States', lat: 38.9072, lng: -77.0369 },
    'dc': { city: 'Washington', region: 'District of Columbia', country: 'United States', lat: 38.9072, lng: -77.0369 },
    'boston': { city: 'Boston', region: 'Massachusetts', country: 'United States', lat: 42.3601, lng: -71.0589 },
    'miami': { city: 'Miami', region: 'Florida', country: 'United States', lat: 25.7617, lng: -80.1918 },
    'atlanta': { city: 'Atlanta', region: 'Georgia', country: 'United States', lat: 33.7490, lng: -84.3880 },
    'london': { city: 'London', region: 'England', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    'paris': { city: 'Paris', region: 'Île-de-France', country: 'France', lat: 48.8566, lng: 2.3522 },
    'tokyo': { city: 'Tokyo', region: 'Kanto', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    'sydney': { city: 'Sydney', region: 'New South Wales', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    'toronto': { city: 'Toronto', region: 'Ontario', country: 'Canada', lat: 43.6532, lng: -79.3832 },
    'berlin': { city: 'Berlin', region: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    'rome': { city: 'Rome', region: 'Lazio', country: 'Italy', lat: 41.9028, lng: 12.4964 },
    'madrid': { city: 'Madrid', region: 'Community of Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
    'amsterdam': { city: 'Amsterdam', region: 'North Holland', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    'barcelona': { city: 'Barcelona', region: 'Catalonia', country: 'Spain', lat: 41.3851, lng: 2.1734 },
    'dubai': { city: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 },
    'singapore': { city: 'Singapore', region: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    'hong kong': { city: 'Hong Kong', region: 'Hong Kong', country: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    'mumbai': { city: 'Mumbai', region: 'Maharashtra', country: 'India', lat: 19.0760, lng: 72.8777 },
    'delhi': { city: 'Delhi', region: 'Delhi', country: 'India', lat: 28.7041, lng: 77.1025 },
    'bangkok': { city: 'Bangkok', region: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
    'moscow': { city: 'Moscow', region: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
    'istanbul': { city: 'Istanbul', region: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
    'beijing': { city: 'Beijing', region: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
    'shanghai': { city: 'Shanghai', region: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 }
  };

  const lowerText = text.toLowerCase();
  let matches: TextLocationData[] = [];

  for (const [keyword, location] of Object.entries(locationKeywords)) {
    if (lowerText.includes(keyword)) {
      matches.push({
        keyword,
        city: location.city,
        region: location.region,
        country: location.country,
        latitude: location.lat,
        longitude: location.lng,
        confidence: 0.7
      });
    }
  }

  return matches.length > 0 ? matches : null;
}

// Real timezone inference from activity hours
function inferTimezone(activityHours: string): TimezoneData | null {
  const parts = activityHours.split('-');
  if (parts.length !== 2) return null;
  
  const start = parseInt(parts[0].trim());
  const end = parseInt(parts[1].trim());
  
  if (isNaN(start) || isNaN(end)) return null;

  // Map activity hours to likely timezones
  const hourToTimezone: {[key: number]: string} = {
    9: 'America/New_York', // 9 AM EST = 2 PM UTC
    10: 'America/Chicago', // 10 AM CST = 4 PM UTC
    11: 'America/Denver', // 11 AM MST = 6 PM UTC
    12: 'America/Los_Angeles', // 12 PM PST = 8 PM UTC
    13: 'Pacific/Auckland', // 1 PM NZST = 1 AM UTC
    14: 'Australia/Sydney', // 2 PM AEST = 4 AM UTC
    15: 'Asia/Tokyo', // 3 PM JST = 6 AM UTC
    16: 'Asia/Shanghai', // 4 PM CST = 8 AM UTC
    17: 'Asia/Dubai', // 5 PM GST = 1 PM UTC
    18: 'Europe/London', // 6 PM GMT = 6 PM UTC
    19: 'Europe/Paris', // 7 PM CET = 6 PM UTC
    20: 'Europe/Moscow', // 8 PM MSK = 5 PM UTC
  };

  return {
    timezone: hourToTimezone[start] || 'Unknown',
    confidence: 0.6
  };
}

export async function POST(request: NextRequest) {
  try {
    const { ip, bio, text, activityHours } = await request.json();
    
    const results = {
      ipLocation: ip ? await getIpLocation(ip) : null,
      bioLocation: bio ? extractLocationFromText(bio) : null,
      textLocation: text ? extractLocationFromText(text) : null,
      timezoneInference: activityHours ? inferTimezone(activityHours) : null,
    };

    // Consolidate results with weighted confidence
    const allLocations: LocationWithSource[] = [];
    
    if (results.ipLocation) {
      allLocations.push({
        ...results.ipLocation,
        source: 'IP',
        weight: 0.4
      });
    }
    
    if (results.bioLocation && results.bioLocation.length > 0) {
      results.bioLocation.forEach((location: TextLocationData) => {
        allLocations.push({
          ...location,
          source: 'Bio',
          weight: 0.3
        });
      });
    }
    
    if (results.textLocation && results.textLocation.length > 0) {
      results.textLocation.forEach((location: TextLocationData) => {
        allLocations.push({
          ...location,
          source: 'Text',
          weight: 0.2
        });
      });
    }
    
    if (results.timezoneInference) {
      allLocations.push({
        ...results.timezoneInference,
        source: 'Timezone',
        weight: 0.1
      });
    }

    // Calculate most likely location
    let consolidated = null;
    if (allLocations.length > 0) {
      // Group by city and sum weights
      const locationGroups: {[key: string]: any} = {};
      allLocations.forEach(loc => {
        const key = `${loc.city || 'Unknown'}, ${loc.region || 'Unknown'}`;
        if (!locationGroups[key]) {
          locationGroups[key] = {
            city: loc.city,
            region: loc.region,
            country: loc.country,
            latitude: loc.latitude,
            longitude: loc.longitude,
            sources: [],
            totalWeight: 0,
            totalConfidence: 0
          };
        }
        locationGroups[key].sources.push(loc.source);
        locationGroups[key].totalWeight += loc.weight;
        locationGroups[key].totalConfidence += loc.confidence * loc.weight;
      });
      
      // Find the location with highest total weight
      const bestLocation = Object.values(locationGroups).reduce((best: any, current: any) => 
        current.totalWeight > best.totalWeight ? current : best
      );
      
      consolidated = {
        location: `${bestLocation.city}, ${bestLocation.region}`,
        latitude: bestLocation.latitude,
        longitude: bestLocation.longitude,
        confidence: Math.min(0.95, bestLocation.totalConfidence / bestLocation.totalWeight),
        sources: bestLocation.sources
      };
    }

    return NextResponse.json({
      ...results,
      consolidated
    });
  } catch (error) {
    console.error('Location analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze location' },
      { status: 500 }
    );
  }
}