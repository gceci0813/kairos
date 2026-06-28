// Place-name → centroid lookup for aggregate geographic mapping. Countries and
// major geopolitically-relevant cities only. This is a static gazetteer of
// PLACES — it contains no personal data and is used purely to position
// aggregate mention-counts on a map.

export interface GeoPoint {
  lat: number;
  lon: number;
  kind: 'country' | 'city';
  canonical: string;
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
  // Cities (major capitals / geopolitical hubs)
  moscow: { lat: 55.75, lon: 37.62, kind: 'city', canonical: 'Moscow' },
  kyiv: { lat: 50.45, lon: 30.52, kind: 'city', canonical: 'Kyiv' },
  kiev: { lat: 50.45, lon: 30.52, kind: 'city', canonical: 'Kyiv' },
  beijing: { lat: 39.9, lon: 116.4, kind: 'city', canonical: 'Beijing' },
  washington: { lat: 38.9, lon: -77.04, kind: 'city', canonical: 'Washington' },
  london: { lat: 51.5, lon: -0.13, kind: 'city', canonical: 'London' },
  paris: { lat: 48.86, lon: 2.35, kind: 'city', canonical: 'Paris' },
  tehran: { lat: 35.7, lon: 51.4, kind: 'city', canonical: 'Tehran' },
  'tel aviv': { lat: 32.08, lon: 34.78, kind: 'city', canonical: 'Tel Aviv' },
  jerusalem: { lat: 31.78, lon: 35.22, kind: 'city', canonical: 'Jerusalem' },
  baghdad: { lat: 33.3, lon: 44.4, kind: 'city', canonical: 'Baghdad' },
  damascus: { lat: 33.5, lon: 36.3, kind: 'city', canonical: 'Damascus' },
  beirut: { lat: 33.9, lon: 35.5, kind: 'city', canonical: 'Beirut' },
  rostov: { lat: 47.23, lon: 39.7, kind: 'city', canonical: 'Rostov' },
  volgograd: { lat: 48.7, lon: 44.5, kind: 'city', canonical: 'Volgograd' },
};

export function lookupPlace(name: string): GeoPoint | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  return GAZETTEER[key] ?? null;
}
