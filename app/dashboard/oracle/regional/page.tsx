'use client';

import { useState, useEffect, useCallback } from 'react';

const RISK_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  GUARDED: 'bg-blue-100 text-blue-700',
  ELEVATED: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

function RiskBadge({ level }: { level: string }) {
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${RISK_COLORS[level] ?? RISK_COLORS.LOW}`}>{level}</span>;
}

export default function OracleRegionalPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/oracle/regional?days=${days}`);
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `Error ${res.status}`);
      }
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const genReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/oracle/regional?days=${days}&report=true`);
      const d = await res.json();
      setReport(d.report);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">ORACLE — Regional Forecast</h1>
      <p className="text-sm text-gray-500 mb-6">
        Aggregate regional risk, sentiment momentum, anomaly detection, and scenario modeling. Keyed on regions and narratives, not individuals.
      </p>

      <div className="flex gap-3 items-end mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Window</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="p-2 border rounded">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <button onClick={load} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
          {loading ? 'Loading…' : 'Refresh'}
        </button>
        <button onClick={genReport} disabled={reportLoading} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400">
          {reportLoading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {report && (
        <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded">
          <h3 className="font-semibold mb-2">Auto-generated Regional Summary</h3>
          <p className="text-sm text-gray-700 mb-2">{report.summary}</p>
          {report.reasoning_chain?.length > 0 && (
            <details>
              <summary className="text-xs text-purple-700 cursor-pointer">Reasoning chain</summary>
              <ul className="text-xs text-gray-600 list-disc ml-4 mt-1">
                {report.reasoning_chain.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </details>
          )}
        </div>
      )}

      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Regions by risk</h2>
            <div className="space-y-2">
              {data.regions.map((r: any) => (
                <div key={r.key} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.key}</span>
                    <RiskBadge level={r.riskLevel} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    vol {r.volume} · sentiment {r.avgSentiment.toFixed(2)} · momentum {r.momentum.toFixed(2)} · surge {r.volumeAnomaly.toFixed(1)}x
                  </div>
                  {r.drivers?.length > 0 && <div className="text-xs text-gray-400 mt-1">{r.drivers.join(' · ')}</div>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Narratives by risk</h2>
            <div className="space-y-2">
              {data.narratives.map((n: any) => (
                <div key={n.key} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{n.key}</span>
                    <RiskBadge level={n.riskLevel} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    vol {n.volume} · sentiment {n.avgSentiment.toFixed(2)} · momentum {n.momentum.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {data.anomalies?.length > 0 && (
              <>
                <h2 className="text-lg font-semibold mb-2 mt-6">Anomalies</h2>
                <div className="space-y-2">
                  {data.anomalies.map((a: any, i: number) => (
                    <div key={i} className="p-3 border rounded flex items-center justify-between">
                      <span className="font-medium">{a.key} <span className="text-xs text-gray-400">({a.kind})</span></span>
                      <span className={`text-xs font-bold ${a.direction === 'spike' ? 'text-red-600' : 'text-blue-600'}`}>
                        {a.direction.toUpperCase()} {a.ratio.toFixed(1)}x
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
