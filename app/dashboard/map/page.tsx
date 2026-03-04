'use client';

import { useState, useEffect, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type Hotspot = {
  id: number; name: string; lat: number; lon: number;
  type: string; intensity: number; count: number; text: string;
};
type FeedItem = { id: number; time: string; region: string; type: string; text: string; };

const SIGNAL_TYPES = [
  { id: 'news',    label: 'News & Media',     color: '#3B82F6', count: 42500 },
  { id: 'web',     label: 'Web Intelligence', color: '#06B6D4', count: 38200 },
  { id: 'social',  label: 'Social Media',     color: '#A855F7', count: 35600 },
  { id: 'markets', label: 'Market Data',      color: '#F59E0B', count: 21800 },
  { id: 'macro',   label: 'Macro Intel',      color: '#10B981', count: 12900 },
  { id: 'threat',  label: 'Threat Signals',   color: '#EF4444', count: 8600  },
];

const TOTAL = 159600;

const HOTSPOTS: Hotspot[] = [
  { id: 1,  name: 'Ukraine-Russia',  lat: 49.0,  lon: 32.0,   type: 'threat',  intensity: 95, count: 8420,  text: 'Active conflict — 847 new signals/hr' },
  { id: 2,  name: 'Gaza / Israel',   lat: 31.5,  lon: 34.5,   type: 'threat',  intensity: 90, count: 7200,  text: 'Ceasefire talks stalled — 312 signals/hr' },
  { id: 3,  name: 'Taiwan Strait',   lat: 24.0,  lon: 120.5,  type: 'threat',  intensity: 80, count: 6300,  text: '12 PLA naval assets being tracked' },
  { id: 4,  name: 'S. China Sea',    lat: 14.0,  lon: 114.0,  type: 'threat',  intensity: 75, count: 5100,  text: '3 territorial incidents in 24h' },
  { id: 5,  name: 'Iran',            lat: 32.5,  lon: 53.0,   type: 'threat',  intensity: 68, count: 3900,  text: 'Enrichment signals elevated' },
  { id: 6,  name: 'North Korea',     lat: 40.0,  lon: 127.5,  type: 'threat',  intensity: 72, count: 4100,  text: 'Sohae facility anomaly detected' },
  { id: 7,  name: 'Red Sea / Yemen', lat: 15.5,  lon: 47.5,   type: 'threat',  intensity: 75, count: 4200,  text: '8 vessels rerouted — Houthi risk' },
  { id: 8,  name: 'Sahel Region',    lat: 14.0,  lon: 2.0,    type: 'threat',  intensity: 70, count: 3200,  text: 'Africa Corps presence confirmed' },
  { id: 9,  name: 'Horn of Africa',  lat: 5.0,   lon: 43.0,   type: 'threat',  intensity: 65, count: 2800,  text: 'Piracy risk — Red Sea overflow' },
  { id: 10, name: 'Sudan',           lat: 15.0,  lon: 30.0,   type: 'threat',  intensity: 60, count: 2200,  text: 'Civil war signals deepening' },
  { id: 11, name: 'Afghanistan',     lat: 33.5,  lon: 65.0,   type: 'threat',  intensity: 70, count: 3400,  text: 'Sanctions evasion signals' },
  { id: 12, name: 'Myanmar',         lat: 17.0,  lon: 96.0,   type: 'threat',  intensity: 60, count: 2400,  text: 'Resistance activity spiking' },
  { id: 13, name: 'Ethiopia',        lat: 8.5,   lon: 38.5,   type: 'threat',  intensity: 55, count: 2100,  text: 'Tigray conflict indicators rising' },
  { id: 14, name: 'Venezuela',       lat: 7.5,   lon: -66.0,  type: 'threat',  intensity: 55, count: 1800,  text: 'Opposition movement growing' },
  { id: 15, name: 'US Markets',      lat: 40.0,  lon: -98.0,  type: 'markets', intensity: 85, count: 12000, text: 'Fed signals — CPI data imminent' },
  { id: 16, name: 'EU Markets',      lat: 51.0,  lon: 10.0,   type: 'markets', intensity: 80, count: 9800,  text: 'ECB — energy volatility elevated' },
  { id: 17, name: 'China',           lat: 35.0,  lon: 104.0,  type: 'markets', intensity: 82, count: 10500, text: 'PBoC stimulus signals building' },
  { id: 18, name: 'India',           lat: 20.0,  lon: 78.0,   type: 'social',  intensity: 78, count: 7800,  text: 'Social volume +340% — election' },
  { id: 19, name: 'Japan',           lat: 36.5,  lon: 138.0,  type: 'markets', intensity: 75, count: 6200,  text: 'BOJ hawkish — yen strengthening' },
  { id: 20, name: 'Brazil',          lat: -14.0, lon: -51.0,  type: 'social',  intensity: 65, count: 4200,  text: 'Deforestation policy shifts' },
  { id: 21, name: 'Turkey',          lat: 39.0,  lon: 35.5,   type: 'macro',   intensity: 65, count: 3600,  text: 'Inflation web signals elevated' },
  { id: 22, name: 'Pakistan',        lat: 30.0,  lon: 69.5,   type: 'social',  intensity: 62, count: 2900,  text: 'IMF program risk signals' },
  { id: 23, name: 'United Kingdom',  lat: 53.5,  lon: -2.0,   type: 'news',    intensity: 70, count: 5400,  text: 'Policy signals — below consensus' },
  { id: 24, name: 'Mexico',          lat: 23.0,  lon: -102.0, type: 'social',  intensity: 55, count: 3100,  text: 'Cartel signals — 6 states elevated' },
];

const FEED_TEMPLATES: Omit<FeedItem, 'id' | 'time'>[] = [
  { region: 'Taiwan Strait', type: 'threat',  text: 'PLA naval formation change — Dongsha perimeter breach signal' },
  { region: 'Ukraine',       type: 'threat',  text: 'Artillery exchange — Zaporizhzhia sector elevated' },
  { region: 'Red Sea',       type: 'threat',  text: 'Houthi drone signal — MV Anastasia rerouting confirmed' },
  { region: 'US Markets',    type: 'markets', text: 'Fed futures shift — 68bps cut probability → 52bps' },
  { region: 'Gaza',          type: 'threat',  text: 'Ceasefire mediator departure from Qatar confirmed' },
  { region: 'China',         type: 'macro',   text: 'PBoC RRR signal — stimulus probability elevated to 71%' },
  { region: 'N. Korea',      type: 'threat',  text: 'Satellite anomaly — Sohae launch facility elevated heat' },
  { region: 'India',         type: 'social',  text: 'Election volume spike — BJP/INC sentiment delta +8.4pts' },
  { region: 'Sahel',         type: 'threat',  text: 'Africa Corps rebranding confirmed — Mali presence' },
  { region: 'EU Markets',    type: 'markets', text: 'BTP spread +12bps — Italy/Germany 10yr widening' },
  { region: 'Iran',          type: 'threat',  text: 'Fordow facility heat signature elevated' },
  { region: 'Japan',         type: 'markets', text: 'BOJ Ueda hawkish read confirmed — USD/JPY -0.8%' },
  { region: 'Venezuela',     type: 'social',  text: 'González opposition movement reaching 12 cities' },
  { region: 'Turkey',        type: 'macro',   text: 'CPI data leak signal — probability flagged at 31%' },
  { region: 'S. China Sea',  type: 'threat',  text: 'Philippines coast guard incident — water cannon deployed' },
  { region: 'UK',            type: 'news',    text: 'GDP below consensus — GBP/USD -0.4% signal' },
  { region: 'Brazil',        type: 'social',  text: 'Amazon deforestation — new satellite imagery processed' },
  { region: 'Mexico',        type: 'social',  text: 'Cartel influence signal — Michoacan corridor active' },
  { region: 'Pakistan',      type: 'social',  text: 'IMF tranche risk — political instability signal elevated' },
  { region: 'Ethiopia',      type: 'threat',  text: 'Tigray humanitarian corridor signal — blocked routes detected' },
];

const CAT_COLORS: Record<string, string> = {
  news: '#3B82F6', web: '#06B6D4', social: '#A855F7',
  markets: '#F59E0B', macro: '#10B981', threat: '#EF4444',
};

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export default function SignalsMapPage() {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(['news', 'web', 'social', 'markets', 'macro', 'threat'])
  );
  const [signalCount, setSignalCount] = useState(0);
  const [selected, setSelected] = useState<Hotspot | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>(() =>
    FEED_TEMPLATES.map((t, i) => ({
      ...t,
      id: i,
      time: new Date(Date.now() - (FEED_TEMPLATES.length - i) * 13000)
        .toLocaleTimeString('en-GB', { hour12: false }),
    }))
  );
  const [timeRange, setTimeRange] = useState('24H');

  // Animate signal counter on mount
  useEffect(() => {
    const duration = 2500;
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setSignalCount(Math.floor(eased * TOTAL));
      if (p >= 1) clearInterval(tick);
    }, 16);
    return () => clearInterval(tick);
  }, []);

  // Rotate live feed
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        const tmpl = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
        setFeedItems(prev => [
          { ...tmpl, id: Date.now(), time: new Date().toLocaleTimeString('en-GB', { hour12: false }) },
          ...prev.slice(0, 29),
        ]);
        schedule();
      }, 2800 + Math.random() * 2400);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  const toggleCat = useCallback((id: string) => {
    setActiveCategories(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }, []);

  const filteredHotspots = HOTSPOTS.filter(h => activeCategories.has(h.type));

  return (
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100vh - 60px)', background: '#080D18' }}>

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 border-b border-[#1E293B]"
        style={{ height: 48 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
          <span className="text-[11px] font-bold tracking-[0.25em] text-white uppercase">
            Global Signals Monitor
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-bold text-white tabular-nums"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {signalCount.toLocaleString()}
          </span>
          <div>
            <div className="text-[10px] text-[#64748B] uppercase tracking-wide">signals monitored</div>
            <div className="text-[10px] text-[#3B82F6]">{filteredHotspots.length} active hotspots</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {['1H', '6H', '24H', '7D', '30D'].map(t => (
            <button
              key={t}
              onClick={() => setTimeRange(t)}
              className="px-2.5 py-1 text-[10px] font-semibold rounded transition-colors"
              style={{
                background: timeRange === t ? '#1D4ED8' : '#1E293B',
                color: timeRange === t ? 'white' : '#64748B',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left sidebar */}
        <aside
          className="w-[220px] flex-shrink-0 border-r border-[#1E293B] overflow-y-auto"
          style={{ background: '#09101F' }}
        >
          {/* Signal categories */}
          <div className="px-4 pt-4 pb-2">
            <div className="text-[9px] font-bold tracking-[0.2em] text-[#475569] uppercase mb-3">
              Signal Categories
            </div>
            {SIGNAL_TYPES.map(t => {
              const on = activeCategories.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleCat(t.id)}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg mb-1 transition-colors text-left"
                  style={{ background: on ? `${t.color}18` : 'transparent' }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: on ? t.color : '#334155' }}
                  />
                  <span className="text-[11px] flex-1" style={{ color: on ? '#CBD5E1' : '#475569' }}>
                    {t.label}
                  </span>
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: on ? t.color : '#334155' }}
                  >
                    {fmt(t.count)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-[#1E293B] mx-4 my-1" />

          {/* Top hotspots */}
          <div className="px-4 py-3">
            <div className="text-[9px] font-bold tracking-[0.2em] text-[#475569] uppercase mb-3">
              Top Hotspots
            </div>
            {filteredHotspots
              .slice()
              .sort((a, b) => b.intensity - a.intensity)
              .slice(0, 10)
              .map(h => (
                <button
                  key={h.id}
                  onClick={() => setSelected(prev => prev?.id === h.id ? null : h)}
                  className="w-full mb-2.5 text-left group"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className="text-[10px] leading-tight group-hover:text-white transition-colors"
                      style={{ color: selected?.id === h.id ? 'white' : '#94A3B8' }}
                    >
                      {h.name}
                    </span>
                    <span
                      className="text-[9px] tabular-nums ml-1 flex-shrink-0"
                      style={{ color: CAT_COLORS[h.type] }}
                    >
                      {fmt(h.count)}
                    </span>
                  </div>
                  <div className="h-[2px] rounded-full" style={{ background: '#1E293B' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${h.intensity}%`, background: CAT_COLORS[h.type] }}
                    />
                  </div>
                </button>
              ))}
          </div>

          <div className="border-t border-[#1E293B] mx-4" />

          {/* Regional breakdown */}
          <div className="px-4 py-3">
            <div className="text-[9px] font-bold tracking-[0.2em] text-[#475569] uppercase mb-3">
              By Region
            </div>
            {[
              { label: 'Asia-Pacific', pct: 38, color: '#3B82F6' },
              { label: 'Europe',       pct: 24, color: '#10B981' },
              { label: 'Middle East',  pct: 18, color: '#EF4444' },
              { label: 'Americas',     pct: 12, color: '#F59E0B' },
              { label: 'Africa',       pct: 8,  color: '#A855F7' },
            ].map(r => (
              <div key={r.label} className="mb-2">
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px] text-[#64748B]">{r.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: r.color }}>{r.pct}%</span>
                </div>
                <div className="h-[2px] rounded-full" style={{ background: '#1E293B' }}>
                  <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Map area ── */}
        <div className="flex-1 relative overflow-hidden">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [10, 25], scale: 160 }}
            style={{ width: '100%', height: '100%', background: '#080D18' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#182030"
                    stroke="#0D1520"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: '#1E2D42' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {filteredHotspots.map(h => {
              const color = CAT_COLORS[h.type];
              const r = 3 + (h.intensity / 100) * 5;
              const delay = `${(h.id % 6) * 0.35}s`;
              const isSelected = selected?.id === h.id;
              return (
                <Marker
                  key={h.id}
                  coordinates={[h.lon, h.lat]}
                  onClick={() => setSelected(prev => prev?.id === h.id ? null : h)}
                >
                  {/* Outer pulse ring */}
                  <circle r={r} fill="none" stroke={color} strokeWidth={1.5}>
                    <animate
                      attributeName="r"
                      from={String(r)}
                      to={String(r * 4.5)}
                      dur="2.2s"
                      repeatCount="indefinite"
                      begin={delay}
                    />
                    <animate
                      attributeName="opacity"
                      values="0.7;0"
                      dur="2.2s"
                      repeatCount="indefinite"
                      begin={delay}
                    />
                  </circle>
                  {/* Soft glow halo */}
                  <circle r={r * 2.5} fill={color} opacity={0.07} />
                  {/* Core dot */}
                  <circle
                    r={isSelected ? r * 1.5 : r}
                    fill={color}
                    opacity={0.95}
                    cursor="pointer"
                    stroke={isSelected ? 'white' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Edge fade overlays */}
          <div
            className="absolute inset-y-0 left-0 w-6 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #080D18, transparent)' }}
          />
          <div
            className="absolute inset-y-0 right-0 w-6 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #080D18, transparent)' }}
          />

          {/* Selected hotspot detail card */}
          {selected && (
            <div
              className="absolute bottom-5 left-5 rounded-xl border p-4 w-[290px] shadow-2xl"
              style={{ background: '#0B1525', borderColor: `${CAT_COLORS[selected.type]}50` }}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-[#475569] hover:text-white transition-colors leading-none text-xl"
              >
                &times;
              </button>
              <div className="flex items-start justify-between mb-3 pr-5">
                <div>
                  <div
                    className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1"
                    style={{ color: CAT_COLORS[selected.type] }}
                  >
                    {selected.type}
                  </div>
                  <div className="text-white text-sm font-semibold leading-tight">{selected.name}</div>
                </div>
                <div className="text-right ml-3 flex-shrink-0">
                  <div
                    className="text-xl font-bold tabular-nums"
                    style={{ color: CAT_COLORS[selected.type] }}
                  >
                    {selected.count.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#475569]">signals</div>
                </div>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed mb-3">{selected.text}</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#475569] uppercase tracking-wide flex-shrink-0">
                  Intensity
                </span>
                <div className="flex-1 h-[3px] rounded-full" style={{ background: '#1E293B' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${selected.intensity}%`, background: CAT_COLORS[selected.type] }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold tabular-nums flex-shrink-0"
                  style={{ color: CAT_COLORS[selected.type] }}
                >
                  {selected.intensity}
                </span>
              </div>
            </div>
          )}

          {/* Bottom-right stamp */}
          <div className="absolute bottom-3 right-3 text-[9px] text-[#1E293B] font-mono select-none">
            MERCATOR · LIVE
          </div>
        </div>

        {/* ── Right: Live signal feed ── */}
        <aside
          className="w-[280px] flex-shrink-0 border-l border-[#1E293B] flex flex-col overflow-hidden"
          style={{ background: '#09101F' }}
        >
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-[#1E293B]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#64748B] uppercase">
              Live Signal Feed
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {feedItems.map(item => (
              <div
                key={item.id}
                className="px-4 py-2.5 border-b border-[#1E293B]/50 hover:bg-[#0F172A] transition-colors"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] text-[#334155] font-mono flex-shrink-0">{item.time}</span>
                  <span
                    className="text-[9px] font-bold tracking-wide truncate"
                    style={{ color: CAT_COLORS[item.type] }}
                  >
                    {item.region.toUpperCase()}
                  </span>
                  <span
                    className="ml-auto text-[8px] font-semibold uppercase flex-shrink-0 px-1 py-0.5 rounded"
                    style={{
                      color: CAT_COLORS[item.type],
                      background: `${CAT_COLORS[item.type]}18`,
                    }}
                  >
                    {item.type}
                  </span>
                </div>
                <p className="text-[10px] text-[#64748B] leading-snug">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex-shrink-0 px-4 py-2 border-t border-[#1E293B]">
            <div className="text-[9px] text-[#334155] text-center">
              {TOTAL.toLocaleString()} total signals · auto-refreshing
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
