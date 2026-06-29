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

function EntityGraph({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const W = 860, H = 420, cx = W / 2, cy = H / 2;
  const N = Math.min(nodes.length, 40);
  const shown = nodes.slice(0, N);
  const radius = Math.min(W, H) / 2 - 60;
  const pos = new Map<string, { x: number; y: number }>();
  shown.forEach((n, i) => {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    // Higher-weight nodes sit slightly inward.
    const r = radius * (0.7 + 0.3 * (1 - i / N));
    pos.set(n.id, { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang) });
  });
  const maxW = Math.max(...shown.map((n) => n.weight), 1);
  const maxE = Math.max(...edges.map((e) => e.weight), 1);
  const typeColor: Record<string, string> = { organization: '#2563EB', location: '#10B981', topic: '#A855F7' };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 440 }}>
      {edges.filter((e) => pos.has(e.source) && pos.has(e.target)).slice(0, 120).map((e, i) => {
        const a = pos.get(e.source)!, b = pos.get(e.target)!;
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#CBD5E1" strokeWidth={0.5 + (e.weight / maxE) * 3} strokeOpacity={0.5} />;
      })}
      {shown.map((n) => {
        const p = pos.get(n.id)!;
        const r = 4 + (n.weight / maxW) * 14;
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={r} fill={typeColor[n.type] ?? '#64748B'} fillOpacity={0.75} />
            <text x={p.x} y={p.y - r - 2} textAnchor="middle" fontSize="9" fill="#334155">{n.id.length > 18 ? n.id.slice(0, 17) + '…' : n.id}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function IntelPage() {
  const [briefing, setBriefing] = useState<any>(null);
  const [emerging, setEmerging] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [graph, setGraph] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [corrob, setCorrob] = useState<any>(null);
  const [baseline, setBaseline] = useState<any>(null);
  const [sentShift, setSentShift] = useState<any>(null);
  const [diffTopic, setDiffTopic] = useState('');
  const [diffusion, setDiffusion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadDash = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [b, e, al, g, bl, ss] = await Promise.all([
        fetch('/api/intel/briefing?days=30').then((r) => r.json()),
        fetch('/api/intel/emerging?days=30').then((r) => r.json()),
        fetch('/api/intel/alerts?days=30').then((r) => r.json()),
        fetch('/api/intel/graph?days=30').then((r) => r.json()),
        fetch('/api/intel/baseline?window=730&recent=14').then((r) => r.json()),
        fetch('/api/intel/sentiment-shift?window=730&recent=30').then((r) => r.json()),
      ]);
      if (b.error) throw new Error(b.error);
      setBriefing(b); setEmerging(e); setAlerts(al); setGraph(g); setBaseline(bl); setSentShift(ss);
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

  const runDiffusion = async () => {
    if (!diffTopic.trim()) return;
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/intel/diffusion?topic=${encodeURIComponent(diffTopic.trim())}&days=1825`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setDiffusion(d);
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

      {alerts?.alerts?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Active alerts ({alerts.alerts.length})</h2>
          <div className="space-y-1">
            {alerts.alerts.slice(0, 8).map((a: any) => {
              const sev: Record<string, string> = { critical: 'bg-red-50 border-red-300 text-red-800', warning: 'bg-amber-50 border-amber-300 text-amber-800', info: 'bg-blue-50 border-blue-200 text-blue-800' };
              return (
                <div key={a.id} className={`text-sm border rounded px-3 py-1.5 ${sev[a.severity]}`}>
                  <b className="uppercase text-[10px] mr-2">{a.severity}</b>
                  <span className="text-[10px] uppercase text-gray-500 mr-2">{a.category}</span>
                  <b>{a.subject}</b> — {a.message}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Statistical deviations vs baseline */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Baseline deviations (z-score)</h2>
          <p className="text-xs text-gray-400 mb-2">Recent volume vs historical norm. |z|≥2 = abnormal.</p>
          <div className="space-y-1 max-h-64 overflow-auto">
            {[...(baseline?.regions || []), ...(baseline?.narratives || [])]
              .sort((a: any, b: any) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 12).map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs border rounded px-2 py-1">
                <span className={`text-[10px] font-bold px-1.5 rounded ${d.direction === 'spike' ? 'bg-red-100 text-red-700' : d.direction === 'drop' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{d.direction}</span>
                <span className="flex-1 truncate">{d.key} <span className="text-gray-400">({d.kind})</span></span>
                <span className="font-bold">z={d.z}</span>
              </div>
            ))}
            {!baseline && <p className="text-sm text-gray-400">Loading…</p>}
          </div>
        </div>

        {/* Sentiment shifts */}
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Sentiment shifts</h2>
          <p className="text-xs text-gray-400 mb-2">Tone direction change, recent vs prior. ⚑ = sign flip.</p>
          <div className="space-y-1 max-h-64 overflow-auto">
            {[...(sentShift?.regions || []), ...(sentShift?.narratives || [])]
              .sort((a: any, b: any) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 12).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs border rounded px-2 py-1">
                <span className={`text-[10px] font-bold px-1.5 rounded ${s.direction === 'improving' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.flipped ? '⚑ ' : ''}{s.direction}</span>
                <span className="flex-1 truncate">{s.key}</span>
                <span className="text-gray-500">{s.priorSentiment.toFixed(2)}→{s.recentSentiment.toFixed(2)}</span>
              </div>
            ))}
            {!sentShift && <p className="text-sm text-gray-400">Loading…</p>}
          </div>
        </div>
      </div>

      {/* Narrative diffusion */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="font-semibold mb-2">Narrative diffusion</h2>
        <div className="flex gap-2 mb-3">
          <input value={diffTopic} onChange={(e) => setDiffTopic(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && runDiffusion()}
            placeholder="Narrative/topic to trace (e.g. Sanctions, NATO, Military Conflict)…" className="flex-1 p-2 border rounded text-sm" />
          <button onClick={runDiffusion} disabled={loading} className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Trace</button>
        </div>
        {diffusion && (
          <div className="text-sm">
            {diffusion.totalMentions === 0 ? (
              <p className="text-gray-500">No mentions of “{diffusion.topic}” in the corpus.</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-2">
                  {diffusion.totalMentions} mentions · reach {diffusion.reach.distinctSources} sources / {diffusion.reach.distinctRegions} regions · span {diffusion.span.days}d
                  {diffusion.origin && <> · origin <b>{diffusion.origin.source}</b> ({diffusion.origin.firstSeen.slice(0, 10)})</>}
                </p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <h3 className="text-xs uppercase text-gray-400 mb-1">Source adoption order</h3>
                    {diffusion.sources.slice(0, 8).map((s: any) => (
                      <div key={s.source} className="text-xs flex justify-between"><span className="truncate">{s.source}</span><span className="text-gray-400">+{s.hoursAfterOrigin}h</span></div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs uppercase text-gray-400 mb-1">Regions reached (in order)</h3>
                    <p className="text-xs text-gray-600">{diffusion.regions.map((r: any) => r.place).slice(0, 12).join(' → ')}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {graph?.nodes?.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-2">Entity co-occurrence graph</h2>
          <EntityGraph nodes={graph.nodes} edges={graph.edges} />
          <p className="text-xs text-gray-400 mt-1">Orgs, places &amp; narratives that co-occur. Node size = mentions, edge thickness = co-occurrence. Persons excluded.</p>
        </div>
      )}

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
