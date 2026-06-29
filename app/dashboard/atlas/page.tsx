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

function TimelineChart({ buckets }: { buckets: { bucket: string; count: number }[] }) {
  if (!buckets.length) return <p className="text-xs text-gray-400">No events.</p>;
  const w = 860, h = 90, pad = 4;
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const bw = Math.max(1, (w - pad * 2) / buckets.length);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: 110 }}>
      {buckets.map((b, i) => {
        const bh = (b.count / max) * (h - 16);
        return (
          <rect key={i} x={pad + i * bw} y={h - bh - 2} width={Math.max(0.8, bw - 0.5)} height={bh}
            fill={b.count >= 2 * (max / buckets.length) ? '#EF4444' : '#3B82F6'} fillOpacity={0.8}>
            <title>{b.bucket}: {b.count}</title>
          </rect>
        );
      })}
      <text x={pad} y={10} fontSize="9" fill="#94A3B8">{buckets[0]?.bucket}</text>
      <text x={w - pad} y={10} fontSize="9" fill="#94A3B8" textAnchor="end">{buckets[buckets.length - 1]?.bucket}</text>
    </svg>
  );
}

export default function AtlasPage() {
  const [query, setQuery] = useState('');
  const [days, setDays] = useState(30);
  const [level, setLevel] = useState<'all' | 'country' | 'city'>('all');
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drill, setDrill] = useState<any>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [timeline, setTimeline] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const [tl, co] = await Promise.all([
        fetch(`/api/atlas/timeline?days=1825&granularity=day`).then((r) => r.json()),
        fetch(`/api/atlas/correlate?days=1825&maxHours=72`).then((r) => r.json()),
      ]);
      setTimeline(tl); setCorrelation(co);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const openDrill = useCallback(async (place: string) => {
    setDrillLoading(true);
    setDrill({ place, narratives: [], totalMentions: 0 });
    try {
      const res = await fetch(`/api/atlas/region?place=${encodeURIComponent(place)}&days=${days}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `Error ${res.status}`);
      setDrill(d);
    } catch (e: any) {
      setError(e.message);
      setDrill(null);
    } finally {
      setDrillLoading(false);
    }
  }, [days]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ format: 'features', days: String(days), level });
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
  }, [query, days, level]);

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
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="p-2 border rounded">
            <option value="all">All places</option>
            <option value="country">Country (roll up cities)</option>
            <option value="city">City only</option>
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
          <button
            key={f.place}
            onClick={() => openDrill(f.place)}
            className="w-full text-left flex items-center gap-3 p-3 border rounded hover:bg-slate-50 transition-colors"
          >
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: sentimentColor(f.avgSentiment) }} />
            <span className="font-semibold w-40">{f.place}</span>
            <span className="text-sm text-gray-600">{f.mentions} mentions</span>
            <span className="text-xs text-gray-400">sentiment {f.avgSentiment.toFixed(2)}</span>
            {f.topics.length > 0 && (
              <span className="text-xs text-gray-500 ml-auto">{f.topics.slice(0, 4).join(' · ')}</span>
            )}
          </button>
        ))}
      </div>

      {/* Event-level intelligence */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Event timeline & correlation</h2>
          <div className="flex gap-2">
            <a href="/api/atlas/heatmap?days=365&format=csv" className="text-xs px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-800">Export CSV ↓</a>
            <a href="/api/atlas/heatmap?days=365&download=true" className="text-xs px-3 py-1.5 bg-slate-600 text-white rounded hover:bg-slate-700">Export GeoJSON ↓</a>
            <button onClick={loadEvents} disabled={eventsLoading} className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
              {eventsLoading ? 'Loading…' : 'Load events'}
            </button>
          </div>
        </div>

        {timeline && (
          <div className="bg-white border rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold mb-2">Daily event volume ({timeline.events?.length ?? 0} recent events)</h3>
            <TimelineChart buckets={timeline.buckets || []} />
            {timeline.patterns?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {timeline.patterns.slice(0, 8).map((p: any, i: number) => (
                  <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                    burst {p.bucket} · {p.count} ({p.ratioToBaseline}×)
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {correlation && (
          <div className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-2">Cross-location event correlations ({correlation.links?.length ?? 0})</h3>
            <div className="space-y-1 max-h-72 overflow-auto">
              {(correlation.links || []).slice(0, 25).map((l: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs border rounded px-2 py-1">
                  <span className="font-medium">{l.a.place} ↔ {l.b.place}</span>
                  <span className="text-gray-400">{l.hoursApart}h{l.km != null ? ` · ${l.km}km` : ''}</span>
                  <span className="text-gray-500 flex-1 truncate">{l.sharedTopics.slice(0, 3).join(', ')}</span>
                  <span className="font-bold text-blue-600">{(l.score * 100).toFixed(0)}%</span>
                </div>
              ))}
              {correlation.links?.length === 0 && <p className="text-sm text-gray-500">No correlated events in window.</p>}
            </div>
          </div>
        )}
      </div>

      {drill && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={() => setDrill(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{drill.place} — narratives</h3>
              <button onClick={() => setDrill(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            {drillLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">{drill.totalMentions} findings reference this region (incl. its cities)</p>
                <div className="space-y-2">
                  {(drill.narratives || []).slice(0, 20).map((n: any) => (
                    <div key={n.topic} className="flex items-center gap-3 p-2 border rounded">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: sentimentColor(n.avgSentiment) }} />
                      <span className="flex-1 text-sm">{n.topic}</span>
                      <span className="text-xs text-gray-600">{n.mentions}</span>
                      <span className="text-xs text-gray-400">{n.avgSentiment.toFixed(2)}</span>
                    </div>
                  ))}
                  {drill.narratives?.length === 0 && <p className="text-sm text-gray-500">No narratives found.</p>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
