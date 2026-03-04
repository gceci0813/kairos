'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── Data ──────────────────────────────────────────────────────── */

const alerts = [
  { id: 1, level: 'HIGH', region: 'East Asia',      event: 'Taiwan Strait — Elevated Naval Activity Detected',            time: '14 min ago', color: '#DC2626' },
  { id: 2, level: 'MED',  region: 'Middle East',    event: 'Gulf Back-Channel Negotiations — New Signals Intercepted',    time: '1 hr ago',   color: '#D97706' },
  { id: 3, level: 'HIGH', region: 'Eastern Europe', event: 'Border Zone — Hybrid Operations Indicators Rising',           time: '2 hr ago',   color: '#DC2626' },
  { id: 4, level: 'LOW',  region: 'West Africa',    event: 'Regional Body Emergency Session — Instability Risk Elevated', time: '3 hr ago',   color: '#16A34A' },
  { id: 5, level: 'MED',  region: 'Americas',       event: 'Venezuela — Political Consolidation Moves Detected',          time: '5 hr ago',   color: '#D97706' },
  { id: 6, level: 'HIGH', region: 'Central Asia',   event: 'Cyber Intrusion Campaign — Critical Infrastructure Targeted', time: '6 hr ago',   color: '#DC2626' },
];

const regions = [
  { name: 'East Asia',      risk: 82, trend: 'up' },
  { name: 'Eastern Europe', risk: 75, trend: 'up' },
  { name: 'Middle East',    risk: 67, trend: 'stable' },
  { name: 'West Africa',    risk: 58, trend: 'up' },
  { name: 'Central Asia',   risk: 51, trend: 'up' },
  { name: 'South Asia',     risk: 44, trend: 'stable' },
  { name: 'Latin America',  risk: 39, trend: 'down' },
  { name: 'Southeast Asia', risk: 35, trend: 'stable' },
];

const analyses = [
  { name: 'US-Japan Bilateral Investment Framework',      status: 'ACTIVE',     progress: 78, confidence: 'HIGH' },
  { name: 'Rare Earth Concession Negotiation',            status: 'MONITORING', progress: 45, confidence: 'MED' },
  { name: 'Cross-Border Payments Regulatory Alignment',   status: 'ACTIVE',     progress: 62, confidence: 'HIGH' },
  { name: 'Nuclear Energy Partnership — EPC Contract',    status: 'ADVISORY',   progress: 33, confidence: 'MED' },
];

const osintSources = [
  {
    category: 'Conflict Tracking',
    color: '#DC2626',
    icon: '⚡',
    sources: [
      { name: 'ACLED',         desc: 'Armed Conflict Location & Event Data project', url: 'https://acleddata.com/dashboard/' },
      { name: 'LiveUAMap',     desc: 'Real-time conflict mapping and incident feed',  url: 'https://liveuamap.com' },
      { name: 'Crisis Group',  desc: 'ICG world crisis watch and alert tracker',      url: 'https://www.crisisgroup.org/crisiswatch' },
    ],
  },
  {
    category: 'Satellite & Imagery',
    color: '#2563EB',
    icon: '🛰',
    sources: [
      { name: 'Sentinel Hub',  desc: 'ESA Copernicus live Earth Observation browser', url: 'https://apps.sentinel-hub.com/eo-browser/' },
      { name: 'NASA Worldview',desc: 'Near real-time NASA satellite imagery viewer',  url: 'https://worldview.earthdata.nasa.gov' },
      { name: 'Planet Labs',   desc: 'Daily satellite imagery — public explorer demo', url: 'https://www.planet.com/explorer/' },
    ],
  },
  {
    category: 'Open Cameras & Feeds',
    color: '#7C3AED',
    icon: '📷',
    sources: [
      { name: 'EarthCam',      desc: 'Public live webcams — cities and landmarks worldwide', url: 'https://www.earthcam.com' },
      { name: 'Windy Webcams', desc: 'Geo-tagged public webcam network global',          url: 'https://www.windy.com/webcams' },
      { name: 'Insecam',       desc: 'Directory of publicly accessible network cameras',  url: 'http://www.insecam.org' },
    ],
  },
  {
    category: 'Maritime & Aviation',
    color: '#0284C7',
    icon: '🚢',
    sources: [
      { name: 'MarineTraffic', desc: 'Real-time AIS global vessel tracking',          url: 'https://www.marinetraffic.com' },
      { name: 'Flightradar24', desc: 'Live aircraft tracking and flight data',         url: 'https://www.flightradar24.com' },
      { name: 'VesselFinder',  desc: 'AIS ship positions and port movements',          url: 'https://www.vesselfinder.com' },
    ],
  },
  {
    category: 'Sanctions & Databases',
    color: '#16A34A',
    icon: '🔍',
    sources: [
      { name: 'OFAC SDN List', desc: 'US Treasury sanctions and designated entities',  url: 'https://sanctionssearch.ofac.treas.gov' },
      { name: 'OpenSanctions', desc: 'Global sanctions and PEP open database',         url: 'https://www.opensanctions.org' },
      { name: 'UN Sanctions',  desc: 'UN Security Council consolidated sanctions list', url: 'https://www.un.org/securitycouncil/sanctions/information' },
    ],
  },
  {
    category: 'News Intelligence',
    color: '#D97706',
    icon: '📰',
    sources: [
      { name: 'GDELT Project', desc: 'Global event database — open big data platform',  url: 'https://www.gdeltproject.org' },
      { name: 'Media Cloud',   desc: 'Open news tracking and media analysis platform',  url: 'https://search.mediacloud.org' },
      { name: 'AllSides',      desc: 'Cross-source news bias tracking and comparison',  url: 'https://www.allsides.com/unbiased-balanced-news' },
    ],
  },
];

/* ─── Small components ──────────────────────────────────────────── */

function RiskBar({ value, trend }: { value: number; trend: string }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : '#16A34A';
  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const arrowColor = trend === 'up' ? '#DC2626' : trend === 'down' ? '#16A34A' : '#94A3B8';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-sm font-bold font-mono-custom" style={{ color }}>{value}</span>
      <span className="w-4 text-sm font-bold" style={{ color: arrowColor }}>{arrow}</span>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:     'bg-green-50 text-green-700 ring-1 ring-green-200',
  MONITORING: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200',
  ADVISORY:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

const TABS = ['Situation', 'Threat Index', 'Open Sources', 'Analyses'] as const;
type Tab = typeof TABS[number];

/* ─── Page ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [tab, setTab]   = useState<Tab>('Situation');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-7xl space-y-6">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
            Intelligence Overview
          </p>
          <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
            Global Situation Report
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-4 py-2.5 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-sm font-medium text-[#475569]">Live · {tick * 5}s ago</span>
        </div>
      </div>

      {/* ── Tool cards ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { href: '/dashboard/oracle',   label: 'ORACLE',   sub: 'Strategy Navigator',  color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
          { href: '/dashboard/sentinel', label: 'SENTINEL', sub: 'Horizon Watch',        color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' },
          { href: '/dashboard/actor',    label: 'ACTOR',    sub: 'Intelligence Module',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
        ].map(({ href, label, sub, color, bg, border }) => (
          <Link key={href} href={href}
            className="group rounded-xl p-6 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            style={{ background: bg, borderColor: border }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold tracking-widest uppercase" style={{ color }}>{label}</span>
              <span className="text-lg transition-transform duration-200 group-hover:translate-x-1" style={{ color }}>→</span>
            </div>
            <p className="text-base text-[#475569] font-medium">{sub}</p>
          </Link>
        ))}
      </div>

      {/* ── Tabbed panel ────────────────────────────────── */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-[#E2E8F0] bg-[#FAFAFA]">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-7 py-4 text-sm font-semibold tracking-wide border-b-2 -mb-px transition-all duration-150 ${
                tab === t
                  ? 'border-[#2563EB] text-[#2563EB] bg-white'
                  : 'border-transparent text-[#64748B] hover:text-[#334155] hover:bg-white/60'
              }`}>
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center px-6">
            <span className="text-xs text-[#94A3B8] font-medium">6 active signals</span>
          </div>
        </div>

        {/* ── Situation ───────────────────────────────── */}
        {tab === 'Situation' && (
          <div className="grid lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#F1F5F9]">

            {/* Alert queue */}
            <div className="lg:col-span-3">
              <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  <span className="text-sm font-bold text-[#0F172A]">Active Alert Queue</span>
                </div>
                <span className="text-xs text-[#94A3B8] font-medium">{alerts.length} signals</span>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {alerts.map(a => (
                  <div key={a.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#FAFAFA] cursor-pointer group transition-colors">
                    <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-md flex-shrink-0 mt-0.5"
                      style={{ color: a.color, background: a.color + '15', border: `1px solid ${a.color}30` }}>
                      {a.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#334155] group-hover:text-[#0F172A] transition-colors leading-snug">
                        {a.event}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-1">{a.region}</p>
                    </div>
                    <span className="text-xs text-[#94A3B8] flex-shrink-0 mt-0.5 whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional risk */}
            <div className="lg:col-span-2">
              <div className="px-6 py-4 border-b border-[#F1F5F9]">
                <span className="text-sm font-bold text-[#0F172A]">Regional Risk Index</span>
              </div>
              <div className="px-6 py-5 space-y-5">
                {regions.map(r => (
                  <div key={r.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#475569]">{r.name}</span>
                    </div>
                    <RiskBar value={r.risk} trend={r.trend} />
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-[#F1F5F9] flex gap-5">
                <span className="text-xs font-semibold text-[#DC2626]">● HIGH &gt;70</span>
                <span className="text-xs font-semibold text-[#D97706]">● MED &gt;50</span>
                <span className="text-xs font-semibold text-[#16A34A]">● LOW</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Threat Index ─────────────────────────────── */}
        {tab === 'Threat Index' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Critical Zones',  value: '3',  sub: 'Risk score above 70',  color: '#DC2626', bg: '#FEF2F2' },
                { label: 'Elevated Zones',  value: '2',  sub: 'Risk score 50 – 70',   color: '#D97706', bg: '#FFFBEB' },
                { label: 'Active Alerts',   value: '6',  sub: 'In last 24 hours',      color: '#2563EB', bg: '#EFF6FF' },
                { label: 'Feeds Live',      value: '18', sub: 'Open-source streams',   color: '#16A34A', bg: '#F0FDF4' },
              ].map(({ label, value, sub, color, bg }) => (
                <div key={label} className="rounded-xl border border-[#E2E8F0] p-5" style={{ background: bg }}>
                  <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-2">{label}</p>
                  <p className="text-4xl font-display font-800 mb-1" style={{ color }}>{value}</p>
                  <p className="text-xs text-[#94A3B8]">{sub}</p>
                </div>
              ))}
            </div>

            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#FAFAFA]">
                <span className="text-sm font-bold text-[#0F172A]">Full Regional Risk Breakdown</span>
              </div>
              <div className="divide-y divide-[#F8FAFC]">
                {regions.map(r => {
                  const color = r.risk > 70 ? '#DC2626' : r.risk > 50 ? '#D97706' : '#16A34A';
                  return (
                    <div key={r.name} className="px-6 py-4 flex items-center gap-5">
                      <span className="w-36 text-sm font-medium text-[#334155]">{r.name}</span>
                      <div className="flex-1 h-2.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.risk}%`, background: color }} />
                      </div>
                      <span className="w-8 text-right text-sm font-bold font-mono-custom" style={{ color }}>{r.risk}</span>
                      <span className="w-4 text-sm font-bold"
                        style={{ color: r.trend === 'up' ? '#DC2626' : r.trend === 'down' ? '#16A34A' : '#94A3B8' }}>
                        {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Open Sources ─────────────────────────────── */}
        {tab === 'Open Sources' && (
          <div className="p-6 space-y-5">
            <p className="text-base text-[#475569] leading-relaxed">
              Curated directory of publicly available intelligence feeds, live tracking systems, and open databases. All sources are freely accessible.
            </p>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {osintSources.map(group => (
                <div key={group.category} className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-3"
                    style={{ background: group.color + '08' }}>
                    <span className="text-base">{group.icon}</span>
                    <span className="text-sm font-bold tracking-wide" style={{ color: group.color }}>
                      {group.category}
                    </span>
                  </div>
                  <div className="divide-y divide-[#F8FAFC]">
                    {group.sources.map(src => (
                      <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start justify-between gap-3 px-5 py-4 hover:bg-[#FAFAFA] transition-colors group">
                        <div>
                          <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors mb-0.5">{src.name}</p>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">{src.desc}</p>
                        </div>
                        <span className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors text-base mt-0.5 flex-shrink-0">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analyses ─────────────────────────────────── */}
        {tab === 'Analyses' && (
          <div>
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F172A]">ORACLE — Recent Analyses</span>
              <Link href="/dashboard/oracle"
                className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                Open ORACLE →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    {['Scenario', 'Status', 'Progress', 'Confidence', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold tracking-widest uppercase text-[#94A3B8]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {analyses.map((n, i) => (
                    <tr key={i} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-5 text-sm font-medium text-[#334155] group-hover:text-[#0F172A] max-w-xs transition-colors">
                        {n.name}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-xs font-semibold tracking-wider uppercase px-3 py-1 rounded-full ${STATUS_STYLES[n.status] ?? STATUS_STYLES.MONITORING}`}>
                          {n.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${n.progress}%` }} />
                          </div>
                          <span className="text-sm font-semibold text-[#475569]">{n.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-bold ${n.confidence === 'HIGH' ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                          {n.confidence}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <Link href="/dashboard/oracle"
                          className="text-sm font-semibold text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
