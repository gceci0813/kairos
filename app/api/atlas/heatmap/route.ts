import { NextRequest, NextResponse } from 'next/server';
import { heatmapPoints, heatmapCSV } from '../../../src/heatmap';

export const maxDuration = 60;

// Heatmap export. ?days=30&query=&format=geojson|csv
export async function GET(request: NextRequest) {
  try {
    const p = new URL(request.url).searchParams;
    const days = Math.min(parseInt(p.get('days') || '30', 10) || 30, 365);
    const query = p.get('query') || null;
    const stamp = new Date().toISOString().slice(0, 10);

    if (p.get('format') === 'csv') {
      const csv = await heatmapCSV(query, days);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="atlas-heatmap-${stamp}.csv"`,
        },
      });
    }

    const geojson = await heatmapPoints(query, days);
    if (p.get('download') === 'true') {
      return new NextResponse(JSON.stringify(geojson, null, 2), {
        headers: {
          'Content-Type': 'application/geo+json',
          'Content-Disposition': `attachment; filename="atlas-heatmap-${stamp}.geojson"`,
        },
      });
    }
    return NextResponse.json(geojson);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Heatmap failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
