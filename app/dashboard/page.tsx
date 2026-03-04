'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const alerts = [
  { id: 1, level: 'HIGH', region: 'East Asia', event: 'Taiwan Strait — Elevated Naval Activity Detected', time: '14 min ago', color: '#DC2626' },
  { id: 2, level: 'MED', region: 'Middle East', event: 'Gulf Back-Channel Negotiations — New Signals', time: '1 hr ago', color: '#D97706' },
  { id: 3, level: 'HIGH', region: 'Eastern Europe', event: 'Border Zone — Hybrid Operations Indicators', time: '2 hr ago', color: '#DC2626' },
  { id: 4, level: 'LOW', region: 'West Africa', event: 'Regional Body Emergency Session — Instability Risk', time: '3 hr ago', color: '#16A34A' },
  { id: 5, level: 'MED', region: 'Americas', event: 'Venezuela — Political Consolidation Moves Detected', time: '5 hr ago', color: '#D97706' },
];

const regions = [
  { name: 'East Asia', risk: 82, trend: 'up' },
  { name: 'Middle East', risk: 67, trend: 'stable' },
  { name: 'Eastern Europe', risk: 75, trend: 'up' },
  { name: 'West Africa', risk: 58, trend: 'up' },
  { name: 'South Asia', risk: 44, trend: 'stable' },
  { name: 'Latin America', risk: 39, trend: 'down' },
];

const analyses = [
  { name: 'US-Japan Bilateral Investment Framework', status: 'ACTIVE', progress: 78, confidence: 'HIGH' },
  { name: 'Rare Earth Concession Negotiation', status: 'MONITORING', progress: 45, confidence: 'MED' },
  { name: 'Cross-Border Payments Regulatory Alignment', status: 'ACTIVE', progress: 62, confidence: 'HIGH' },
  { name: 'Nuclear Energy Partnership — EPC Contract', status: 'ADVISORY', progress: 33, confidence: 'MED' },
];

function RiskBar({ value, trend }: { value: number; trend: string }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : '#16A34A';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 bg-[#0F172A] relative overflow-hidden">
        <div className="h-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-mono-custom text-base w-8 text-right" style={{ color }}>{value}</span>
      <span className="text-base text-[#64748B]">
        {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-mono-custom text-base tracking-[0.25em] uppercase text-[#64748B] mb-1">
            Intelligence Overview
          </div>
          <h1 className="font-display font-800 text-3xl text-[#0F172A] tracking-tight">
            Global Situation Report
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E2E8F0] px-4 py-2">
          <div className="alert-dot" />
          <span className="font-mono-custom text-base tracking-[0.15em] uppercase text-[#475569]">
            Live • Updated {tick * 5}s ago
          </span>
        </div>
      </div>

      {/* Quick-launch tools */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/dashboard/oracle"
          className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 hover:border-[#2563EB] transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#2563EB] text-xl">△</span>
            <span className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#2563EB]">ORACLE</span>
          </div>
          <div className="text-base text-[#475569] group-hover:text-[#0F172A] transition-colors">
            Model a negotiation, map stakeholders, and get AI strategy recommendations →
          </div>
        </Link>
        <Link href="/dashboard/sentinel"
          className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 hover:border-[#0284C7] transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#0284C7] text-xl">◈</span>
            <span className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#0EA5E9]">SENTINEL</span>
          </div>
          <div className="text-base text-[#475569] group-hover:text-[#0F172A] transition-colors">
            Ask any geopolitical question and get an AI-powered risk forecast →
          </div>
        </Link>
        <Link href="/dashboard/actor"
          className="bg-[#FFFFFF] border border-[#E2E8F0] p-5 hover:border-[#7C3AED] transition-all duration-300 group">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[#7C3AED] text-xl">◆</span>
            <span className="font-mono-custom text-[0.85rem] tracking-[0.15em] uppercase text-[#7C3AED]">ACTOR</span>
          </div>
          <div className="text-base text-[#475569] group-hover:text-[#0F172A] transition-colors">
            Generate OSINT dossiers on individuals, groups, and threat actors →
          </div>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Alerts feed */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="alert-dot" />
              <span className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#0F172A]">
                Active Alert Queue
              </span>
            </div>
            <span className="font-mono-custom text-[0.85rem] text-[#0284C7]">◈ SENTINEL</span>
          </div>
          <div className="divide-y divide-[#0F172A]">
            {alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-[#F1F5F9] transition-colors group cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="font-mono-custom text-[0.85rem] tracking-[0.1em] px-2 py-1 border flex-shrink-0 mt-0.5"
                      style={{ color: alert.color, borderColor: alert.color + '40', background: alert.color + '10' }}>
                      {alert.level}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[0.85rem] text-[#475569] group-hover:text-[#0F172A] transition-colors leading-snug">
                        {alert.event}
                      </div>
                      <div className="font-mono-custom text-base text-[#64748B] mt-1">{alert.region}</div>
                    </div>
                  </div>
                  <span className="font-mono-custom text-[0.85rem] text-[#64748B] flex-shrink-0">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional risk */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0]">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <span className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#0F172A]">
              Regional Risk Index
            </span>
          </div>
          <div className="px-6 py-4 space-y-5">
            {regions.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.85rem] text-[#475569]">{r.name}</span>
                </div>
                <RiskBar value={r.risk} trend={r.trend} />
              </div>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-[#E2E8F0]">
            <div className="flex gap-4 text-base font-mono-custom">
              <span className="text-[#DC2626]">▲ High &gt;70</span>
              <span className="text-[#D97706]">▲ Med &gt;50</span>
              <span className="text-[#16A34A]">● Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* ORACLE analyses */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <span className="font-mono-custom text-base tracking-[0.2em] uppercase text-[#0F172A]">
            ORACLE — Recent Analyses
          </span>
          <Link href="/dashboard/oracle" className="font-mono-custom text-[0.85rem] text-[#2563EB] hover:text-[#2563EB] transition-colors">
            △ Open ORACLE →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['Scenario', 'Status', 'Progress', 'Confidence', 'Action'].map(h => (
                  <th key={h} className="px-6 py-3 text-left font-mono-custom text-[0.85rem] tracking-[0.2em] uppercase text-[#64748B]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {analyses.map((n, i) => (
                <tr key={i} className="hover:bg-[#F1F5F9] transition-colors group">
                  <td className="px-6 py-4 text-[0.85rem] text-[#475569] group-hover:text-[#0F172A] max-w-xs transition-colors">
                    {n.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono-custom text-[0.85rem] tracking-[0.1em] px-2 py-1 border ${
                      n.status === 'ACTIVE' ? 'text-[#16A34A] border-[#16A34A]/30 bg-[#16A34A]/05' :
                      n.status === 'ADVISORY' ? 'text-[#2563EB] border-[#2563EB]/30 bg-[#2563EB]/05' :
                      'text-[#475569] border-[#475569]/30'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1 bg-[#0F172A]">
                        <div className="h-full bg-[#2563EB]" style={{ width: `${n.progress}%` }} />
                      </div>
                      <span className="font-mono-custom text-base text-[#475569]">{n.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono-custom text-base ${
                      n.confidence === 'HIGH' ? 'text-[#16A34A]' : 'text-[#D97706]'
                    }`}>
                      {n.confidence}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href="/dashboard/oracle" className="font-mono-custom text-base tracking-[0.1em] uppercase text-[#2563EB] hover:text-[#2563EB] transition-colors">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
