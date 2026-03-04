'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ROLE_LABELS, ROLE_COLORS, ROLE_PERMISSIONS, Role } from '@/lib/rbac-types';

const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-4 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-2';

export default function SettingsPage() {
  const [analyst, setAnalyst]       = useState('GC');
  const [org, setOrg]               = useState('');
  const [classLevel, setClassLevel] = useState('UNCLASSIFIED');
  const [saved, setSaved]           = useState(false);

  // Role / access
  const [role, setRole]           = useState<Role | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    fetch('/api/admin/user-role')
      .then(r => r.json())
      .then(d => {
        if (d.role)  setRole(d.role as Role);
        if (d.email) setUserEmail(d.email);
      })
      .catch(() => setRole('analyst'));
  }, []);

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

      {/* Account & Access card */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-4">Account & Access</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0F172A]">{userEmail || 'Current User'}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">Authenticated session</p>
          </div>
          {role && (
            <span className={`text-xs font-bold tracking-wide px-3 py-1.5 rounded-full border ${ROLE_COLORS[role]}`}>
              {role.toUpperCase()}
            </span>
          )}
        </div>

        {role && (
          <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-[#64748B] tracking-wide uppercase">
              {ROLE_LABELS[role]} — Permissions
            </p>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[role].map(p => (
                <li key={p} className="text-xs text-[#64748B] flex items-start gap-1.5">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            {role === 'admin' && (
              <div className="pt-2 border-t border-[#E2E8F0]">
                <Link
                  href="/dashboard/admin"
                  className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors">
                  → Open Admin Panel
                </Link>
              </div>
            )}
          </div>
        )}
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
            sub: 'AI analysis engine · Active',
            status: 'CONNECTED',
            statusStyle: 'bg-green-50 text-green-700 border-green-200',
          },
          {
            name: 'Supabase Database',
            sub: 'User authentication & audit logging · Active',
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

      <button
        onClick={save}
        className="bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg px-8 py-3 transition-colors shadow-sm">
        {saved ? '✓ Saved' : 'Save Settings'}
      </button>
    </div>
  );
}
