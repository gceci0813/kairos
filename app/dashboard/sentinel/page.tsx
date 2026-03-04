'use client';
import { useState } from 'react';

const REGIONS = [
  'Global', 'East Asia', 'Middle East', 'Eastern Europe', 'West Africa',
  'South Asia', 'Latin America', 'Central Asia', 'North Africa', 'Southeast Asia',
];

const HORIZONS = [
  { label: '7 Days',   value: '7_days' },
  { label: '30 Days',  value: '30_days' },
  { label: '90 Days',  value: '90_days' },
  { label: '6 Months', value: '6_months' },
  { label: '1 Year',   value: '1_year' },
];

const PMESII = ['Political', 'Military', 'Economic', 'Social', 'Information', 'Infrastructure'];

function RiskBar({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : value > 30 ? '#2563EB' : '#16A34A';
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-medium text-[#475569]">{label}</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xs font-bold tracking-widest uppercase text-[#2563EB] mt-6 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold text-[#0F172A] mt-6 mb-2 border-b border-[#E2E8F0] pb-1.5">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="text-xs font-bold tracking-wide uppercase text-[#334155] mt-4 mb-1">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
          return (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-[#2563EB] text-sm mt-0.5 flex-shrink-0">▸</span>
              <span className="text-sm text-[#475569] leading-relaxed">{content}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A]">$1</strong>');
        return (
          <p key={i} className="text-sm text-[#475569] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      })}
    </div>
  );
}

function extractPmesiiScores(text: string): Record<string, number> {
  const scores: Record<string, number> = {};
  const patterns = [
    /Political[:\s]+(\d+)/i,
    /Military[:\s]+(\d+)/i,
    /Economic[:\s]+(\d+)/i,
    /Social[:\s]+(\d+)/i,
    /Information[:\s]+(\d+)/i,
    /Infrastructure[:\s]+(\d+)/i,
  ];
  PMESII.forEach((dim, i) => {
    const match = text.match(patterns[i]);
    scores[dim] = match ? Math.min(100, parseInt(match[1])) : 0;
  });
  return scores;
}

const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-2';

export default function SentinelPage() {
  const [query, setQuery]   = useState('');
  const [region, setRegion] = useState('Global');
  const [actors, setActors] = useState('');
  const [horizon, setHorizon] = useState('30_days');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState('');
  const [pmesiiScores, setPmesiiScores] = useState<Record<string, number>>({});
  const [error, setError]   = useState('');

  async function runSentinel() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setReport('');
    setPmesiiScores({});
    try {
      const res = await fetch('/api/sentinel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, region, actors, horizon, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setReport(data.report);
      setPmesiiScores(extractPmesiiScores(data.report));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const hasScores = Object.values(pmesiiScores).some(v => v > 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          SENTINEL · Horizon Watch
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Early Warning & Risk Forecast
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Ask any geopolitical question. Get a structured AI-powered risk assessment across the PMESII spectrum.
        </p>
      </div>

      {/* Input panel */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Intelligence Query</h2>

        <div>
          <label className={labelClass}>Query / Question</label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. What is the risk of military escalation in the Taiwan Strait over the next 30 days? Who are the key actors and what signals should I monitor?"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)} className={inputClass}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Forecast Horizon</label>
            <select value={horizon} onChange={e => setHorizon(e.target.value)} className={inputClass}>
              {HORIZONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Key Actors <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></label>
          <input
            value={actors}
            onChange={e => setActors(e.target.value)}
            placeholder="e.g. PLA Navy, US 7th Fleet, Taiwan MND, Japan Coast Guard, ASEAN..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Additional Context <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Any specific developments, recent events, or constraints that should inform the analysis..."
            rows={2}
            className={`${inputClass} resize-none`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[#94A3B8]">Powered by Anthropic Claude · PMESII framework</span>
          <button
            onClick={runSentinel}
            disabled={loading || !query.trim()}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-8 py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
            {loading ? 'Analyzing...' : 'Run Forecast →'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-12 text-center">
          <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-[#475569]">Processing intelligence signals...</p>
          <p className="text-xs text-[#94A3B8] mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {/* Results */}
      {report && !loading && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* PMESII scores */}
          {hasScores && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
              <h2 className="text-sm font-bold text-[#0F172A] mb-5 pb-3 border-b border-[#E2E8F0]">
                PMESII Risk Index
              </h2>
              {PMESII.map(dim => (
                <RiskBar key={dim} label={dim} value={pmesiiScores[dim] ?? 0} />
              ))}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-1.5">
                {[
                  { color: '#DC2626', label: 'High > 70' },
                  { color: '#D97706', label: 'Elevated > 50' },
                  { color: '#2563EB', label: 'Moderate > 30' },
                  { color: '#16A34A', label: 'Low ≤ 30' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-xs text-[#64748B]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report */}
          <div className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 ${hasScores ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2E8F0]">
              <h2 className="text-sm font-bold text-[#0F172A]">SENTINEL Report</h2>
              <span className="text-xs text-[#94A3B8]">
                {region} · {HORIZONS.find(h => h.value === horizon)?.label}
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2">
              <MarkdownOutput text={report} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
