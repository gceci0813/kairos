import { geographicDensity } from './atlas-geo';

// Heatmap/density exports for reporting. Builds a weighted point set (for
// heatmap layers) and tabular CSV from ATLAS density. Aggregate place counts.

export async function heatmapPoints(query: string | null, sinceDays: number) {
  const features = await geographicDensity(query, sinceDays, 'all');
  const maxMentions = Math.max(1, ...features.map((f) => f.mentions));
  return {
    type: 'FeatureCollection' as const,
    features: features.map((f) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [f.lon, f.lat] },
      properties: {
        place: f.place,
        mentions: f.mentions,
        weight: Number((f.mentions / maxMentions).toFixed(3)), // 0-1 for heatmap intensity
        avgSentiment: Number(f.avgSentiment.toFixed(3)),
        topics: f.topics,
      },
    })),
  };
}

export async function heatmapCSV(query: string | null, sinceDays: number): Promise<string> {
  const features = await geographicDensity(query, sinceDays, 'all');
  const rows = [['place', 'lat', 'lon', 'mentions', 'avg_sentiment', 'top_topics']];
  for (const f of features) {
    rows.push([
      `"${f.place.replace(/"/g, '""')}"`,
      String(f.lat),
      String(f.lon),
      String(f.mentions),
      f.avgSentiment.toFixed(3),
      `"${f.topics.join('; ').replace(/"/g, '""')}"`,
    ]);
  }
  return rows.map((r) => r.join(',')).join('\n');
}
