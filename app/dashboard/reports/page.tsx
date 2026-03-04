'use client';
import Link from 'next/link';

const tools = [
  {
    icon: '△',
    name: 'ORACLE',
    label: 'Strategy Navigator',
    href: '/dashboard/oracle',
    color: '#2563EB',
    description: 'Model negotiations, map stakeholders, get COA recommendations.',
  },
  {
    icon: '◈',
    name: 'SENTINEL',
    label: 'Horizon Watch',
    href: '/dashboard/sentinel',
    color: '#0284C7',
    description: 'Geopolitical risk forecasting across the PMESII spectrum.',
  },
  {
    icon: '◆',
    name: 'ACTOR',
    label: 'Intelligence Module',
    href: '/dashboard/actor',
    color: '#7C3AED',
    description: 'OSINT-based dossiers on individuals, groups, and state actors.',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-1">
          ▷ REPORTS · Archive
        </div>
        <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
          Intelligence Reports
        </h1>
        <p className="text-[0.85rem] text-[#64748B] mt-1">
          Reports are generated live by each tool. Export from within a tool to save locally.
        </p>
      </div>

      {/* Session note */}
      <div className="bg-[#DBEAFE] border border-[#BFDBFE] px-5 py-4 flex items-start gap-3">
        <span className="text-[#2563EB] text-lg flex-shrink-0">ℹ</span>
        <div>
          <div className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#1D4ED8] mb-1">Session Storage Only</div>
          <p className="text-[0.8rem] text-[#1D4ED8]">
            Analyses run during this session are stored in-memory within each tool. To persist reports across sessions, connect a Supabase database or use the Export button within each tool to download as a text file.
          </p>
        </div>
      </div>

      {/* Quick launch */}
      <div>
        <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#94A3B8] mb-4">Generate New Report</div>
        <div className="grid md:grid-cols-3 gap-4">
          {tools.map(t => (
            <Link key={t.name} href={t.href}
              className="bg-white border border-[#E2E8F0] p-5 hover:border-[#2563EB] hover:shadow-sm transition-all group">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: t.color }} className="text-lg">{t.icon}</span>
                <div>
                  <div className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase font-700" style={{ color: t.color }}>{t.name}</div>
                  <div className="text-[0.65rem] text-[#94A3B8]">{t.label}</div>
                </div>
              </div>
              <p className="text-[0.8rem] text-[#64748B] group-hover:text-[#334155] transition-colors leading-relaxed">
                {t.description}
              </p>
              <div className="mt-3 font-mono-custom text-[0.65rem] text-[#2563EB] group-hover:underline">
                Open Tool →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Export instructions */}
      <div className="bg-white border border-[#E2E8F0] p-6">
        <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#334155] mb-4 pb-3 border-b border-[#E2E8F0]">
          How to Save Reports
        </div>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Run an Analysis', desc: 'Use ORACLE, SENTINEL, or Actor Intelligence to generate a report.' },
            { step: '02', title: 'Export as Text', desc: 'Click the ↓ Export button in the results panel to download the full report as a .txt file.' },
            { step: '03', title: 'Persistent Storage (Optional)', desc: 'Connect Supabase to automatically save all sessions to your database. See Settings to configure.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="font-mono-custom text-[0.65rem] text-[#2563EB] w-6 flex-shrink-0 pt-0.5">{s.step}</div>
              <div>
                <div className="font-mono-custom text-[0.7rem] tracking-[0.1em] uppercase text-[#334155] mb-0.5">{s.title}</div>
                <p className="text-[0.8rem] text-[#64748B]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
