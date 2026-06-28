'use client';

import { useState, useEffect, useCallback } from 'react';

const CORROB_STYLE: Record<string, string> = {
  'single-source': 'bg-red-100 text-red-700',
  weak: 'bg-amber-100 text-amber-700',
  moderate: 'bg-blue-100 text-blue-700',
  strong: 'bg-green-100 text-green-700',
};
const STATUS_STYLE: Record<string, string> = {
  new: 'bg-purple-100 text-purple-700',
  surging: 'bg-red-100 text-red-700',
  rising: 'bg-amber-100 text-amber-700',
};

export default function IntelPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [emerging, setEmerging] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [corrob, setCorrob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDash = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [b, e] = await Promise.all([
        fetch('/api/intel/briefing?days=30').then((r) => r.json()),
        fetch('/api/intel/emerging?days=30').then((r) => r.json()),
      ]);
      if (b.error) throw new Error(b.error);
      setBriefing(b); setEmerging(e);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDash(); }, [loadDash]);

  const runCorrob = async () => {
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/intel/corroboration?query=${encodeURIComponent(query.trim())}&days=365`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setCorrob(d);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">Intel Center</h1>
        <a href="/api/intel/briefing?days=30&format=markdown" className="text-sm px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-800">Export briefing ↓</a>
      </div>
      <p className="text-sm text-gray-500 mb-6">Auto-briefing, emerging narratives, and cross-source corroboration. Aggregate regions/narratives.</p>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {briefing && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-1">Daily briefing</h2>
          <p className="text-sm font-medium text-slate-700 mb-3">{briefing.headline}</p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="text-xs uppercase text-gray-400 mb-1">Top risks</h3>
              {briefing.topRisks.map((r: any) => (
                <div key={r.key} className="mb-1"><b>{r.key}</b> <span className="text-xs text-gray-400">({r.kind})</span> — {r.riskLevel}</div>
              ))}
            </div>
            <div>
              <h3 className="text-xs uppercase text-gray-400 mb-1">Geographic activity</h3>
              {briefing.topRegions.map((g: any) => (
                <div key={g.place} className="mb-1">{g.place} — {g.mentions} ({g.avgSentiment})</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Emerging narratives</h2>
          {emerging?.narratives?.length ? emerging.narratives.slice(0, 12).map((n: any) => (
            <div key={n.topic} className="flex items-center gap-2 mb-1 text-sm">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLE[n.status]}`}>{n.status}</span>
              <span className="flex-1">{n.topic}</span>
              <span className="text-xs text-gray-500">{n.growth}x</span>
            </div>
          )) : <p className="text-sm text-gray-400">No emerging narratives in window.</p>}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-3">Cross-source corroboration</h2>
          <div className="flex gap-2 mb-3">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runCorrob()}
              placeholder="Claim or event to corroborate…" className="flex-1 p-2 border rounded text-sm" />
            <button onClick={runCorrob} disabled={loading} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Check</button>
          </div>
          {corrob && (
            <div className="space-y-2 max-h-72 overflow-auto">
              {corrob.events.slice(0, 12).map((ev: any, i: number) => (
                <div key={i} className="border rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CORROB_STYLE[ev.corroboration]}`}>{ev.corroboration}</span>
                    <span className="text-xs text-gray-500">{ev.sourceCount} sources · {ev.reportCount} reports</span>
                  </div>
                  <p className="text-xs text-gray-600">{ev.summary}</p>
                </div>
              ))}
              {corrob.events.length === 0 && <p className="text-sm text-gray-400">No matching content.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
