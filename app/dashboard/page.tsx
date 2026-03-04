'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ─── Static Data ───────────────────────────────────────────────── */

const alerts = [
  { id: 1, level: 'HIGH',   region: 'East Asia',      event: 'Taiwan Strait — Elevated Naval Activity Detected',              time: '14 min', color: '#DC2626' },
  { id: 2, level: 'MED',    region: 'Middle East',     event: 'Gulf Back-Channel Negotiations — New Signals Intercepted',      time: '1 hr',   color: '#D97706' },
  { id: 3, level: 'HIGH',   region: 'Eastern Europe',  event: 'Border Zone — Hybrid Operations Indicators Rising',             time: '2 hr',   color: '#DC2626' },
  { id: 4, level: 'LOW',    region: 'West Africa',     event: 'Regional Body Emergency Session — Instability Risk Elevated',   time: '3 hr',   color: '#16A34A' },
  { id: 5, level: 'MED',    region: 'Americas',        event: 'Venezuela — Political Consolidation Moves Detected',            time: '5 hr',   color: '#D97706' },
  { id: 6, level: 'HIGH',   region: 'Central Asia',    event: 'Cyber Intrusion Campaign — Critical Infrastructure Targeted',   time: '6 hr',   color: '#DC2626' },
];

const regions = [
  { name: 'East Asia',       risk: 82, trend: 'up' },
  { name: 'Middle East',     risk: 67, trend: 'stable' },
  { name: 'Eastern Europe',  risk: 75, trend: 'up' },
  { name: 'West Africa',     risk: 58, trend: 'up' },
  { name: 'South Asia',      risk: 44, trend: 'stable' },
  { name: 'Latin America',   risk: 39, trend: 'down' },
  { name: 'Central Asia',    risk: 51, trend: 'up' },
  { name: 'Southeast Asia',  risk: 35, trend: 'stable' },
];

const analyses = [
  { name: 'US-Japan Bilateral Investment Framework',           status: 'ACTIVE',      progress: 78, confidence: 'HIGH' },
  { name: 'Rare Earth Concession Negotiation',                 status: 'MONITORING',  progress: 45, confidence: 'MED' },
  { name: 'Cross-Border Payments Regulatory Alignment',        status: 'ACTIVE',      progress: 62, confidence: 'HIGH' },
  { name: 'Nuclear Energy Partnership — EPC Contract',         status: 'ADVISORY',    progress: 33, confidence: 'MED' },
];

const osintSources = [
  {
    category: 'Conflict Tracking',
    color: '#DC2626',
    sources: [
      { name: 'ACLED',            desc: 'Armed Conflict Location & Event Data',      url: 'https://acleddata.com/dashboard/' },
      { name: 'LiveUAMap',        desc: 'Real-time conflict mapping & incident feed', url: 'https://liveuamap.com' },
      { name: 'Crisis Group',     desc: 'ICG world crisis watch & alerts',            url: 'https://www.crisisgroup.org/crisiswatch' },
    ],
  },
  {
    category: 'Satellite & Imagery',
    color: '#2563EB',
    sources: [
      { name: 'Sentinel Hub',     desc: 'ESA Copernicus live satellite EO browser',   url: 'https://apps.sentinel-hub.com/eo-browser/' },
      { name: 'Planet Labs',      desc: 'Daily satellite imagery — public demo',       url: 'https://www.planet.com/explorer/' },
      { name: 'NASA Worldview',   desc: 'Near real-time satellite imagery (NASA)',     url: 'https://worldview.earthdata.nasa.gov' },
    ],
  },
  {
    category: 'Open Cameras & Live Feeds',
    color: '#7C3AED',
    sources: [
      { name: 'EarthCam',         desc: 'Public live webcams — cities & landmarks',   url: 'https://www.earthcam.com' },
      { name: 'Windy Webcams',    desc: 'Geo-tagged public webcam network',            url: 'https://www.windy.com/webcams' },
      { name: 'Insecam',          desc: 'Directory of public network cameras',         url: 'http://www.insecam.org' },
    ],
  },
  {
    category: 'Maritime & Aviation',
    color: '#0284C7',
    sources: [
      { name: 'MarineTraffic',    desc: 'Real-time AIS vessel tracking — global',     url: 'https://www.marinetraffic.com' },
      { name: 'Flightradar24',    desc: 'Live aircraft tracking & flight data',        url: 'https://www.flightradar24.com' },
      { name: 'VesselFinder',     desc: 'AIS ship positions & port movements',         url: 'https://www.vesselfinder.com' },
    ],
  },
  {
    category: 'Open Intelligence Databases',
    color: '#16A34A',
    sources: [
      { name: 'OFAC SDN List',    desc: 'US Treasury sanctions & designated entities', url: 'https://sanctionssearch.ofac.treas.gov' },
      { name: 'UN Sanctions',     desc: 'UN Security Council consolidated sanctions',  url: 'https://www.un.org/securitycouncil/sanctions/information' },
      { name: 'OpenSanctions',    desc: 'Global sanctions & PEP database',             url: 'https://www.opensanctions.org' },
    ],
  },
  {
    category: 'News Intelligence',
    color: '#D97706',
    sources: [
      { name: 'GDELT Project',    desc: 'Global Event Database — open big data',       url: 'https://www.gdeltproject.org' },
      { name: 'Media Cloud',      desc: 'Open news tracking & media analysis',         url: 'https://search.mediacloud.org' },
      { name: 'AllSides',         desc: 'News bias tracking & cross-source comparison', url: 'https://www.allsides.com/unbiased-balanced-news' },
    ],
  },
];

/* ─── Sub-components ────────────────────────────────────────────── */

function RiskBar({ value, trend }: { value: number; trend: string }) {
  const color = value > 70 ? '#DC2626' : value > 50 ? '#D97706' : '#16A34A';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-mono-custom text-xs w-6 text-right font-semibold" style={{ color }}>{value}</span>
      <span className="text-xs w-3 text-center" style={{ color: trend === 'up' ? '#DC2626' : trend === 'down' ? '#16A34A' : '#94A3B8' }}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:     'bg-green-50 text-green-700 ring-1 ring-green-200',
    MONITORING: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
    ADVISORY:   'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  };
  return (
    <span className={`inline-block text-[0.65rem] font-semibold tracking-widest uppercase px-2 py-0.5 rounded ${styles[status] ?? styles.MONITORING}`}>
      {status}
    </span>
  );
}

const TABS = ['Situation', 'Threat Index', 'Open Sources', 'Analyses'] as const;
type Tab = typeof TABS[number];

/* ─── Main Component ────────────────────────────────────────────── */

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('Situation');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-7xl space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-mono-custom tracking-widest uppercase text-[#64748B] mb-1">
            Intelligence Overview
          </p>
          <h1 className="text-2xl font-display font-800 text-[#0F172A] tracking-tight">
            Global Situation Report
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-md px-3 py-2 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-[0.68rem] font-mono-custom tracking-widest uppercase text-[#475569]">
            Live · {tick * 5}s ago
          </span>
        </div>
      </div>

      {/* Quick-launch cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/dashboard/oracle',   label: 'ORACLE',   sub: 'Strategy Navigator',   color: '#2563EB', icon: '✦' },
          { href: '/dashboard/sentinel', label: 'SENTINEL', sub: 'Horizon Watch',         color: '#0284C7', icon: '◉' },
          { href: '/dashboard/actor',    label: 'ACTOR',    sub: 'Intelligence Module',   color: '#7C3AED', icon: '◈' },
        ].map(({ href, label, sub, color, icon }) => (
          <Link key={href} href={href}
            className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-sm hover:shadow-md hover:border-current transition-all duration-200 group"
            style={{ '--tw-border-opacity': '1' } as React.CSSProperties}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base" style={{ color }}>{icon}</span>
                <span className="text-[0.72rem] font-semibold tracking-widest uppercase" style={{ color }}>{label}</span>
              </div>
              <span className="text-[#CBD5E1] group-hover:text-current text-sm transition-colors" style={{ color: undefined }}>→</span>
            </div>
            <p className="text-sm text-[#64748B] group-hover:text-[#334155] transition-colors leading-snug">{sub}</p>
          </Link>
        ))}
      </div>

      {/* Tab bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E2E8F0]">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3.5 text-[0.75rem] font-semibold tracking-wide transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-[#2563EB] text-[#2563EB] bg-[#F8FAFF]'
                  : 'border-transparent text-[#64748B] hover:text-[#334155] hover:bg-[#F8FAFC]'
              }`}
            >
              {t}
            </button>
          ))}
          {/* Live indicator pushed right */}
          <div className="ml-auto flex items-center px-5 gap-2">
            <span className="text-[0.65rem] font-mono-custom tracking-widest uppercase text-[#94A3B8]">5 feeds active</span>
          </div>
        </div>

        {/* ── Situation tab ──────────────────────────────── */}
        {tab === 'Situation' && (
          <div className="grid lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#E2E8F0]">
            {/* Alert queue */}
            <div className="lg:col-span-3">
              <div className="px-6 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
                  <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-[#334155]">Active Alert Queue</span>
                </div>
                <span className="text-[0.65rem] font-mono-custom text-[#94A3B8]">{alerts.length} signals</span>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {alerts.map(alert => (
                  <div key={alert.id} className="px-6 py-4 flex items-start gap-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer group">
                    <span
                      className="text-[0.62rem] font-bold tracking-widest uppercase px-2 py-1 rounded flex-shrink-0 mt-0.5"
                      style={{ color: alert.color, background: alert.color + '12', border: `1px solid ${alert.color}30` }}>
                      {alert.level}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#334155] group-hover:text-[#0F172A] transition-colors leading-snug">
                        {alert.event}
                      </p>
                      <p className="text-[0.68rem] text-[#94A3B8] mt-0.5">{alert.region}</p>
                    </div>
                    <span className="text-[0.65rem] text-[#94A3B8] flex-shrink-0 mt-0.5">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Regional Risk sidebar */}
            <div className="lg:col-span-2">
              <div className="px-6 py-3 border-b border-[#E2E8F0] bg-[#FAFAFA]">
                <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-[#334155]">Regional Risk Index</span>
              </div>
              <div className="px-6 py-5 space-y-4">
                {regions.map(r => (
                  <div key={r.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[0.78rem] text-[#475569] font-medium">{r.name}</span>
                    </div>
                    <RiskBar value={r.risk} trend={r.trend} />
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-[#F1F5F9] flex gap-4">
                <span className="text-[0.62rem] font-mono-custom text-[#DC2626]">● HIGH &gt;70</span>
                <span className="text-[0.62rem] font-mono-custom text-[#D97706]">● MED &gt;50</span>
                <span className="text-[0.62rem] font-mono-custom text-[#16A34A]">● LOW</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Threat Index tab ───────────────────────────── */}
        {tab === 'Threat Index' && (
          <div className="p-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Critical Zones',    value: '3',   sub: 'risk score > 70',  color: '#DC2626' },
                { label: 'Elevated Zones',    value: '2',   sub: 'risk score 50–70', color: '#D97706' },
                { label: 'Active Alerts',     value: '6',   sub: 'in last 24 hours', color: '#2563EB' },
                { label: 'Feeds Monitored',   value: '18',  sub: 'open-source feeds', color: '#16A34A' },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-[#FAFAFA] border border-[#E2E8F0] rounded-lg p-4">
                  <p className="text-[0.65rem] font-mono-custom tracking-widest uppercase text-[#94A3B8] mb-1">{label}</p>
                  <p className="text-2xl font-display font-800" style={{ color }}>{value}</p>
                  <p className="text-[0.7rem] text-[#94A3B8] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
              <div className="px-6 py-3 bg-[#FAFAFA] border-b border-[#E2E8F0]">
                <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-[#334155]">Full Regional Risk Breakdown</span>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {[...regions].sort((a, b) => b.risk - a.risk).map(r => {
                  const color = r.risk > 70 ? '#DC2626' : r.risk > 50 ? '#D97706' : '#16A34A';
                  return (
                    <div key={r.name} className="px-6 py-3.5 flex items-center gap-4">
                      <span className="w-32 text-sm font-medium text-[#334155]">{r.name}</span>
                      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${r.risk}%`, background: color }} />
                      </div>
                      <span className="w-8 text-right text-sm font-bold font-mono-custom" style={{ color }}>{r.risk}</span>
                      <span className="w-4 text-center text-xs" style={{ color: r.trend === 'up' ? '#DC2626' : r.trend === 'down' ? '#16A34A' : '#94A3B8' }}>
                        {r.trend === 'up' ? '↑' : r.trend === 'down' ? '↓' : '→'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Open Sources tab ───────────────────────────── */}
        {tab === 'Open Sources' && (
          <div className="p-6">
            <div className="mb-5">
              <p className="text-sm text-[#64748B]">
                Curated directory of publicly available open-source intelligence feeds, live tracking systems, and open databases. All sources are publicly accessible.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {osintSources.map(group => (
                <div key={group.category} className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E2E8F0]" style={{ background: group.color + '08' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                      <span className="text-[0.68rem] font-semibold tracking-widest uppercase" style={{ color: group.color }}>
                        {group.category}
                      </span>
                    </div>
                  </div>
                  <div className="divide-y divide-[#F8FAFC]">
                    {group.sources.map(src => (
                      <a key={src.name} href={src.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors group">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">{src.name}</p>
                          <p className="text-[0.68rem] text-[#94A3B8] mt-0.5 leading-relaxed">{src.desc}</p>
                        </div>
                        <span className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors text-sm flex-shrink-0 mt-0.5">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Analyses tab ───────────────────────────────── */}
        {tab === 'Analyses' && (
          <div>
            <div className="px-6 py-3 border-b border-[#E2E8F0] bg-[#FAFAFA] flex items-center justify-between">
              <span className="text-[0.7rem] font-semibold tracking-widest uppercase text-[#334155]">ORACLE — Recent Analyses</span>
              <Link href="/dashboard/oracle" className="text-[0.72rem] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
                Open ORACLE →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E2E8F0]">
                    {['Scenario', 'Status', 'Progress', 'Confidence', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-[0.65rem] font-semibold tracking-widest uppercase text-[#94A3B8]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {analyses.map((n, i) => (
                    <tr key={i} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-6 py-4 text-sm font-medium text-[#334155] group-hover:text-[#0F172A] max-w-xs transition-colors">
                        {n.name}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={n.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${n.progress}%` }} />
                          </div>
                          <span className="text-xs font-mono-custom text-[#64748B]">{n.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold font-mono-custom ${n.confidence === 'HIGH' ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
                          {n.confidence}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link href="/dashboard/oracle" className="text-xs font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
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
