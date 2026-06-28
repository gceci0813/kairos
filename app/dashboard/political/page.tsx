'use client';

import { useState } from 'react';

function sentimentColor(s: number): string {
  if (s <= -0.3) return '#EF4444';
  if (s >= 0.3) return '#10B981';
  return '#F59E0B';
}

function Sparkline({ series }: { series: { day: string; avgSentiment: number; volume: number }[] }) {
  if (series.length < 2) return <span className="text-xs text-gray-400">insufficient data</span>;
  const w = 240, h = 40;
  const maxVol = Math.max(...series.map((p) => p.volume), 1);
  const pts = series.map((p, i) => {
    const x = (i / (series.length - 1)) * w;
    const y = h - ((p.avgSentiment + 1) / 2) * h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="block">
      <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="#E2E8F0" strokeWidth="1" />
      <polyline points={pts} fill="none" stroke="#2563EB" strokeWidth="1.5" />
      {series.map((p, i) => {
        const x = (i / (series.length - 1)) * w;
        return <circle key={i} cx={x} cy={h - ((p.avgSentiment + 1) / 2) * h} r={1 + (p.volume / maxVol) * 3} fill={sentimentColor(p.avgSentiment)} />;
      })}
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-slate-50 rounded p-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}

export default function PoliticalPage() {
  const [entity, setEntity] = useState('');
  const [days, setDays] = useState(30);
  const [trend, setTrend] = useState<any>(null);
  const [candidates, setCandidates] = useState('');
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prov, setProv] = useState<any>(null);
  const [provOpen, setProvOpen] = useState(false);

  const loadProvenance = async () => {
    if (prov) { setProvOpen((o) => !o); return; }
    setProvOpen(true);
    try {
      const res = await fetch('/api/political/provenance');
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProv(d);
    } catch (e: any) { setError(e.message); }
  };

  const loadTrend = async () => {
    if (!entity.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/political/trends?entity=${encodeURIComponent(entity.trim())}&days=${days}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTrend(d);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const runForecast = async () => {
    const list = candidates.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length < 2) { setError('Enter at least 2 candidates, comma-separated'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/political/forecast', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates: list, days }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setForecast(d);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Political Intelligence</h1>
      <p className="text-sm text-gray-500 mb-6">
        Aggregate sentiment trends and sentiment-weighted forecasting over public discourse. Treats candidates/parties as topics in open sources — no individual profiling.
      </p>

      <div className="mb-4 flex gap-2 items-end">
        <label className="text-sm font-medium">Window
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="ml-2 p-2 border rounded">
            <option value={7}>7d</option><option value={30}>30d</option><option value={90}>90d</option><option value={365}>1y</option>
          </select>
        </label>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {/* Source provenance — auditable corpus coverage */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <button onClick={loadProvenance} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span>{provOpen ? '▾' : '▸'}</span> Corpus source provenance (coverage audit)
        </button>
        {provOpen && prov && (
          <div className="mt-3 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Stat label="Messages" value={prov.totals.messages.toLocaleString()} />
              <Stat label="Analyzed (findings)" value={`${prov.totals.findings.toLocaleString()} (${(prov.totals.analyzedCoverage * 100).toFixed(0)}%)`} />
              <Stat label="Distinct sources" value={prov.totals.distinctSources} />
              <Stat label="Post date range" value={`${(prov.dateRange.earliestPost || '?').slice(0, 10)} → ${(prov.dateRange.latestPost || '?').slice(0, 10)}`} />
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-xs uppercase text-gray-400 mb-1">Language mix (of analyzed)</h4>
              <div className="flex flex-wrap gap-2">
                {prov.languageMix.slice(0, 8).map((l: any) => (
                  <span key={l.language} className="text-xs bg-slate-100 px-2 py-1 rounded">
                    {l.language} {(l.share * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-xs uppercase text-gray-400 mb-1">Top sources by volume</h4>
              <div className="space-y-1 max-h-56 overflow-auto">
                {prov.sources.slice(0, 20).map((s: any) => (
                  <div key={s.source} className="flex items-center gap-2 text-xs">
                    <span className="w-40 truncate font-medium">{s.source}</span>
                    <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
                      <div className="h-full bg-blue-400" style={{ width: `${Math.max(2, s.share * 100)}%` }} />
                    </div>
                    <span className="w-12 text-right text-gray-500">{s.messages}</span>
                    <span className="w-10 text-gray-400">{s.language || '—'}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Coverage is limited to these sources — analyses inherit this selection. This is the bias confidence intervals do not capture.
              </p>
            </div>
          </div>
        )}
        {provOpen && !prov && <p className="text-sm text-gray-400 mt-2">Loading…</p>}
      </div>

      {/* Entity trend */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-3">Entity sentiment trend</h2>
        <div className="flex gap-2 mb-3">
          <input value={entity} onChange={(e) => setEntity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadTrend()}
            placeholder="Candidate / party / org (e.g. NATO, a named figure)…" className="flex-1 p-2 border rounded" />
          <button onClick={loadTrend} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">Analyze</button>
        </div>
        {trend && (
          <div>
            <div className="flex gap-6 text-sm mb-2">
              <span>Volume: <b>{trend.totalVolume}</b></span>
              <span>Sentiment: <b style={{ color: sentimentColor(trend.overallSentiment) }}>{trend.overallSentiment.toFixed(2)}</b></span>
              <span>Momentum: <b>{trend.momentum >= 0 ? '+' : ''}{trend.momentum.toFixed(2)}</b></span>
              <span>Vol momentum: <b>{trend.volumeMomentum.toFixed(1)}x</b></span>
            </div>
            <Sparkline series={trend.series} />
            {trend.totalVolume === 0 && <p className="text-xs text-gray-400 mt-2">No mentions in corpus for this entity/window.</p>}
          </div>
        )}
      </div>

      {/* Forecast */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-3">Sentiment-weighted forecast</h2>
        <div className="flex gap-2 mb-3">
          <input value={candidates} onChange={(e) => setCandidates(e.target.value)}
            placeholder="Comma-separated field, e.g. Party A, Party B, Party C" className="flex-1 p-2 border rounded" />
          <button onClick={runForecast} disabled={loading} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400">Forecast</button>
        </div>
        {forecast && (
          <div className="space-y-3">
            {forecast.field.map((c: any) => {
              const relColor: Record<string, string> = {
                'very low': 'bg-red-100 text-red-700', low: 'bg-amber-100 text-amber-700',
                moderate: 'bg-blue-100 text-blue-700', high: 'bg-green-100 text-green-700',
              };
              return (
                <div key={c.candidate} className="border rounded p-2">
                  <div className="flex items-center gap-3">
                    <span className="w-36 font-medium truncate">{c.candidate}</span>
                    <div className="flex-1 bg-slate-100 rounded h-5 overflow-hidden relative">
                      {/* CI band */}
                      <div className="absolute top-0 h-full bg-purple-200"
                        style={{ left: `${c.probabilityCI[0] * 100}%`, width: `${Math.max(1, (c.probabilityCI[1] - c.probabilityCI[0]) * 100)}%` }} />
                      <div className="h-full bg-purple-500 flex items-center justify-end pr-2 text-[10px] text-white relative"
                        style={{ width: `${Math.max(6, c.probability * 100)}%` }}>
                        {(c.probability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${relColor[c.reliability]}`}>{c.reliability}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 ml-36 flex flex-wrap gap-x-4">
                    <span>95% CI {(c.probabilityCI[0] * 100).toFixed(0)}–{(c.probabilityCI[1] * 100).toFixed(0)}%</span>
                    <span>vol {c.volume} (n_eff {c.effectiveSampleSize})</span>
                    <span>sources {c.sourceMix.distinctSources} (≈{c.sourceMix.effectiveSources.toFixed(1)} eff.)</span>
                    <span>sentiment {c.avgSentiment.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}
            <div className="text-xs text-gray-400 mt-2 space-y-0.5">
              {(forecast.caveats || []).map((cav: string, i: number) => <p key={i}>• {cav}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
