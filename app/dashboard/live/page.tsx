'use client';
import { useState, useEffect } from 'react';

/* ─── Types ──────────────────────────────────────────────────────── */

type Source = {
  id: string;
  name: string;
  desc: string;
  detail: string;
  url: string;
  embeds: boolean;
  live: boolean;
  tag?: string;
};

type Category = {
  id: string;
  label: string;
  color: string;
  sources: Source[];
};

/* ─── Feed Catalogue ─────────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  {
    id: 'air',
    label: 'Air Traffic',
    color: '#2563EB',
    sources: [
      {
        id: 'adsbx',
        name: 'ADS-B Exchange',
        desc: 'Unfiltered global ADS-B — includes military & government aircraft',
        detail: 'The only major ADS-B aggregator that does not filter out military, government, or "interesting" aircraft. Used by open-source intelligence analysts worldwide.',
        url: 'https://globe.adsbexchange.com/',
        embeds: true,
        live: true,
        tag: 'MILITARY',
      },
      {
        id: 'adsbfi',
        name: 'ADSB.fi Globe',
        desc: 'Open-source community flight tracking — no data filtering',
        detail: 'Community-operated ADS-B network providing unfiltered global aircraft positions. Alternative to commercial trackers with full data transparency.',
        url: 'https://globe.adsb.fi/',
        embeds: true,
        live: true,
      },
      {
        id: 'fr24',
        name: 'Flightradar24',
        desc: 'Commercial live aircraft tracking — 180,000+ flights daily',
        detail: 'World\'s most popular flight tracker. Covers commercial aviation with detailed aircraft info, flight history, and airport data feeds.',
        url: 'https://www.flightradar24.com/',
        embeds: false,
        live: true,
      },
      {
        id: 'fa',
        name: 'FlightAware',
        desc: 'Real-time flight tracking, delays, and airport intelligence',
        detail: 'Tracks over 10,000 airports globally. Provides flight history, delay prediction, and airline operational data in near real-time.',
        url: 'https://flightaware.com/live/',
        embeds: false,
        live: true,
      },
    ],
  },
  {
    id: 'marine',
    label: 'Marine & Ports',
    color: '#0284C7',
    sources: [
      {
        id: 'mt',
        name: 'MarineTraffic',
        desc: 'Global AIS vessel tracking — 500,000+ vessels monitored',
        detail: 'World\'s leading ship tracking platform using AIS data. Tracks vessel movements, port activity, and cargo ship routes globally. Widely used for sanctions monitoring.',
        url: 'https://www.marinetraffic.com/',
        embeds: false,
        live: true,
        tag: 'AIS',
      },
      {
        id: 'vf',
        name: 'VesselFinder',
        desc: 'AIS ship positions and port arrival/departure intelligence',
        detail: 'Real-time AIS data covering all ship types including tankers, containers, and warships. Provides port call predictions and cargo vessel routing data.',
        url: 'https://www.vesselfinder.com/',
        embeds: false,
        live: true,
      },
      {
        id: 'sx',
        name: 'ShipXplorer',
        desc: 'Real-time maritime traffic and vessel identification',
        detail: 'AIS-based vessel tracking with detailed ship particulars, route history, and port call logs. Good for sanctions evasion and dark vessel detection.',
        url: 'https://www.shipxplorer.com/',
        embeds: false,
        live: true,
      },
      {
        id: 'cm',
        name: 'CruiseMapper',
        desc: 'Cruise ship tracking and global port schedules',
        detail: 'Real-time tracking of passenger vessels with port arrival schedules. Useful for monitoring high-profile maritime movements and port congestion.',
        url: 'https://www.cruisemapper.com/',
        embeds: false,
        live: true,
      },
    ],
  },
  {
    id: 'cameras',
    label: 'Cameras & CCTV',
    color: '#7C3AED',
    sources: [
      {
        id: 'windy-cams',
        name: 'Windy — Live Webcams',
        desc: 'Thousands of geotagged public webcams on an interactive world map',
        detail: 'Windy\'s global webcam layer aggregates thousands of publicly accessible cameras positioned worldwide. Filter by location, region, or weather conditions.',
        url: 'https://embed.windy.com/embed2.html?lat=30&lon=0&detailLat=30&detailLon=0&zoom=3&level=surface&overlay=webcams&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1',
        embeds: true,
        live: true,
      },
      {
        id: 'earthcam',
        name: 'EarthCam',
        desc: 'Public live webcams — cities, borders, and landmarks worldwide',
        detail: 'Curated network of live streaming cameras covering major cities, tourist sites, border crossings, and infrastructure worldwide. HD streaming in many locations.',
        url: 'https://www.earthcam.com/',
        embeds: false,
        live: true,
      },
      {
        id: 'insecam',
        name: 'Insecam',
        desc: 'Directory of publicly accessible open network cameras',
        detail: 'Indexes IP cameras that are publicly accessible due to default or no authentication. Covers traffic cams, urban feeds, industrial sites, and more.',
        url: 'https://www.insecam.org/en/byrating/',
        embeds: false,
        live: true,
      },
      {
        id: 'skyline',
        name: 'Skyline Webcams',
        desc: 'Live panoramic and urban cameras from global vantage points',
        detail: 'Curated collection of live streaming panoramic and urban cameras from cities worldwide. Organized by location and camera type.',
        url: 'https://www.skylinewebcams.com/',
        embeds: false,
        live: true,
      },
    ],
  },
  {
    id: 'conflict',
    label: 'Conflict & Threats',
    color: '#DC2626',
    sources: [
      {
        id: 'liveuamap',
        name: 'LiveUAMap',
        desc: 'Real-time global conflict and security incident mapping',
        detail: 'Near real-time mapping of conflict events, military movements, and security incidents sourced from open social media, news, and wire services. Major active conflict zones covered.',
        url: 'https://liveuamap.com/',
        embeds: false,
        live: true,
        tag: 'CONFLICT',
      },
      {
        id: 'gim',
        name: 'Global Incident Map',
        desc: 'Real-time terrorism, crime, and security incident tracking',
        detail: 'Aggregates terrorism, piracy, criminal activity, and security incidents worldwide from public sources. Updated continuously with geotagged events.',
        url: 'https://www.globalincidentmap.com/',
        embeds: false,
        live: true,
        tag: 'TERROR',
      },
      {
        id: 'acled',
        name: 'ACLED Dashboard',
        desc: 'Armed Conflict Location & Event Data — 300,000+ documented events',
        detail: 'The gold standard academic dataset for conflict analysis. Covers political violence, protests, and armed conflict events globally with detailed metadata and actor attribution.',
        url: 'https://acleddata.com/dashboard/',
        embeds: false,
        live: false,
      },
      {
        id: 'crisis',
        name: 'ICG CrisisWatch',
        desc: 'International Crisis Group monthly conflict tracker',
        detail: 'Expert-curated monthly assessments of conflict situations in 70+ countries. Identifies deteriorating and improving situations with forward-looking analysis.',
        url: 'https://www.crisisgroup.org/crisiswatch',
        embeds: false,
        live: false,
      },
    ],
  },
  {
    id: 'satellite',
    label: 'Satellite & Imagery',
    color: '#16A34A',
    sources: [
      {
        id: 'zoom-earth',
        name: 'Zoom Earth',
        desc: 'Near real-time satellite imagery updated multiple times daily',
        detail: 'Aggregates imagery from MODIS, VIIRS, GOES, Himawari, and Meteosat satellites. Updated every 10 minutes for weather events. Good for monitoring wildfires, hurricanes, and large-scale military activity.',
        url: 'https://zoom.earth/',
        embeds: false,
        live: true,
      },
      {
        id: 'nasa',
        name: 'NASA Worldview',
        desc: 'Near real-time NASA MODIS and VIIRS satellite imagery',
        detail: 'NASA\'s EOSDIS Worldview tool providing access to over 1,000 satellite imagery layers updated within 3 hours of satellite overpass. Covers fires, floods, ice extent, and atmospheric data.',
        url: 'https://worldview.earthdata.nasa.gov/',
        embeds: false,
        live: true,
      },
      {
        id: 'sentinel-hub',
        name: 'Sentinel Hub EO Browser',
        desc: 'ESA Copernicus Sentinel-1/2/3 live Earth observation',
        detail: 'Access to ESA\'s Copernicus Sentinel satellite constellation including SAR (Sentinel-1), multispectral optical (Sentinel-2), and ocean/land monitoring (Sentinel-3). High resolution, frequently updated.',
        url: 'https://apps.sentinel-hub.com/eo-browser/',
        embeds: false,
        live: true,
        tag: 'SAR',
      },
      {
        id: 'n2yo',
        name: 'N2YO Satellite Tracker',
        desc: 'Real-time orbital tracking of 19,000+ active satellites',
        detail: 'Tracks every catalogued satellite in real-time including military, reconnaissance, and ISS. Shows orbital paths, passes, and conjunction events.',
        url: 'https://www.n2yo.com/',
        embeds: false,
        live: true,
      },
    ],
  },
  {
    id: 'signals',
    label: 'Weather & Signals',
    color: '#D97706',
    sources: [
      {
        id: 'windy',
        name: 'Windy — Wind & Weather',
        desc: 'Live global wind, weather, waves, and storm system tracking',
        detail: 'Professional-grade meteorological visualization used by pilots, sailors, and emergency responders. Covers wind, rain, temperature, waves, and severe weather events globally.',
        url: 'https://embed.windy.com/embed2.html?lat=30&lon=0&detailLat=30&detailLon=0&zoom=3&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1',
        embeds: true,
        live: true,
      },
      {
        id: 'nullschool',
        name: 'Nullschool Earth',
        desc: 'Animated real-time global wind, ocean, and atmosphere',
        detail: 'Beautiful animated visualization of wind patterns, ocean currents, and atmospheric pressure using GFS and OSCAR data. Useful for understanding weather systems and maritime route planning.',
        url: 'https://earth.nullschool.net/',
        embeds: false,
        live: true,
      },
      {
        id: 'ventusky',
        name: 'Ventusky',
        desc: 'Interactive real-time global weather visualization map',
        detail: 'High-quality weather visualization from ICON, GFS, ECMWF, and NAM models. Good for operational weather forecasting and storm tracking.',
        url: 'https://www.ventusky.com/',
        embeds: false,
        live: true,
      },
      {
        id: 'lightningmap',
        name: 'Lightning Map',
        desc: 'Real-time global lightning strike detection and mapping',
        detail: 'Real-time visualization of global lightning activity from the Blitzortung.org sensor network. Updated every 15 minutes with strike density and distribution data.',
        url: 'https://www.lightningmaps.org/',
        embeds: false,
        live: true,
      },
    ],
  },
  {
    id: 'sigint',
    label: 'RF & SIGINT',
    color: '#6366F1',
    sources: [
      {
        id: 'gpsjam',
        name: 'GPSJam',
        desc: 'Real-time global GPS jamming and spoofing hotspot map',
        detail: 'Community-built GPS interference monitor derived from accuracy deviations reported by aircraft via ADS-B. Jamming hotspots correlate strongly with active conflict zones, military exercises, and adversarial electronic warfare campaigns. Closest free equivalent to HawkEye 360\'s RF geolocation product. Updated continuously.',
        url: 'https://gpsjam.org/?lat=30&lon=10&z=2.5',
        embeds: true,
        live: true,
        tag: 'SIGINT',
      },
      {
        id: 'gfw',
        name: 'Global Fishing Watch',
        desc: 'Satellite-based dark vessel and AIS spoofing detection platform',
        detail: 'Uses satellite AIS, synthetic aperture radar (SAR), and optical imagery to detect vessels globally — including those that disable AIS transponders ("dark vessels"). Identifies AIS spoofing gaps indicative of sanctions evasion, illicit transfers, and military logistics. Free public access. Core open-source alternative to HawkEye 360 maritime RF detection.',
        url: 'https://globalfishingwatch.org/map/',
        embeds: false,
        live: true,
        tag: 'AIS',
      },
      {
        id: 'websdr',
        name: 'WebSDR Receiver Network',
        desc: 'Browser-accessible HF/VHF/UHF software-defined radio receivers worldwide',
        detail: 'Distributed network of internet-accessible SDR receivers covering shortwave, HF, amateur, aviation, and military frequency bands. Listen to live HF communications, maritime radio, and SIGINT-adjacent frequencies from receiver stations globally. No hardware required.',
        url: 'https://www.websdr.org/',
        embeds: false,
        live: true,
        tag: 'SIGINT',
      },
      {
        id: 'radiogarden',
        name: 'Radio Garden',
        desc: 'Live radio broadcasts from 30,000+ stations on an interactive globe',
        detail: 'Navigate the globe and tune into local live radio in any region. Invaluable for monitoring local media narratives, emergency broadcasts, and the information environment during crises. Covers 30,000+ stations across 230+ countries — a passive HUMINT and media intelligence tool.',
        url: 'https://radio.garden/',
        embeds: true,
        live: true,
        tag: 'RF',
      },
    ],
  },
];

/* ─── Tag badge ──────────────────────────────────────────────────── */

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MILITARY: { bg: '#1E3A5F', text: '#93C5FD', border: '#3B82F6' },
  CONFLICT: { bg: '#3B0A0A', text: '#FCA5A5', border: '#EF4444' },
  TERROR:   { bg: '#3B0A0A', text: '#FCA5A5', border: '#EF4444' },
  AIS:      { bg: '#0C2D4E', text: '#7DD3FC', border: '#0284C7' },
  SAR:      { bg: '#14291A', text: '#86EFAC', border: '#22C55E' },
  SIGINT:   { bg: '#1E1B4B', text: '#A5B4FC', border: '#6366F1' },
  RF:       { bg: '#2E1065', text: '#D8B4FE', border: '#A855F7' },
};

/* ─── Iframe viewer (for sources that allow embedding) ───────────── */

function FeedViewer({ source }: { source: Source }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setLoaded(false); }, [source.url]);

  return (
    <div className="relative w-full h-full bg-[#080D18]">
      <iframe
        key={source.url}
        src={source.url}
        className={`w-full h-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        allowFullScreen
        title={source.name}
        onLoad={() => setLoaded(true)}
      />

      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#080D18]">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-[#1E293B]" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#2563EB] animate-spin" />
          </div>
          <p className="text-sm text-[#475569] font-mono">Connecting to {source.name}…</p>
        </div>
      )}

      {loaded && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse flex-shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide">{source.name}</span>
            <span className="text-xs text-white/50">{source.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── In-app card (for sources that block embedding) ─────────────── */

function InAppCard({ source }: { source: Source }) {
  const tagStyle = source.tag ? TAG_COLORS[source.tag] : null;
  return (
    <div className="flex items-center justify-center w-full h-full bg-[#080D18] p-8">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              background: source.live ? '#DC2626' : '#64748B',
              boxShadow: source.live ? '0 0 8px #DC2626' : 'none',
              animation: source.live ? 'pulse 2s infinite' : 'none',
            }}
          />
          {source.tag && tagStyle && (
            <span
              className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded border"
              style={{ color: tagStyle.text, background: tagStyle.bg, borderColor: tagStyle.border }}
            >
              {source.tag}
            </span>
          )}
          <span className="text-xs text-[#64748B] font-mono ml-auto">EMBED RESTRICTED</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{source.name}</h2>
        <p className="text-sm text-[#94A3B8] mb-6 leading-relaxed">{source.detail}</p>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-lg px-4 py-3 mb-6 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0" />
          <span className="text-xs text-[#475569] font-mono truncate">{source.url}</span>
        </div>

        <button
          onClick={() => { window.location.href = source.url; }}
          className="flex items-center justify-center gap-3 w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-lg py-4 transition-colors shadow-lg shadow-blue-900/30"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          Open {source.name}
        </button>
        <p className="text-xs text-[#334155] text-center mt-4">
          This site restricts inline embedding — press browser Back to return to Kairos.
        </p>
      </div>
    </div>
  );
}

function EmptySlot({ slotNum, onActivate }: { slotNum: number; onActivate: () => void }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-[#080D18] cursor-pointer group" onClick={onActivate}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl border border-[#1E293B] flex items-center justify-center mx-auto mb-3 group-hover:border-[#2563EB]/50 transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#334155] group-hover:text-[#2563EB] transition-colors">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-[#334155] group-hover:text-[#475569] transition-colors">Panel {slotNum}</p>
        <p className="text-xs text-[#1E293B] mt-0.5">Select a feed from the left panel</p>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */

export default function LiveFeedsPage() {
  const defaultSource = CATEGORIES[0].sources[0]; // ADS-B Exchange
  const [slot1, setSlot1] = useState<Source | null>(defaultSource);
  const [slot2, setSlot2] = useState<Source | null>(null);
  const [splitView, setSplitView] = useState(false);
  const [activeSlot, setActiveSlot] = useState<1 | 2>(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(CATEGORIES.map(c => c.id)));
  const [time] = useState(() => new Date().toUTCString().slice(0, 25));

  function toggleCategory(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectFeed(src: Source) {
    if (activeSlot === 1) setSlot1(src);
    else setSlot2(src);
  }

  function toggleSplit() {
    if (splitView) {
      setSplitView(false);
      setSlot2(null);
      setActiveSlot(1);
    } else {
      setSplitView(true);
      setActiveSlot(1);
    }
  }

  const allActiveIds = new Set([slot1?.id, slot2?.id].filter(Boolean));

  return (
    /* -m-6 undoes the main padding; height fills from header bottom to viewport bottom */
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>

      {/* ── Top control bar ───────────────────────────────── */}
      <header className="flex-shrink-0 bg-white border-b border-[#E2E8F0] px-5 h-[52px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#DC2626]" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">Live Intelligence Hub</span>
          </div>
          <span className="text-xs text-[#94A3B8] border-l border-[#E2E8F0] pl-4 hidden md:block">
            Open-source public feeds · {time} UTC
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#DC2626] bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
            LIVE
          </span>
          <button
            onClick={toggleSplit}
            className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
              splitView
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'text-[#475569] border-[#E2E8F0] hover:border-[#2563EB] hover:text-[#2563EB]'
            }`}>
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <rect x="1" y="2" width="6" height="12" rx="1" />
              <rect x="9" y="2" width="6" height="12" rx="1" />
            </svg>
            {splitView ? 'Single View' : 'Split View'}
          </button>
        </div>
      </header>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Source panel ───────────────── */}
        <aside className="w-[272px] flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col overflow-hidden">

          {/* Slot selector (split mode only) */}
          {splitView && (
            <div className="flex border-b border-[#E2E8F0] flex-shrink-0">
              {([1, 2] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSlot(s)}
                  className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                    activeSlot === s
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-b-2 border-[#2563EB]'
                      : 'text-[#94A3B8] hover:text-[#475569] border-b-2 border-transparent'
                  }`}>
                  Panel {s}
                  {s === 1 && slot1 && <span className="ml-1.5 text-[10px] font-normal opacity-70">— {slot1.name.split(' ')[0]}</span>}
                  {s === 2 && slot2 && <span className="ml-1.5 text-[10px] font-normal opacity-70">— {slot2.name.split(' ')[0]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Source list */}
          <div className="flex-1 overflow-y-auto">
            {CATEGORIES.map(cat => (
              <div key={cat.id}>
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FAFAFA] border-b border-[#F1F5F9] hover:bg-[#F1F5F9] transition-colors sticky top-0 z-10">
                  <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: cat.color }}>
                    {cat.label}
                  </span>
                  <svg viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 text-[#94A3B8] transition-transform ${expanded.has(cat.id) ? 'rotate-180' : ''}`}>
                    <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {expanded.has(cat.id) && cat.sources.map(src => {
                  const isActive = allActiveIds.has(src.id);
                  const tagStyle = src.tag ? TAG_COLORS[src.tag] : null;
                  return (
                    <button
                      key={src.id}
                      onClick={() => selectFeed(src)}
                      className={`w-full text-left px-4 py-3.5 border-b border-[#F8FAFC] transition-all group ${
                        isActive
                          ? 'bg-[#EFF6FF] border-l-2 border-l-[#2563EB]'
                          : 'hover:bg-[#FAFAFA] border-l-2 border-l-transparent'
                      }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[13px] font-semibold leading-tight ${
                          isActive ? 'text-[#2563EB]' : 'text-[#0F172A] group-hover:text-[#2563EB]'
                        } transition-colors`}>
                          {src.name}
                        </span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {src.live && (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse flex-shrink-0" />
                          )}
                          {src.tag && tagStyle && (
                            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded border"
                              style={{ color: tagStyle.text, background: tagStyle.bg, borderColor: tagStyle.border }}>
                              {src.tag}
                            </span>
                          )}
                          {!src.embeds && (
                            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 text-[#CBD5E1] flex-shrink-0">
                              <path fillRule="evenodd" d="M3.25 3a.75.75 0 000 1.5h1.19l-3.72 3.72a.75.75 0 001.06 1.06L5.5 5.56v1.19a.75.75 0 001.5 0v-3a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#94A3B8] leading-relaxed line-clamp-2">{src.desc}</p>
                    </button>
                  );
                })}
              </div>
            ))}

            {/* Footer note */}
            <div className="px-4 py-4 border-t border-[#F1F5F9]">
              <p className="text-[10px] text-[#CBD5E1] leading-relaxed">
                All sources are publicly accessible open-source data. Sources that restrict inline embedding will navigate to the feed directly.
              </p>
            </div>
          </div>
        </aside>

        {/* ── Viewer area ───────────────── */}
        <div className="flex-1 flex overflow-hidden bg-[#080D18]">
          {/* Primary slot */}
          <div
            className={`flex flex-col overflow-hidden ${splitView ? 'w-1/2' : 'w-full'} ${
              splitView && activeSlot === 1 ? 'ring-1 ring-inset ring-[#2563EB]/40' : ''
            }`}
            onClick={() => setActiveSlot(1)}>
            {slot1
              ? slot1.embeds ? <FeedViewer source={slot1} /> : <InAppCard source={slot1} />
              : <EmptySlot slotNum={1} onActivate={() => setActiveSlot(1)} />
            }
          </div>

          {/* Secondary slot (split only) */}
          {splitView && (
            <div
              className={`flex flex-col overflow-hidden w-1/2 border-l border-[#0F1A2E] ${
                activeSlot === 2 ? 'ring-1 ring-inset ring-[#2563EB]/40' : ''
              }`}
              onClick={() => setActiveSlot(2)}>
              {slot2
                ? slot2.embeds ? <FeedViewer source={slot2} /> : <InAppCard source={slot2} />
                : <EmptySlot slotNum={2} onActivate={() => setActiveSlot(2)} />
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
