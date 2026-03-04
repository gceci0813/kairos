'use client';
import Link from 'next/link';

const tools = [
  {
    name: 'ORACLE',
    label: 'Strategy Navigator',
    href: '/dashboard/oracle',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    description: 'Model negotiations, map stakeholders, get COA recommendations.',
  },
  {
    name: 'SENTINEL',
    label: 'Horizon Watch',
    href: '/dashboard/sentinel',
    color: '#2563EB',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    description: 'Geopolitical risk forecasting across the PMESII spectrum.',
  },
  {
    name: 'ACTOR',
    label: 'Intelligence Module',
    href: '/dashboard/actor',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    description: 'OSINT-based dossiers on individuals, groups, and state actors.',
  },
];

const steps = [
  {
    step: '01',
    title: 'Run an Analysis',
    desc: 'Use ORACLE, SENTINEL, or Actor Intelligence to generate a report.',
  },
  {
    step: '02',
    title: 'Export as Text',
    desc: 'Click the Export button in the results panel to download the full report as a .txt file.',
  },
  {
    step: '03',
    title: 'Persistent Storage (Optional)',
    desc: 'Connect Supabase to automatically save all sessions to your database. See Settings to configure.',
  },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          Reports · Archive
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Intelligence Reports
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Reports are generated live by each tool. Export from within a tool to save locally.
        </p>
      </div>

      {/* Session note */}
      <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-5 py-4 flex items-start gap-3">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#2563EB] flex-shrink-0 mt-0.5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-xs font-bold text-[#1D4ED8] tracking-wide uppercase mb-0.5">Session Storage Only</p>
          <p className="text-sm text-[#1D4ED8]">
            Analyses are stored in-memory within each tool. To persist reports, connect a Supabase database or use the Export button to download as a text file.
          </p>
        </div>
      </div>

      {/* Generate new report */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-4">Generate New Report</p>
        <div className="grid md:grid-cols-3 gap-4">
          {tools.map(t => (
            <Link key={t.name} href={t.href}
              className="group rounded-xl p-5 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              style={{ background: t.bg, borderColor: t.border }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase mb-0.5" style={{ color: t.color }}>{t.name}</p>
                  <p className="text-xs text-[#94A3B8]">{t.label}</p>
                </div>
                <span className="text-base transition-transform duration-200 group-hover:translate-x-1" style={{ color: t.color }}>→</span>
              </div>
              <p className="text-sm text-[#475569] leading-relaxed">{t.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* How to save */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#0F172A] mb-5 pb-3 border-b border-[#E2E8F0]">How to Save Reports</h2>
        <div className="space-y-5">
          {steps.map(s => (
            <div key={s.step} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#2563EB]">{s.step}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A] mb-0.5">{s.title}</p>
                <p className="text-sm text-[#64748B]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
