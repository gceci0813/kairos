import { NextRequest, NextResponse } from 'next/server';
import { GeoLevel, geographicDensity, toGeoJSON } from '../../../src/atlas-geo';

export const maxDuration = 60;

// Aggregate geographic density as GeoJSON. Keyed on place names and narratives
// from the findings corpus — no individual data. Query params:
//   ?query=<narrative/topic filter>  ?days=<lookback window, default 30>
//   ?format=geojson|features
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const query = params.get('query');
    const days = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
    const levelParam = params.get('level');
    const level: GeoLevel = levelParam === 'country' || levelParam === 'city' ? levelParam : 'all';
    const features = await geographicDensity(query, days, level);

    if (params.get('format') === 'features') {
      return NextResponse.json({ features });
    }
    return NextResponse.json(toGeoJSON(features));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ATLAS geojson failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
