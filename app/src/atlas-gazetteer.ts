// Place-name → centroid lookup for aggregate geographic mapping. Countries and
// major geopolitically-relevant cities only. This is a static gazetteer of
// PLACES — it contains no personal data and is used purely to position
// aggregate mention-counts on a map.

export interface GeoPoint {
  lat: number;
  lon: number;
  kind: 'country' | 'city';
  canonical: string;
  // For cities: the country they roll up to (canonical country name). Lets
  // city mentions aggregate to country level when requested.
  country?: string;
}

// Keyed by lowercased name / common alias.
export const GAZETTEER: Record<string, GeoPoint> = {
  // Countries
  'united states': { lat: 39.8, lon: -98.6, kind: 'country', canonical: 'United States' },
  usa: { lat: 39.8, lon: -98.6, kind: 'country', canonical: 'United States' },
  america: { lat: 39.8, lon: -98.6, kind: 'country', canonical: 'United States' },
  russia: { lat: 61.5, lon: 105.3, kind: 'country', canonical: 'Russia' },
  ukraine: { lat: 48.4, lon: 31.2, kind: 'country', canonical: 'Ukraine' },
  china: { lat: 35.9, lon: 104.2, kind: 'country', canonical: 'China' },
  israel: { lat: 31.0, lon: 34.8, kind: 'country', canonical: 'Israel' },
  palestine: { lat: 31.9, lon: 35.2, kind: 'country', canonical: 'Palestine' },
  gaza: { lat: 31.5, lon: 34.45, kind: 'city', canonical: 'Gaza' },
  iran: { lat: 32.4, lon: 53.7, kind: 'country', canonical: 'Iran' },
  iraq: { lat: 33.2, lon: 43.7, kind: 'country', canonical: 'Iraq' },
  syria: { lat: 34.8, lon: 38.997, kind: 'country', canonical: 'Syria' },
  lebanon: { lat: 33.85, lon: 35.86, kind: 'country', canonical: 'Lebanon' },
  yemen: { lat: 15.55, lon: 48.5, kind: 'country', canonical: 'Yemen' },
  'saudi arabia': { lat: 23.9, lon: 45.1, kind: 'country', canonical: 'Saudi Arabia' },
  turkey: { lat: 38.96, lon: 35.24, kind: 'country', canonical: 'Turkey' },
  'united kingdom': { lat: 55.4, lon: -3.4, kind: 'country', canonical: 'United Kingdom' },
  uk: { lat: 55.4, lon: -3.4, kind: 'country', canonical: 'United Kingdom' },
  britain: { lat: 55.4, lon: -3.4, kind: 'country', canonical: 'United Kingdom' },
  france: { lat: 46.2, lon: 2.2, kind: 'country', canonical: 'France' },
  germany: { lat: 51.2, lon: 10.4, kind: 'country', canonical: 'Germany' },
  italy: { lat: 41.9, lon: 12.6, kind: 'country', canonical: 'Italy' },
  spain: { lat: 40.5, lon: -3.7, kind: 'country', canonical: 'Spain' },
  poland: { lat: 51.9, lon: 19.1, kind: 'country', canonical: 'Poland' },
  india: { lat: 20.6, lon: 79.0, kind: 'country', canonical: 'India' },
  pakistan: { lat: 30.4, lon: 69.3, kind: 'country', canonical: 'Pakistan' },
  afghanistan: { lat: 33.9, lon: 67.7, kind: 'country', canonical: 'Afghanistan' },
  'north korea': { lat: 40.3, lon: 127.5, kind: 'country', canonical: 'North Korea' },
  'south korea': { lat: 35.9, lon: 127.8, kind: 'country', canonical: 'South Korea' },
  japan: { lat: 36.2, lon: 138.3, kind: 'country', canonical: 'Japan' },
  taiwan: { lat: 23.7, lon: 121.0, kind: 'country', canonical: 'Taiwan' },
  egypt: { lat: 26.8, lon: 30.8, kind: 'country', canonical: 'Egypt' },
  libya: { lat: 26.3, lon: 17.2, kind: 'country', canonical: 'Libya' },
  sudan: { lat: 12.9, lon: 30.2, kind: 'country', canonical: 'Sudan' },
  ethiopia: { lat: 9.1, lon: 40.5, kind: 'country', canonical: 'Ethiopia' },
  nigeria: { lat: 9.1, lon: 8.7, kind: 'country', canonical: 'Nigeria' },
  'south africa': { lat: -30.6, lon: 22.9, kind: 'country', canonical: 'South Africa' },
  venezuela: { lat: 6.4, lon: -66.6, kind: 'country', canonical: 'Venezuela' },
  brazil: { lat: -14.2, lon: -51.9, kind: 'country', canonical: 'Brazil' },
  mexico: { lat: 23.6, lon: -102.6, kind: 'country', canonical: 'Mexico' },
  // Additional countries
  canada: { lat: 56.1, lon: -106.3, kind: 'country', canonical: 'Canada' },
  australia: { lat: -25.3, lon: 133.8, kind: 'country', canonical: 'Australia' },
  argentina: { lat: -38.4, lon: -63.6, kind: 'country', canonical: 'Argentina' },
  colombia: { lat: 4.6, lon: -74.3, kind: 'country', canonical: 'Colombia' },
  netherlands: { lat: 52.1, lon: 5.3, kind: 'country', canonical: 'Netherlands' },
  belgium: { lat: 50.5, lon: 4.5, kind: 'country', canonical: 'Belgium' },
  sweden: { lat: 60.1, lon: 18.6, kind: 'country', canonical: 'Sweden' },
  norway: { lat: 60.5, lon: 8.5, kind: 'country', canonical: 'Norway' },
  finland: { lat: 61.9, lon: 25.7, kind: 'country', canonical: 'Finland' },
  greece: { lat: 39.1, lon: 21.8, kind: 'country', canonical: 'Greece' },
  romania: { lat: 45.9, lon: 25.0, kind: 'country', canonical: 'Romania' },
  hungary: { lat: 47.2, lon: 19.5, kind: 'country', canonical: 'Hungary' },
  belarus: { lat: 53.7, lon: 27.95, kind: 'country', canonical: 'Belarus' },
  georgia: { lat: 42.3, lon: 43.4, kind: 'country', canonical: 'Georgia' },
  armenia: { lat: 40.1, lon: 45.0, kind: 'country', canonical: 'Armenia' },
  azerbaijan: { lat: 40.1, lon: 47.6, kind: 'country', canonical: 'Azerbaijan' },
  kazakhstan: { lat: 48.0, lon: 66.9, kind: 'country', canonical: 'Kazakhstan' },
  qatar: { lat: 25.4, lon: 51.2, kind: 'country', canonical: 'Qatar' },
  'united arab emirates': { lat: 23.4, lon: 53.8, kind: 'country', canonical: 'United Arab Emirates' },
  uae: { lat: 23.4, lon: 53.8, kind: 'country', canonical: 'United Arab Emirates' },
  jordan: { lat: 30.6, lon: 36.2, kind: 'country', canonical: 'Jordan' },
  kuwait: { lat: 29.3, lon: 47.5, kind: 'country', canonical: 'Kuwait' },
  bahrain: { lat: 26.0, lon: 50.6, kind: 'country', canonical: 'Bahrain' },
  oman: { lat: 21.5, lon: 55.9, kind: 'country', canonical: 'Oman' },
  somalia: { lat: 5.2, lon: 46.2, kind: 'country', canonical: 'Somalia' },
  kenya: { lat: -0.0, lon: 37.9, kind: 'country', canonical: 'Kenya' },
  morocco: { lat: 31.8, lon: -7.1, kind: 'country', canonical: 'Morocco' },
  algeria: { lat: 28.0, lon: 1.7, kind: 'country', canonical: 'Algeria' },
  tunisia: { lat: 33.9, lon: 9.5, kind: 'country', canonical: 'Tunisia' },
  mali: { lat: 17.6, lon: -4.0, kind: 'country', canonical: 'Mali' },
  myanmar: { lat: 21.9, lon: 95.96, kind: 'country', canonical: 'Myanmar' },
  bangladesh: { lat: 23.7, lon: 90.4, kind: 'country', canonical: 'Bangladesh' },
  indonesia: { lat: -0.8, lon: 113.9, kind: 'country', canonical: 'Indonesia' },
  philippines: { lat: 12.9, lon: 121.8, kind: 'country', canonical: 'Philippines' },
  vietnam: { lat: 14.1, lon: 108.3, kind: 'country', canonical: 'Vietnam' },
  thailand: { lat: 15.9, lon: 100.99, kind: 'country', canonical: 'Thailand' },

  // Cities (major capitals / geopolitical hubs) — with country rollup
  moscow: { lat: 55.75, lon: 37.62, kind: 'city', canonical: 'Moscow', country: 'Russia' },
  'saint petersburg': { lat: 59.93, lon: 30.34, kind: 'city', canonical: 'Saint Petersburg', country: 'Russia' },
  kyiv: { lat: 50.45, lon: 30.52, kind: 'city', canonical: 'Kyiv', country: 'Ukraine' },
  kiev: { lat: 50.45, lon: 30.52, kind: 'city', canonical: 'Kyiv', country: 'Ukraine' },
  kharkiv: { lat: 49.99, lon: 36.23, kind: 'city', canonical: 'Kharkiv', country: 'Ukraine' },
  odesa: { lat: 46.48, lon: 30.72, kind: 'city', canonical: 'Odesa', country: 'Ukraine' },
  beijing: { lat: 39.9, lon: 116.4, kind: 'city', canonical: 'Beijing', country: 'China' },
  shanghai: { lat: 31.23, lon: 121.47, kind: 'city', canonical: 'Shanghai', country: 'China' },
  washington: { lat: 38.9, lon: -77.04, kind: 'city', canonical: 'Washington', country: 'United States' },
  'new york': { lat: 40.71, lon: -74.0, kind: 'city', canonical: 'New York', country: 'United States' },
  london: { lat: 51.5, lon: -0.13, kind: 'city', canonical: 'London', country: 'United Kingdom' },
  paris: { lat: 48.86, lon: 2.35, kind: 'city', canonical: 'Paris', country: 'France' },
  berlin: { lat: 52.52, lon: 13.4, kind: 'city', canonical: 'Berlin', country: 'Germany' },
  brussels: { lat: 50.85, lon: 4.35, kind: 'city', canonical: 'Brussels', country: 'Belgium' },
  tehran: { lat: 35.7, lon: 51.4, kind: 'city', canonical: 'Tehran', country: 'Iran' },
  'tel aviv': { lat: 32.08, lon: 34.78, kind: 'city', canonical: 'Tel Aviv', country: 'Israel' },
  jerusalem: { lat: 31.78, lon: 35.22, kind: 'city', canonical: 'Jerusalem', country: 'Israel' },
  baghdad: { lat: 33.3, lon: 44.4, kind: 'city', canonical: 'Baghdad', country: 'Iraq' },
  damascus: { lat: 33.5, lon: 36.3, kind: 'city', canonical: 'Damascus', country: 'Syria' },
  aleppo: { lat: 36.2, lon: 37.13, kind: 'city', canonical: 'Aleppo', country: 'Syria' },
  beirut: { lat: 33.9, lon: 35.5, kind: 'city', canonical: 'Beirut', country: 'Lebanon' },
  rostov: { lat: 47.23, lon: 39.7, kind: 'city', canonical: 'Rostov', country: 'Russia' },
  volgograd: { lat: 48.7, lon: 44.5, kind: 'city', canonical: 'Volgograd', country: 'Russia' },
  ankara: { lat: 39.93, lon: 32.86, kind: 'city', canonical: 'Ankara', country: 'Turkey' },
  istanbul: { lat: 41.01, lon: 28.98, kind: 'city', canonical: 'Istanbul', country: 'Turkey' },
  cairo: { lat: 30.04, lon: 31.24, kind: 'city', canonical: 'Cairo', country: 'Egypt' },
  riyadh: { lat: 24.71, lon: 46.68, kind: 'city', canonical: 'Riyadh', country: 'Saudi Arabia' },
  dubai: { lat: 25.2, lon: 55.27, kind: 'city', canonical: 'Dubai', country: 'United Arab Emirates' },
  doha: { lat: 25.29, lon: 51.53, kind: 'city', canonical: 'Doha', country: 'Qatar' },
  'sanaa': { lat: 15.37, lon: 44.19, kind: 'city', canonical: 'Sanaa', country: 'Yemen' },
  tripoli: { lat: 32.89, lon: 13.19, kind: 'city', canonical: 'Tripoli', country: 'Libya' },
  khartoum: { lat: 15.5, lon: 32.56, kind: 'city', canonical: 'Khartoum', country: 'Sudan' },
  kabul: { lat: 34.56, lon: 69.21, kind: 'city', canonical: 'Kabul', country: 'Afghanistan' },
  islamabad: { lat: 33.69, lon: 73.06, kind: 'city', canonical: 'Islamabad', country: 'Pakistan' },
  'new delhi': { lat: 28.61, lon: 77.21, kind: 'city', canonical: 'New Delhi', country: 'India' },
  caracas: { lat: 10.48, lon: -66.9, kind: 'city', canonical: 'Caracas', country: 'Venezuela' },
  pyongyang: { lat: 39.04, lon: 125.76, kind: 'city', canonical: 'Pyongyang', country: 'North Korea' },
  taipei: { lat: 25.03, lon: 121.57, kind: 'city', canonical: 'Taipei', country: 'Taiwan' },
};

export function lookupPlace(name: string): GeoPoint | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return GAZETTEER[key] ?? null;
}
