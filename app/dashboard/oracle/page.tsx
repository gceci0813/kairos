'use client';
import { useState } from 'react';

type Stakeholder = {
  id: string;
  name: string;
  role: string;
  org: string;
  position: number;
  influence: number;
  interests: string;
};

const HORIZONS = ['1 week', '1 month', '3 months', '6 months', '1 year'];

function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-display font-700 text-[#2563EB] text-base mt-6 mb-2 border-b border-[#E2E8F0] pb-1">
              {line.replace('### ', '')}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-display font-800 text-[#0F172A] text-xl mt-8 mb-3">
              {line.replace('## ', '')}
            </h2>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-[#0F172A] text-base mt-3">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 text-base text-[#475569]">
              <span className="text-[#2563EB] mt-0.5 flex-shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A]">$1</strong>') }} />
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-base text-[#475569] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A]">$1</strong>') }} />
        );
      })}
    </div>
  );
}

export default function OraclePage() {
  const [scenario, setScenario] = useState('');
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [horizon, setHorizon] = useState('3 months');
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    { id: '1', name: '', role: '', org: '', position: 0, influence: 50, interests: '' },
  ]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');

  const addStakeholder = () => {
    setStakeholders(prev => [...prev, {
      id: Date.now().toString(),
      name: '', role: '', org: '', position: 0, influence: 50, interests: '',
    }]);
  };

  const removeStakeholder = (id: string) => {
    setStakeholders(prev => prev.filter(s => s.id !== id));
  };

  const updateStakeholder = (id: string, field: keyof Stakeholder, value: string | number) => {
    setStakeholders(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const runAnalysis = async () => {
    if (!scenario.trim()) { setError('Enter a scenario name.'); return; }
    const valid = stakeholders.filter(s => s.name.trim());
    if (!valid.length) { setError('Add at least one named stakeholder.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario, goal, context, horizon, stakeholders: valid }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setAnalysis(data.analysis);
      setStep('result');
    } catch {
      setError('Request failed. Check your API key in .env.');
    } finally {
      setLoading(false);
    }
  };

  const positionLabel = (v: number) => {
    if (v >= 7) return 'Strongly Supportive';
    if (v >= 3) return 'Supportive';
    if (v >= -2) return 'Neutral';
    if (v >= -6) return 'Opposed';
    return 'Strongly Opposed';
  };

  const positionColor = (v: number) => {
    if (v >= 3) return '#16A34A';
    if (v >= -2) return '#D97706';
    return '#DC2626';
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#64748B] mb-1">
            △ ORACLE
          </div>
          <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
            Strategy Navigator
          </h1>
          <p className="text-base text-[#475569] mt-1">
            Map stakeholders, simulate outcomes, and get AI-generated targeting strategies.
          </p>
        </div>
        {step === 'result' && (
          <button onClick={() => setStep('input')}
            className="font-mono-custom text-base tracking-[0.2em] uppercase border border-[#E2E8F0] text-[#475569] px-4 py-2 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
            ← New Analysis
          </button>
        )}
      </div>

      {step === 'input' && (
        <div className="space-y-6">
          {/* Scenario setup */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6">
            <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#2563EB] mb-5">
              01 — Define the Scenario
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B] mb-2 block">
                  Scenario Name *
                </label>
                <input
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  placeholder="e.g. Japan-US Semiconductor Trade Negotiation"
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B] mb-2 block">
                  Time Horizon
                </label>
                <select
                  value={horizon}
                  onChange={e => setHorizon(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 focus:outline-none focus:border-[#2563EB] transition-colors appearance-none cursor-pointer"
                >
                  {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B] mb-2 block">
                Your Goal / Desired Outcome
              </label>
              <input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Secure export license approval within 60 days"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
              />
            </div>
            <div>
              <label className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#64748B] mb-2 block">
                Background Context (optional)
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={3}
                placeholder="Provide any relevant background: history of the negotiation, recent events, constraints, your resources..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#2563EB]">
                02 — Add Stakeholders
              </div>
              <button
                onClick={addStakeholder}
                className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#2563EB] border border-[#E2E8F0] px-3 py-1.5 hover:border-[#2563EB] hover:bg-[#2563EB]/10 transition-all">
                + Add Actor
              </button>
            </div>
            <p className="text-base text-[#64748B] mb-5">
              Add all relevant actors — government officials, executives, institutions, factions. Be specific with names and roles for better targeting analysis.
            </p>

            <div className="space-y-4">
              {stakeholders.map((s, idx) => (
                <div key={s.id} className="border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono-custom text-[0.85rem] tracking-[0.2em] uppercase text-[#64748B]">
                      Actor {idx + 1}
                    </span>
                    {stakeholders.length > 1 && (
                      <button onClick={() => removeStakeholder(s.id)}
                        className="text-[#64748B] hover:text-[#DC2626] transition-colors text-base">
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <input
                      value={s.name}
                      onChange={e => updateStakeholder(s.id, 'name', e.target.value)}
                      placeholder="Name / Title"
                      className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
                    />
                    <input
                      value={s.role}
                      onChange={e => updateStakeholder(s.id, 'role', e.target.value)}
                      placeholder="Role / Position"
                      className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
                    />
                    <input
                      value={s.org}
                      onChange={e => updateStakeholder(s.id, 'org', e.target.value)}
                      placeholder="Organization"
                      className="bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#64748B]">
                          Position on Issue
                        </label>
                        <span className="font-mono-custom text-[0.85rem]" style={{ color: positionColor(s.position) }}>
                          {s.position > 0 ? '+' : ''}{s.position} — {positionLabel(s.position)}
                        </span>
                      </div>
                      <input
                        type="range" min={-10} max={10} step={1}
                        value={s.position}
                        onChange={e => updateStakeholder(s.id, 'position', parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <div className="flex justify-between font-mono-custom text-[0.5rem] text-[#64748B] mt-1">
                        <span>Strongly Opposed</span><span>Neutral</span><span>Strongly Supportive</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#64748B]">
                          Influence
                        </label>
                        <span className="font-mono-custom text-[0.85rem] text-[#475569]">
                          {s.influence}/100
                        </span>
                      </div>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={s.influence}
                        onChange={e => updateStakeholder(s.id, 'influence', parseInt(e.target.value))}
                        className="w-full accent-blue-500 cursor-pointer"
                      />
                      <div className="flex justify-between font-mono-custom text-[0.5rem] text-[#64748B] mt-1">
                        <span>Minor</span><span>Moderate</span><span>Decisive</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#64748B] mb-1 block">
                      Core Interests & Motivations
                    </label>
                    <input
                      value={s.interests}
                      onChange={e => updateStakeholder(s.id, 'interests', e.target.value)}
                      placeholder="What do they want? What are their constraints? What would move them?"
                      className="w-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2 focus:outline-none focus:border-[#2563EB] placeholder-[#64748B] transition-colors"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Run */}
          {error && (
            <div className="bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3 text-[#DC2626] text-base font-mono-custom">
              {error}
            </div>
          )}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full font-mono-custom text-base tracking-[0.25em] uppercase bg-[#2563EB] text-white py-4 hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
            {loading ? '◎ Running AI Analysis...' : '△ Run ORACLE Analysis →'}
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-6">
          {/* Summary bar */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
            <div>
              <div className="font-mono-custom text-[0.85rem] tracking-[0.2em] uppercase text-[#64748B] mb-1">Analysis Complete</div>
              <div className="font-display font-700 text-[#0F172A]">{scenario}</div>
            </div>
            <div className="flex items-center gap-2 text-[#16A34A]">
              <span className="text-base">●</span>
              <span className="font-mono-custom text-base tracking-[0.15em] uppercase">ORACLE</span>
            </div>
          </div>

          {/* Analysis output */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-8">
            <MarkdownOutput text={analysis} />
          </div>

          {/* Stakeholder map */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6">
            <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#2563EB] mb-5">
              Stakeholder Position Map
            </div>
            <div className="relative h-8 bg-[#F8FAFC] border border-[#E2E8F0] mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="flex-1 h-px bg-[#0F172A]" />
                <span className="font-mono-custom text-[0.5rem] text-[#64748B] px-2">NEUTRAL</span>
                <div className="flex-1 h-px bg-[#0F172A]" />
              </div>
            </div>
            <div className="space-y-3">
              {stakeholders.filter(s => s.name).map(s => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="w-36 text-right">
                    <div className="text-base text-[#0F172A] truncate">{s.name}</div>
                    <div className="font-mono-custom text-[0.5rem] text-[#64748B]">{s.role}</div>
                  </div>
                  <div className="flex-1 relative h-6 bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all"
                      style={{
                        left: `${((s.position + 10) / 20) * 100}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                        borderColor: positionColor(s.position),
                        background: positionColor(s.position) + '40',
                        width: `${8 + (s.influence / 100) * 12}px`,
                        height: `${8 + (s.influence / 100) * 12}px`,
                      }}
                      title={`${s.name}: Position ${s.position}, Influence ${s.influence}`}
                    />
                  </div>
                  <div className="w-28 text-left">
                    <span className="font-mono-custom text-[0.5rem]" style={{ color: positionColor(s.position) }}>
                      {positionLabel(s.position)}
                    </span>
                    <div className="font-mono-custom text-[0.5rem] text-[#64748B]">Inf: {s.influence}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 font-mono-custom text-[0.5rem] text-[#64748B]">
              <span>← Strongly Opposed (-10)</span>
              <span>(+10) Strongly Supportive →</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
