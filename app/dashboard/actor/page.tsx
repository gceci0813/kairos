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
  HIGH:     '#DC2626',
  ELEVATED: '#D97706',
  MODERATE: '#2563EB',
  LOW:      '#16A34A',
};

const PMESII_DIMS = ['Political', 'Military', 'Economic', 'Social', 'Information', 'Infrastructure'];

function ThreatBar({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : value > 30 ? '#2563EB' : '#16A34A';
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium text-[#475569]">{label}</span>
        <span className="text-xs font-bold tabular-nums" style={{ color }}>{value}/100</span>
      </div>
      <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function MarkdownSection({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold text-[#0F172A] mt-8 mb-3 pb-2 border-b border-[#E2E8F0]">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xs font-bold tracking-widest uppercase text-[#2563EB] mt-5 mb-2">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <p key={i} className="text-xs font-bold tracking-wide uppercase text-[#334155] mt-3 mb-1">
              {line.slice(2, -2)}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
          return (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <span className="text-[#2563EB] text-sm mt-0.5 flex-shrink-0">&#9658;</span>
              <span className="text-sm text-[#334155] leading-relaxed">{content}</span>
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

function extractThreatLevel(text: string): string {
  const match = text.match(/CRITICAL|HIGH|ELEVATED|MODERATE|LOW/);
  return match ? match[0] : '';
}

function extractPmesiiScores(text: string): Array<{ label: string; value: number }> {
  return PMESII_DIMS.map(dim => {
    const pattern = new RegExp(`${dim}[:\\s]+(\\d+)`, 'i');
    const match = text.match(pattern);
    return { label: dim, value: match ? Math.min(100, parseInt(match[1])) : 0 };
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

const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-2';

export default function ActorPage() {
  const [name, setName]       = useState('');
  const [type, setType]       = useState('Individual');
  const [region, setRegion]   = useState('Global');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState('');
  const [threat, setThreat]   = useState('');
  const [pmesii, setPmesii]   = useState<Array<{ label: string; value: number }>>([]);
  const [error, setError]     = useState('');
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
  const displayThreat  = viewingDossier?.threat ?? threat;
  const displayPmesii  = viewingDossier ? extractPmesiiScores(viewingDossier.profile) : pmesii;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
            ACTOR &middot; OSINT Intelligence Module
          </p>
          <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
            Actor Intelligence &amp; Dossier
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            OSINT-based structured profiles on individuals, groups, organizations, and state actors.
          </p>
        </div>
        <div className="flex gap-2">
          {(['new', 'library'] as const).map(v => (
            <button key={v} onClick={() => setActiveView(v)}
              className={`text-sm font-semibold px-4 py-2.5 rounded-lg border transition-colors ${
                activeView === v
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
              }`}>
              {v === 'new' ? 'New Analysis' : `Dossier Library${dossiers.length > 0 ? ` (${dossiers.length})` : ''}`}
            </button>
          ))}
        </div>
      </div>

      {/* Library */}
      {activeView === 'library' && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <span className="text-sm font-bold text-[#0F172A]">Saved Dossiers</span>
            <span className="ml-2 text-xs text-[#94A3B8]">Session only</span>
          </div>
          {dossiers.length === 0 ? (
            <div className="p-16 text-center text-[#94A3B8] text-sm">No dossiers yet. Run an analysis to create one.</div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {dossiers.map(d => (
                <div key={d.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#FAFAFA] cursor-pointer group transition-colors"
                  onClick={() => loadDossier(d)}>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md border"
                      style={{
                        color: THREAT_COLORS[d.threat] ?? '#64748B',
                        borderColor: (THREAT_COLORS[d.threat] ?? '#64748B') + '40',
                        background: (THREAT_COLORS[d.threat] ?? '#64748B') + '10',
                      }}>
                      {d.threat || 'N/A'}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[#0F172A]">{d.name}</div>
                      <div className="text-xs text-[#94A3B8]">{d.type} &middot; {d.region}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#94A3B8]">{d.timestamp}</span>
                    <span className="text-xs font-semibold text-[#2563EB] group-hover:underline">View &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New analysis / results */}
      {activeView === 'new' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Input panel */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5 h-fit">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Subject Identification</h2>

            <div>
              <label className={labelClass}>Subject Name / Alias *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Hezbollah, Vladimir Putin, Al-Shabaab..."
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Actor Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
                {ACTOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Primary Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className={inputClass}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Additional Context <span className="text-[#9CA3AF] normal-case font-normal">(optional)</span></label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Focus area, specific time period, known aliases, prior incidents..."
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading || !name.trim()}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg py-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
              {loading ? 'Generating Dossier...' : 'Generate Intelligence Profile'}
            </button>

            <p className="text-xs text-[#9CA3AF] leading-relaxed">
              Analysis based on open-source public information only. Not a substitute for classified intelligence products.
            </p>

            {displayThreat && (
              <div className="border-t border-[#E2E8F0] pt-4">
                <p className={labelClass}>Threat Level</p>
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 border rounded-lg"
                  style={{
                    color: THREAT_COLORS[displayThreat] ?? '#64748B',
                    borderColor: (THREAT_COLORS[displayThreat] ?? '#64748B') + '50',
                    background: (THREAT_COLORS[displayThreat] ?? '#64748B') + '10',
                  }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: THREAT_COLORS[displayThreat] ?? '#64748B' }} />
                  <span className="text-sm font-bold tracking-wide">{displayThreat}</span>
                </div>
              </div>
            )}

            {displayPmesii.some(p => p.value > 0) && (
              <div className="border-t border-[#E2E8F0] pt-4">
                <p className={`${labelClass} mb-3`}>PMESII Threat Index</p>
                {displayPmesii.map(p => (
                  <ThreatBar key={p.label} label={p.label} value={p.value} />
                ))}
              </div>
            )}
          </div>

          {/* Profile output */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 mb-4">
                {error}
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-16 text-center">
                <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-[#475569]">Generating Intelligence Profile</p>
                <p className="text-xs text-[#94A3B8] mt-1">Analyzing open-source data across OSINT repositories...</p>
              </div>
            )}

            {displayProfile && !loading && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#FAFAFA]">
                  <div>
                    <span className="text-sm font-bold text-[#0F172A]">OSINT Intelligence Profile</span>
                    {viewingDossier && (
                      <span className="ml-2 text-xs text-[#64748B]">— {viewingDossier.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#94A3B8]">{type} &middot; {region}</span>
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
                      className="text-xs font-semibold text-[#2563EB] border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 rounded-md hover:bg-[#DBEAFE] transition-colors">
                      Export
                    </button>
                  </div>
                </div>
                <div className="p-6 max-h-[700px] overflow-y-auto">
                  <MarkdownSection text={displayProfile} />
                </div>
              </div>
            )}

            {!displayProfile && !loading && !error && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-16 text-center">
                <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-[#CBD5E1]">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#94A3B8] mb-1">No Profile Loaded</p>
                <p className="text-xs text-[#CBD5E1]">Enter a subject name and run the analysis to generate an intelligence profile.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
