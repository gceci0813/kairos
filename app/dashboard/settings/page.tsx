'use client';
import { useState } from 'react';

const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-2';

export default function SettingsPage() {
  const [analyst, setAnalyst]     = useState('GC');
  const [org, setOrg]             = useState('');
  const [classLevel, setClassLevel] = useState('UNCLASSIFIED');
  const [saved, setSaved]         = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          Settings · Configuration
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Platform Settings
        </h1>
      </div>

      {/* Analyst profile */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Analyst Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Analyst Initials</label>
            <input
              value={analyst}
              onChange={e => setAnalyst(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Organization</label>
            <input
              value={org}
              onChange={e => setOrg(e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>Default Classification Marking</label>
          <select
            value={classLevel}
            onChange={e => setClassLevel(e.target.value)}
            className={inputClass}>
            {['UNCLASSIFIED', 'UNCLASSIFIED // FOUO', 'SENSITIVE', 'CONFIDENTIAL'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Engine */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">AI Engine & Integrations</h2>

        {[
          {
            name: 'Anthropic Claude',
            sub: 'claude-sonnet-4-6 · Configured via environment variables',
            status: 'CONNECTED',
            statusStyle: 'bg-green-50 text-green-700 border-green-200',
          },
          {
            name: 'Supabase Database',
            sub: 'Authentication and session persistence',
            status: 'CONNECTED',
            statusStyle: 'bg-green-50 text-green-700 border-green-200',
          },
        ].map((item, i) => (
          <div key={item.name}
            className={`flex items-center justify-between py-3 ${i > 0 ? 'border-t border-[#F1F5F9]' : ''}`}>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">{item.name}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{item.sub}</p>
            </div>
            <span className={`text-xs font-bold tracking-wide px-3 py-1.5 rounded-full border ${item.statusStyle}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>

      {/* Deployment */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4 mb-5">Deployment Guide</h2>
        <div className="space-y-4">
          {[
            'Push this repository to GitHub',
            'Import the repo in vercel.com → New Project',
            'Add environment variables: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'Create a Supabase project → enable Email auth → copy URL and anon key',
            'Deploy — Vercel auto-builds on every push to main',
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#2563EB]">0{i + 1}</span>
              </div>
              <p className="text-sm text-[#475569] pt-1">{step}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={save}
        className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg px-8 py-3 transition-colors shadow-sm">
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
