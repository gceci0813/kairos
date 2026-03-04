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
            <h3 key={i} className="font-semibold text-[#2563EB] text-sm mt-6 mb-2 border-b border-[#E2E8F0] pb-1">
              {line.replace('### ', '')}
            </h3>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-bold text-[#0F172A] text-base mt-8 mb-3">
              {line.replace('## ', '')}
            </h2>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-semibold text-[#0F172A] text-sm mt-3">
              {line.replace(/\*\*/g, '')}
            </p>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex items-start gap-2 text-sm text-[#475569]">
              <span className="text-[#2563EB] mt-0.5 flex-shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A]">$1</strong>') }} />
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-sm text-[#475569] leading-relaxed"
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

  const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
  const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-2';

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
            ORACLE · Strategy Navigator
          </p>
          <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
            Stakeholder Analysis
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Map stakeholders, simulate outcomes, and get AI-generated targeting strategies.
          </p>
        </div>
        {step === 'result' && (
          <button
            onClick={() => setStep('input')}
            className="text-sm font-semibold border border-[#E2E8F0] text-[#475569] px-4 py-2.5 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors">
            ← New Analysis
          </button>
        )}
      </div>

      {step === 'input' && (
        <div className="space-y-5">
          {/* Scenario setup */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <h2 className="text-sm font-bold text-[#0F172A] mb-1">Define the Scenario</h2>
            <p className="text-xs text-[#94A3B8] mb-5">Describe the negotiation, decision, or strategic situation you want to model.</p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Scenario Name *</label>
                <input
                  value={scenario}
                  onChange={e => setScenario(e.target.value)}
                  placeholder="e.g. Japan-US Semiconductor Trade Negotiation"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Time Horizon</label>
                <select
                  value={horizon}
                  onChange={e => setHorizon(e.target.value)}
                  className={inputClass}>
                  {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>Your Goal / Desired Outcome</label>
              <input
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Secure export license approval within 60 days"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Background Context <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={3}
                placeholder="Provide any relevant background: history of the negotiation, recent events, constraints, your resources..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Stakeholders */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] mb-0.5">Add Stakeholders</h2>
                <p className="text-xs text-[#94A3B8]">Add all relevant actors — government officials, executives, institutions, factions.</p>
              </div>
              <button
                onClick={addStakeholder}
                className="text-sm font-semibold text-[#2563EB] border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 rounded-lg hover:bg-[#DBEAFE] transition-colors">
                + Add Actor
              </button>
            </div>

            <div className="space-y-4">
              {stakeholders.map((s, idx) => (
                <div key={s.id} className="border border-[#E2E8F0] rounded-lg bg-[#FAFAFA] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
                      Actor {idx + 1}
                    </span>
                    {stakeholders.length > 1 && (
                      <button onClick={() => removeStakeholder(s.id)}
                        className="text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors font-medium">
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <input
                      value={s.name}
                      onChange={e => updateStakeholder(s.id, 'name', e.target.value)}
                      placeholder="Name / Title"
                      className={inputClass}
                    />
                    <input
                      value={s.role}
                      onChange={e => updateStakeholder(s.id, 'role', e.target.value)}
                      placeholder="Role / Position"
                      className={inputClass}
                    />
                    <input
                      value={s.org}
                      onChange={e => updateStakeholder(s.id, 'org', e.target.value)}
                      placeholder="Organization"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-5 mb-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">Position on Issue</label>
                        <span className="text-xs font-semibold" style={{ color: positionColor(s.position) }}>
                          {s.position > 0 ? '+' : ''}{s.position} — {positionLabel(s.position)}
                        </span>
                      </div>
                      <input
                        type="range" min={-10} max={10} step={1}
                        value={s.position}
                        onChange={e => updateStakeholder(s.id, 'position', parseInt(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                        <span>Strongly Opposed</span><span>Neutral</span><span>Strongly Supportive</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">Influence</label>
                        <span className="text-xs font-semibold text-[#475569]">{s.influence}/100</span>
                      </div>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={s.influence}
                        onChange={e => updateStakeholder(s.id, 'influence', parseInt(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1">
                        <span>Minor</span><span>Moderate</span><span>Decisive</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Core Interests & Motivations</label>
                    <input
                      value={s.interests}
                      onChange={e => updateStakeholder(s.id, 'interests', e.target.value)}
                      placeholder="What do they want? What are their constraints? What would move them?"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg py-3.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {loading ? 'Running Analysis...' : 'Run ORACLE Analysis →'}
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-5">
          {/* Summary bar */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#16A34A] tracking-wide uppercase mb-0.5">Analysis Complete</p>
              <p className="text-base font-bold text-[#0F172A]">{scenario}</p>
            </div>
            <span className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">ORACLE · {horizon}</span>
          </div>

          {/* Analysis output */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-8">
            <MarkdownOutput text={analysis} />
          </div>

          {/* Stakeholder map */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <h2 className="text-sm font-bold text-[#0F172A] mb-5">Stakeholder Position Map</h2>
            <div className="space-y-4">
              {stakeholders.filter(s => s.name).map(s => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="w-36 text-right">
                    <div className="text-sm font-medium text-[#0F172A] truncate">{s.name}</div>
                    <div className="text-xs text-[#94A3B8]">{s.role}</div>
                  </div>
                  <div className="flex-1 relative h-5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-full">
                    <div
                      className="absolute top-1/2 rounded-full border-2 transition-all"
                      style={{
                        left: `${((s.position + 10) / 20) * 100}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                        borderColor: positionColor(s.position),
                        background: positionColor(s.position) + '40',
                        width: `${10 + (s.influence / 100) * 12}px`,
                        height: `${10 + (s.influence / 100) * 12}px`,
                      }}
                      title={`${s.name}: Position ${s.position}, Influence ${s.influence}`}
                    />
                  </div>
                  <div className="w-28">
                    <span className="text-xs font-semibold" style={{ color: positionColor(s.position) }}>
                      {positionLabel(s.position)}
                    </span>
                    <div className="text-xs text-[#94A3B8]">Inf: {s.influence}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-[#9CA3AF]">
              <span>← Strongly Opposed (−10)</span>
              <span>(+10) Strongly Supportive →</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
