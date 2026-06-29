'use client';

import { useState, useEffect, useCallback } from 'react';

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function HealthPage() {
  const [h, setH] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/intel/health');
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setH(d);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Platform Health</h1>
        <button onClick={load} disabled={loading} className="text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {loading ? 'Checking…' : 'Refresh'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">System vitals across corpus, pipeline, connectors, and geocoding.</p>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {h && (
        <>
          <div className={`mb-6 p-3 rounded-lg border text-sm font-medium ${h.status === 'ok' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
            Status: {h.status.toUpperCase()}{h.alerts.length > 0 ? ` · ${h.alerts.length} alert(s)` : ''}
          </div>

          {h.alerts.length > 0 && (
            <div className="mb-6 space-y-1">
              {h.alerts.map((a: string, i: number) => (
                <div key={i} className="text-sm border border-amber-200 bg-amber-50 text-amber-800 rounded px-3 py-1.5">⚠ {a}</div>
              ))}
            </div>
          )}

          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Corpus</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Messages" value={h.corpus.messages.toLocaleString()} />
            <Stat label="Analyzed" value={`${(h.corpus.analyzedCoverage * 100).toFixed(0)}%`} sub={`${h.corpus.findings.toLocaleString()} findings`} />
            <Stat label="Sources" value={h.corpus.distinctSources} />
            <Stat label="Post dates" value={h.corpus.postDateRange.split(' → ')[1] || '—'} sub={`from ${h.corpus.postDateRange.split(' → ')[0]}`} />
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Pipeline & connectors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Stat label="Queue" value={h.pipeline.queueBackend === 'redis-streams' ? 'Redis' : 'In-proc'} sub={`backlog ${h.pipeline.nlpBacklog}`} />
            <Stat label="NLP (Anthropic)" value={h.pipeline.anthropicConfigured ? 'OK' : 'OFF'} />
            <Stat label="Connectors" value={h.connectors.count} sub={h.connectors.active.join(', ') || 'none'} />
            <Stat label="Watchlist" value={h.watchlist.count} sub="tracked terms" />
          </div>

          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Geocoding</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Probe" value={h.geocoding.healthy ? 'OK' : 'FAIL'} sub={`via ${h.geocoding.probe}`} />
            <Stat label="Mapbox" value={h.geocoding.providers.mapbox ? 'on' : 'off'} />
            <Stat label="Google" value={h.geocoding.providers.google ? 'on' : 'off'} />
            <Stat label="Nominatim" value="on" sub="free · 1 req/s" />
          </div>

          <p className="text-xs text-gray-400 mt-6">Snapshot {h.generatedAt}</p>
        </>
      )}
    </div>
  );
}
