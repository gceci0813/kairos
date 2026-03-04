'use client';
import { useState } from 'react';

const REGIONS = [
  'Global', 'East Asia', 'Middle East', 'Eastern Europe', 'West Africa',
  'South Asia', 'Latin America', 'Central Asia', 'North Africa', 'Southeast Asia',
];

const HORIZONS = [
  { label: '7 Days', value: '7_days' },
  { label: '30 Days', value: '30_days' },
  { label: '90 Days', value: '90_days' },
  { label: '6 Months', value: '6_months' },
  { label: '1 Year', value: '1_year' },
];

const PMESII = ['Political', 'Military', 'Economic', 'Social', 'Information', 'Infrastructure'];

function RiskBar({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : value > 30 ? '#2563EB' : '#16A34A';
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569]">{label}</span>
        <span className="font-mono-custom text-base" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1 bg-[#0F172A] relative overflow-hidden">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#0284C7] mt-6 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-display font-700 text-base text-[#0F172A] mt-6 mb-2 border-b border-[#E2E8F0] pb-1">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#0EA5E9] mt-4 mb-1">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
          return (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-[#0284C7] text-base mt-0.5 flex-shrink-0">◈</span>
              <span className="text-[0.85rem] text-[#475569] leading-relaxed">{content}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A]">$1</strong>');
        return (
          <p key={i} className="text-[0.85rem] text-[#475569] leading-relaxed"
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

export default function SentinelPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('Global');
  const [actors, setActors] = useState('');
  const [horizon, setHorizon] = useState('30_days');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [pmesiiScores, setPmesiiScores] = useState<Record<string, number>>({});
  const [error, setError] = useState('');

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
        <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#0284C7] mb-1">
          ◈ SENTINEL · Horizon Watch
        </div>
        <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
          Early Warning & Risk Forecast
        </h1>
        <p className="text-[0.85rem] text-[#64748B] mt-1">
          Ask any geopolitical question. Get a structured AI-powered risk assessment across the PMESII spectrum.
        </p>
      </div>

      {/* Input panel */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 space-y-5">
        <div className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B] border-b border-[#E2E8F0] pb-4">
          Intelligence Query
        </div>

        {/* Query */}
        <div>
          <label className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569] block mb-2">
            Query / Question
          </label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. What is the risk of military escalation in the Taiwan Strait over the next 30 days? Who are the key actors and what signals should I monitor?"
            rows={3}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 placeholder-[#475569] focus:outline-none focus:border-[#0284C7] transition-colors resize-none"
          />
        </div>

        {/* Region + Horizon */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569] block mb-2">
              Region
            </label>
            <select
              value={region}
              onChange={e => setRegion(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors appearance-none"
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569] block mb-2">
              Forecast Horizon
            </label>
            <select
              value={horizon}
              onChange={e => setHorizon(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors appearance-none"
            >
              {HORIZONS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
            </select>
          </div>
        </div>

        {/* Actors */}
        <div>
          <label className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569] block mb-2">
            Key Actors (optional)
          </label>
          <input
            value={actors}
            onChange={e => setActors(e.target.value)}
            placeholder="e.g. PLA Navy, US 7th Fleet, Taiwan MND, Japan Coast Guard, ASEAN..."
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-2.5 placeholder-[#475569] focus:outline-none focus:border-[#0284C7] transition-colors"
          />
        </div>

        {/* Context */}
        <div>
          <label className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569] block mb-2">
            Additional Context (optional)
          </label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Any specific developments, recent events, or constraints that should inform the analysis..."
            rows={2}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 placeholder-[#475569] focus:outline-none focus:border-[#0284C7] transition-colors resize-none"
          />
        </div>

        {/* Run button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[0.85rem] text-[#64748B] font-mono-custom">
            Powered by Anthropic Claude · PMESII framework
          </div>
          <button
            onClick={runSentinel}
            disabled={loading || !query.trim()}
            className="font-mono-custom text-[0.85rem] tracking-[0.2em] uppercase bg-[#0284C7] text-[#F8FAFC] px-8 py-3 hover:bg-[#0EA5E9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-700"
          >
            {loading ? '◈ Analyzing...' : '◈ Run Forecast →'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 px-5 py-3 text-[0.85rem] text-[#DC2626] font-mono-custom">
          Error: {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-8 text-center">
          <div className="text-[#0284C7] text-3xl mb-3 animate-pulse">◈</div>
          <div className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B]">
            SENTINEL scanning · Processing intelligence signals...
          </div>
        </div>
      )}

      {/* Results */}
      {report && !loading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* PMESII scores */}
          {hasScores && (
            <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6">
              <div className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#0F172A] mb-5 pb-3 border-b border-[#E2E8F0]">
                PMESII Risk Index
              </div>
              {PMESII.map(dim => (
                <RiskBar key={dim} label={dim} value={pmesiiScores[dim] ?? 0} />
              ))}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  <span className="font-mono-custom text-[0.85rem] text-[#64748B]">High &gt;70</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#D97706]" />
                  <span className="font-mono-custom text-[0.85rem] text-[#64748B]">Elevated &gt;50</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  <span className="font-mono-custom text-[0.85rem] text-[#64748B]">Moderate &gt;30</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  <span className="font-mono-custom text-[0.85rem] text-[#64748B]">Low ≤30</span>
                </div>
              </div>
            </div>
          )}

          {/* Report */}
          <div className={`bg-[#FFFFFF] border border-[#E2E8F0] p-6 ${hasScores ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <span className="text-[#0284C7]">◈</span>
                <span className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#0F172A]">
                  SENTINEL Report
                </span>
              </div>
              <span className="font-mono-custom text-[0.85rem] text-[#64748B]">
                {region} · {HORIZONS.find(h => h.value === horizon)?.label}
              </span>
            </div>
            <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-[#F8FAFC] scrollbar-thumb-[#0F172A]">
              <MarkdownOutput text={report} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
