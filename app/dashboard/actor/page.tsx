'use client';
import { useState } from 'react';

const ACTOR_TYPES = [
  'Individual',
  'Terrorist Organization',
  'State Actor',
  'Non-State Armed Group',
  'Criminal Network',
  'Political Organization',
  'Intelligence Service',
  'Proxy Force',
  'Corporation / Entity',
];

const REGIONS = [
  'Global', 'East Asia', 'Middle East', 'Eastern Europe', 'West Africa',
  'South Asia', 'Latin America', 'Central Asia', 'North Africa', 'Southeast Asia',
  'North America', 'Western Europe',
];

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#DC2626',
  ELEVATED: '#D97706',
  MODERATE: '#2563EB',
  LOW: '#16A34A',
};

const PMESII_DIMS = ['Political', 'Military', 'Economic', 'Social', 'Information', 'Infrastructure'];

function ThreatBar({ label, value, justify }: { label: string; value: number; justify: string }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : value > 30 ? '#2563EB' : '#16A34A';
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569]">{label}</span>
        <span className="font-mono-custom text-[0.7rem] font-700" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-[#F1F5F9] relative overflow-hidden rounded-full">
        <div className="h-full transition-all duration-700 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      {justify && <p className="text-[0.7rem] text-[#64748B] mt-1 leading-relaxed">{justify}</p>}
    </div>
  );
}

function MarkdownSection({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="font-display font-700 text-lg text-[#0F172A] mt-8 mb-3 pb-2 border-b border-[#E2E8F0]">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mt-5 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="font-mono-custom text-[0.7rem] tracking-[0.1em] uppercase text-[#334155] mt-3 mb-1 font-700">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
          return (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-[#2563EB] text-sm mt-0.5 flex-shrink-0">▸</span>
              <span className="text-[0.85rem] text-[#334155] leading-relaxed">{content}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-2" />;
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#0F172A] font-600">$1</strong>');
        return (
          <p key={i} className="text-[0.85rem] text-[#475569] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted }} />
        );
      })}
    </div>
  );
}

function extractThreatLevel(text: string): string {
  const match = text.match(/CRITICAL|HIGH|ELEVATED|MODERATE|LOW/);
  return match ? match[0] : '';
}

function extractPmesiiScores(text: string): Array<{ label: string; value: number; justify: string }> {
  return PMESII_DIMS.map(dim => {
    const pattern = new RegExp(`${dim}[:\\s]+(\\d+)(?:[^\\n]*?—\\s*)?([^\\n]*)`, 'i');
    const match = text.match(pattern);
    return {
      label: dim,
      value: match ? Math.min(100, parseInt(match[1])) : 0,
      justify: match?.[2]?.trim() ?? '',
    };
  });
}

interface DossierEntry {
  id: string;
  name: string;
  type: string;
  region: string;
  threat: string;
  timestamp: string;
  profile: string;
}

export default function ActorPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState('Individual');
  const [region, setRegion] = useState('Global');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState('');
  const [threat, setThreat] = useState('');
  const [pmesii, setPmesii] = useState<Array<{ label: string; value: number; justify: string }>>([]);
  const [error, setError] = useState('');
  const [dossiers, setDossiers] = useState<DossierEntry[]>([]);
  const [activeView, setActiveView] = useState<'new' | 'library'>('new');
  const [viewingDossier, setViewingDossier] = useState<DossierEntry | null>(null);

  async function runAnalysis() {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setProfile('');
    setThreat('');
    setPmesii([]);
    setViewingDossier(null);
    try {
      const res = await fetch('/api/actor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, region, context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const t = extractThreatLevel(data.profile);
      const p = extractPmesiiScores(data.profile);
      setProfile(data.profile);
      setThreat(t);
      setPmesii(p);

      // Save to dossier library
      const entry: DossierEntry = {
        id: Date.now().toString(),
        name: name.trim(),
        type,
        region,
        threat: t,
        timestamp: new Date().toLocaleString(),
        profile: data.profile,
      };
      setDossiers(prev => [entry, ...prev]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function loadDossier(d: DossierEntry) {
    setViewingDossier(d);
    setProfile(d.profile);
    setThreat(d.threat);
    setPmesii(extractPmesiiScores(d.profile));
    setActiveView('new');
  }

  const displayProfile = viewingDossier?.profile ?? profile;
  const displayThreat = viewingDossier?.threat ?? threat;
  const displayPmesii = viewingDossier ? extractPmesiiScores(viewingDossier.profile) : pmesii;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-1">
            ◆ ACTOR INTELLIGENCE · OSINT Module
          </div>
          <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
            Actor Intelligence & Dossier
          </h1>
          <p className="text-[0.85rem] text-[#64748B] mt-1">
            OSINT-based structured profiles on individuals, groups, organizations, and state actors. Public record only.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveView('new')}
            className={`font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${activeView === 'new' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB]'}`}>
            New Analysis
          </button>
          <button onClick={() => setActiveView('library')}
            className={`font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase px-4 py-2 border transition-colors ${activeView === 'library' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB]'}`}>
            Dossier Library {dossiers.length > 0 && `(${dossiers.length})`}
          </button>
        </div>
      </div>

      {/* Library view */}
      {activeView === 'library' && (
        <div className="bg-white border border-[#E2E8F0]">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#334155]">Saved Dossiers — Session Only</span>
          </div>
          {dossiers.length === 0 ? (
            <div className="p-12 text-center text-[#94A3B8] text-sm">No dossiers yet. Run an analysis to create one.</div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {dossiers.map(d => (
                <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-[#F8FAFC] group cursor-pointer" onClick={() => loadDossier(d)}>
                  <div className="flex items-center gap-4">
                    <span className="font-mono-custom text-[0.65rem] px-2 py-0.5 border rounded-sm"
                      style={{ color: THREAT_COLORS[d.threat] ?? '#64748B', borderColor: (THREAT_COLORS[d.threat] ?? '#64748B') + '40', background: (THREAT_COLORS[d.threat] ?? '#64748B') + '10' }}>
                      {d.threat || 'N/A'}
                    </span>
                    <div>
                      <div className="font-display font-700 text-[#0F172A]">{d.name}</div>
                      <div className="text-[0.7rem] text-[#94A3B8]">{d.type} · {d.region}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[0.7rem] text-[#94A3B8]">{d.timestamp}</span>
                    <span className="font-mono-custom text-[0.7rem] text-[#2563EB] group-hover:underline">View →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New analysis / results view */}
      {activeView === 'new' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input panel */}
          <div className="bg-white border border-[#E2E8F0] p-6 space-y-5 h-fit">
            <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B] border-b border-[#E2E8F0] pb-4">
              Subject Identification
            </div>

            <div>
              <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">
                Subject Name / Alias *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Hezbollah, Vladimir Putin, Al-Shabaab, Wagner Group..."
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-2.5 placeholder-[#CBD5E1] focus:outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">
                Actor Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2.5 focus:outline-none focus:border-[#2563EB] transition-colors appearance-none"
              >
                {ACTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">
                Primary Region
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2.5 focus:outline-none focus:border-[#2563EB] transition-colors appearance-none"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">
                Additional Context
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Focus area, specific time period, known aliases, prior incidents..."
                rows={3}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-3 placeholder-[#CBD5E1] focus:outline-none focus:border-[#2563EB] transition-colors resize-none"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading || !name.trim()}
              className="w-full font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white py-3 hover:bg-[#3B82F6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-700"
            >
              {loading ? '◆ Generating Dossier...' : '◆ Generate Intelligence Profile →'}
            </button>

            <div className="text-[0.65rem] text-[#94A3B8] leading-relaxed">
              Analysis based on open-source public information only. Not a substitute for classified intelligence products.
            </div>

            {/* Threat badge */}
            {displayThreat && (
              <div className="border-t border-[#E2E8F0] pt-4">
                <div className="font-mono-custom text-[0.65rem] tracking-[0.15em] uppercase text-[#94A3B8] mb-2">Threat Level</div>
                <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-sm"
                  style={{ color: THREAT_COLORS[displayThreat] ?? '#64748B', borderColor: (THREAT_COLORS[displayThreat] ?? '#64748B') + '50', background: (THREAT_COLORS[displayThreat] ?? '#64748B') + '10' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: THREAT_COLORS[displayThreat] ?? '#64748B' }} />
                  <span className="font-mono-custom text-[0.75rem] tracking-[0.2em]">{displayThreat}</span>
                </div>
              </div>
            )}

            {/* PMESII mini-bars */}
            {displayPmesii.some(p => p.value > 0) && (
              <div className="border-t border-[#E2E8F0] pt-4 space-y-3">
                <div className="font-mono-custom text-[0.65rem] tracking-[0.15em] uppercase text-[#94A3B8] mb-2">PMESII Threat Index</div>
                {displayPmesii.map(p => (
                  <ThreatBar key={p.label} label={p.label} value={p.value} justify="" />
                ))}
              </div>
            )}
          </div>

          {/* Profile output */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 px-5 py-3 text-[0.85rem] text-red-700 font-mono-custom mb-4">
                Error: {error}
              </div>
            )}

            {loading && (
              <div className="bg-white border border-[#E2E8F0] p-16 text-center">
                <div className="text-[#2563EB] text-4xl mb-4 animate-pulse">◆</div>
                <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B] mb-2">
                  Generating Intelligence Profile
                </div>
                <div className="text-[0.75rem] text-[#94A3B8]">
                  Analyzing open-source data across OSINT repositories...
                </div>
              </div>
            )}

            {displayProfile && !loading && (
              <div className="bg-white border border-[#E2E8F0]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <div className="flex items-center gap-3">
                    <span className="text-[#2563EB]">◆</span>
                    <span className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#0F172A]">
                      OSINT Intelligence Profile
                    </span>
                    {viewingDossier && (
                      <span className="font-mono-custom text-[0.65rem] text-[#64748B]">— {viewingDossier.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono-custom text-[0.65rem] text-[#94A3B8]">
                      {type} · {region}
                    </span>
                    <button
                      onClick={() => {
                        const blob = new Blob([displayProfile], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `KAIROS-${(viewingDossier?.name ?? name).replace(/\s+/g, '_')}-profile.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="font-mono-custom text-[0.65rem] tracking-[0.1em] uppercase text-[#2563EB] hover:text-[#3B82F6] transition-colors border border-[#DBEAFE] px-3 py-1"
                    >
                      ↓ Export
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-[700px] overflow-y-auto">
                  <MarkdownSection text={displayProfile} />
                </div>
              </div>
            )}

            {!displayProfile && !loading && !error && (
              <div className="bg-white border border-[#E2E8F0] p-16 text-center">
                <div className="text-[#CBD5E1] text-5xl mb-4">◆</div>
                <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#94A3B8] mb-2">
                  No Profile Loaded
                </div>
                <p className="text-[0.8rem] text-[#CBD5E1]">
                  Enter a subject name and run the analysis to generate an intelligence profile.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
