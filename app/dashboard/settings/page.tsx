'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [analyst, setAnalyst] = useState('GC');
  const [org, setOrg] = useState('');
  const [classLevel, setClassLevel] = useState('UNCLASSIFIED');
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <div className="font-mono-custom text-[0.7rem] tracking-[0.25em] uppercase text-[#2563EB] mb-1">
          ○ SETTINGS · Configuration
        </div>
        <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
          Platform Settings
        </h1>
      </div>

      {/* Analyst profile */}
      <div className="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B] border-b border-[#E2E8F0] pb-4">
          Analyst Profile
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">Analyst Initials</label>
            <input value={analyst} onChange={e => setAnalyst(e.target.value)}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-2.5 focus:outline-none focus:border-[#2563EB] transition-colors" />
          </div>
          <div>
            <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">Organization</label>
            <input value={org} onChange={e => setOrg(e.target.value)} placeholder="Optional"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-4 py-2.5 placeholder-[#CBD5E1] focus:outline-none focus:border-[#2563EB] transition-colors" />
          </div>
        </div>
        <div>
          <label className="font-mono-custom text-[0.7rem] tracking-[0.15em] uppercase text-[#475569] block mb-2">Default Classification Marking</label>
          <select value={classLevel} onChange={e => setClassLevel(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] text-base px-3 py-2.5 focus:outline-none focus:border-[#2563EB] transition-colors appearance-none">
            {['UNCLASSIFIED', 'UNCLASSIFIED // FOUO', 'SENSITIVE', 'CONFIDENTIAL'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* API config */}
      <div className="bg-white border border-[#E2E8F0] p-6 space-y-5">
        <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B] border-b border-[#E2E8F0] pb-4">
          AI Engine
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-mono-custom text-[0.7rem] tracking-[0.1em] uppercase text-[#334155]">Anthropic Claude</div>
            <div className="text-[0.75rem] text-[#94A3B8] mt-0.5">claude-sonnet-4-6 · Configured via .env.local</div>
          </div>
          <span className="font-mono-custom text-[0.65rem] px-3 py-1 bg-green-50 text-green-700 border border-green-200">CONNECTED</span>
        </div>
        <div className="flex items-center justify-between py-2 border-t border-[#E2E8F0]">
          <div>
            <div className="font-mono-custom text-[0.7rem] tracking-[0.1em] uppercase text-[#334155]">Supabase Database</div>
            <div className="text-[0.75rem] text-[#94A3B8] mt-0.5">Required for session persistence and auth</div>
          </div>
          <span className="font-mono-custom text-[0.65rem] px-3 py-1 bg-[#F8FAFC] text-[#94A3B8] border border-[#E2E8F0]">NOT CONFIGURED</span>
        </div>
      </div>

      {/* Deployment */}
      <div className="bg-white border border-[#E2E8F0] p-6 space-y-4">
        <div className="font-mono-custom text-[0.7rem] tracking-[0.2em] uppercase text-[#64748B] border-b border-[#E2E8F0] pb-4">
          Deployment
        </div>
        <div className="space-y-3 text-[0.8rem] text-[#475569]">
          <p>To deploy on Vercel with Supabase auth, follow these steps:</p>
          <ol className="space-y-2 list-none">
            {[
              'Push this repo to GitHub',
              'Import the repo in vercel.com → New Project',
              'Add environment variables: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY',
              'Create a Supabase project → enable Email auth → copy URL + anon key',
              'Deploy — Vercel auto-builds on every push',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-mono-custom text-[0.65rem] text-[#2563EB] flex-shrink-0 pt-0.5">0{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <button onClick={save}
        className="font-mono-custom text-[0.75rem] tracking-[0.2em] uppercase bg-[#2563EB] text-white px-8 py-3 hover:bg-[#3B82F6] transition-colors">
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
