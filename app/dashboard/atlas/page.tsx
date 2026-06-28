'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface Feature {
  place: string;
  lat: number;
  lon: number;
  kind: string;
  mentions: number;
  avgSentiment: number;
  topics: string[];
}

function sentimentColor(s: number): string {
  if (s <= -0.3) return '#EF4444';
  if (s >= 0.3) return '#10B981';
  return '#F59E0B';
}

export default function AtlasPage() {
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(30);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ format: 'features', days: String(days) });
      if (query.trim()) params.set('query', query.trim());
      const res = await fetch(`/api/atlas/geojson?${params}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setFeatures(data.features || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [query, days]);

  useEffect(() => {
    load();
  }, [load]);

  const maxMentions = Math.max(1, ...features.map((f) => f.mentions));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">ATLAS</h1>
      <p className="text-sm text-gray-500 mb-6">
        Geographic Analysis — aggregate regional density of narratives and topics. Keyed on places, not individuals.
      </p>

      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">Narrative / topic filter (optional)</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="e.g. sanctions, energy, conflict…"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Window</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="p-2 border rounded">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {loading ? 'Loading…' : 'Update'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="bg-white rounded-lg shadow-md p-2 mb-6">
        <ComposableMap projectionConfig={{ scale: 140 }} width={900} height={420} style={{ width: '100%', height: 'auto' }}>
          <Geographies geography={GEO_URL}>
            {({ geographies }: any) =>
              geographies.map((geo: any) => (
                <Geography key={geo.rsmKey} geography={geo} fill="#E2E8F0" stroke="#CBD5E1" strokeWidth={0.4} />
              ))
            }
          </Geographies>
          {features.map((f) => {
            const r = 4 + (f.mentions / maxMentions) * 26;
            return (
              <Marker key={f.place} coordinates={[f.lon, f.lat]}>
                <circle r={r} fill={sentimentColor(f.avgSentiment)} fillOpacity={0.55} stroke="#fff" strokeWidth={0.5} />
              </Marker>
            );
          })}
        </ComposableMap>
        <p className="text-xs text-gray-400 px-2 pb-1">
          Circle size = mention volume · color = avg sentiment (red negative / amber neutral / green positive)
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-2">Regional density ({features.length} places)</h2>
      {features.length === 0 && !loading && (
        <p className="text-sm text-gray-500">No geographic mentions found yet for this window. As the corpus is analyzed, locations will appear here.</p>
      )}
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f.place} className="flex items-center gap-3 p-3 border rounded">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: sentimentColor(f.avgSentiment) }} />
            <span className="font-semibold w-40">{f.place}</span>
            <span className="text-sm text-gray-600">{f.mentions} mentions</span>
            <span className="text-xs text-gray-400">sentiment {f.avgSentiment.toFixed(2)}</span>
            {f.topics.length > 0 && (
              <span className="text-xs text-gray-500 ml-auto">{f.topics.slice(0, 4).join(' · ')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
