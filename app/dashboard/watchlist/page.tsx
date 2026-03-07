'use client';
import { useState, useEffect, useCallback } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SanctionsResult {
  id: string;
  schema: string;
  caption: string;
  properties: {
    name?: string[];
    alias?: string[];
    country?: string[];
    birthDate?: string[];
    topics?: string[];
    dataset?: string[];
  };
  datasets: string[];
}

interface InterpolNotice {
  entity_id: string;
  forename?: string;
  name?: string;
  date_of_birth?: string;
  nationalities?: string[];
  distinguishing_marks?: string;
  charges_arresting_country_id?: string;
  arrest_warrants?: { charge: string; charge_translation?: string }[];
  _links: {
    self?: { href: string };
    thumbnail?: { href: string };
  };
}

interface FBIItem {
  uid: string;
  title: string;
  description?: string;
  caution?: string;
  reward_text?: string;
  images?: { original: string; thumb: string; caption?: string }[];
  subjects?: string[];
  field_offices?: string[];
  dates_of_birth_used?: string[];
  nationality?: string;
  url?: string;
  modified?: string;
}

// ── Dataset label map ──────────────────────────────────────────────────────────

const DATASET_LABELS: Record<string, string> = {
  us_ofac_sdn:         'OFAC SDN',
  us_ofac_cons:        'OFAC Consolidated',
  eu_fsf:              'EU Sanctions',
  un_sc_sanctions:     'UN Security Council',
  gb_hmt_sanctions:    'UK HM Treasury',
  ch_seco_sanctions:   'SECO (Switzerland)',
  ca_dfatd_sema:       'Canada SEMA',
  au_dfat_sanctions:   'Australia DFAT',
  us_bis_denied:       'US BIS Denied',
  interpol_red_notices:'INTERPOL',
};

function datasetLabel(ds: string): string {
  return DATASET_LABELS[ds] ?? ds.replace(/_/g, ' ').toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-[#94A3B8] text-sm">{message}</div>
  );
}

function SanctionsCard({ result }: { result: SanctionsResult }) {
  const aliases = result.properties.alias ?? [];
  const countries = result.properties.country ?? [];
  const dob = result.properties.birthDate?.[0];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[0.6rem] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] mr-2">
            {result.schema.toUpperCase()}
          </span>
          <h3 className="mt-2 text-sm font-bold text-[#0F172A]">{result.caption}</h3>
          {aliases.length > 0 && (
            <p className="text-xs text-[#64748B] mt-0.5">
              AKA: {aliases.slice(0, 3).join(', ')}
              {aliases.length > 3 && ` +${aliases.length - 3} more`}
            </p>
          )}
        </div>
        {countries.length > 0 && (
          <span className="text-xs font-semibold text-[#475569] bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-1 rounded flex-shrink-0">
            {countries[0].toUpperCase()}
          </span>
        )}
      </div>

      {dob && (
        <p className="text-xs text-[#64748B]">
          <span className="font-semibold text-[#475569]">DOB:</span> {dob}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {result.datasets.slice(0, 5).map(ds => (
          <span
            key={ds}
            className="text-[0.6rem] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            {datasetLabel(ds)}
          </span>
        ))}
        {result.datasets.length > 5 && (
          <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
            +{result.datasets.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}

function InterpolCard({ notice }: { notice: InterpolNotice }) {
  const fullName = [notice.forename, notice.name].filter(Boolean).join(', ') || 'Unknown';
  const charge = notice.arrest_warrants?.[0]?.charge_translation
    ?? notice.arrest_warrants?.[0]?.charge
    ?? notice.charges_arresting_country_id
    ?? 'See full notice';
  const thumbUrl = notice._links.thumbnail?.href;
  const noticeUrl = notice._links.self?.href?.replace('ws-public.interpol.int/notices/v1/red', 'www.interpol.int/en/How-we-work/Notices/View-Red-Notices');

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 flex gap-4">
      <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-[#94A3B8] text-xl font-bold">
            {(notice.name?.[0] ?? '?')}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-[#0F172A] truncate">{fullName}</h3>
          <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex-shrink-0">
            RED NOTICE
          </span>
        </div>

        {notice.date_of_birth && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#475569]">DOB:</span> {notice.date_of_birth}
          </p>
        )}
        {notice.nationalities && notice.nationalities.length > 0 && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#475569]">Nationality:</span>{' '}
            {notice.nationalities.join(', ').toUpperCase()}
          </p>
        )}
        <p className="text-xs text-[#475569] line-clamp-2">
          <span className="font-semibold">Charges:</span> {charge}
        </p>

        {noticeUrl && (
          <a
            href={`https://www.interpol.int/en/How-we-work/Notices/Red-Notices/View-Red-Notices`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.7rem] font-semibold text-[#2563EB] hover:underline">
            View on INTERPOL →
          </a>
        )}
      </div>
    </div>
  );
}

function FBICard({ item }: { item: FBIItem }) {
  const thumb = item.images?.[0]?.thumb ?? item.images?.[0]?.original;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4 flex gap-4">
      <div className="flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="text-[#94A3B8] text-xl font-bold">
            {(item.title?.[0] ?? '?')}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-[#0F172A] leading-tight">{item.title}</h3>
          {item.reward_text && (
            <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex-shrink-0 whitespace-nowrap">
              {item.reward_text.split(' ').slice(0, 2).join(' ')}
            </span>
          )}
        </div>

        {item.dates_of_birth_used && item.dates_of_birth_used.length > 0 && (
          <p className="text-xs text-[#64748B]">
            <span className="font-semibold text-[#475569]">DOB:</span>{' '}
            {item.dates_of_birth_used[0]}
          </p>
        )}

        {item.subjects && item.subjects.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.subjects.slice(0, 3).map(s => (
              <span
                key={s}
                className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA]">
                {s}
              </span>
            ))}
          </div>
        )}

        {item.caution && (
          <p className="text-xs text-[#475569] line-clamp-2">{item.caution}</p>
        )}

        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[0.7rem] font-semibold text-[#2563EB] hover:underline">
            View on FBI.gov →
          </a>
        )}
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────

function Pagination({
  page,
  total,
  perPage,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-2">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="text-xs font-semibold border border-[#E2E8F0] text-[#475569] px-3 py-1.5 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        ← Previous
      </button>
      <span className="text-xs text-[#94A3B8]">
        Page {page} of {totalPages} &middot; {total.toLocaleString()} total
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="text-xs font-semibold border border-[#E2E8F0] text-[#475569] px-3 py-1.5 rounded-lg hover:border-[#2563EB] hover:text-[#2563EB] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        Next →
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type Tab = 'sanctions' | 'interpol' | 'fbi';

export default function WatchlistPage() {
  const [activeTab, setActiveTab] = useState<Tab>('interpol');

  // ── Sanctions state ────────────────────────────────────────────────────────
  const [sanctionsQuery, setSanctionsQuery]       = useState('');
  const [sanctionsResults, setSanctionsResults]   = useState<SanctionsResult[]>([]);
  const [sanctionsTotal, setSanctionsTotal]       = useState(0);
  const [sanctionsLoading, setSanctionsLoading]   = useState(false);
  const [sanctionsError, setSanctionsError]       = useState('');
  const [sanctionsUnconfigured, setSanctionsUnconfigured] = useState(false);

  // ── Interpol state ─────────────────────────────────────────────────────────
  const [interpolName, setInterpolName]           = useState('');
  const [interpolForename, setInterpolForename]   = useState('');
  const [interpolNotices, setInterpolNotices]     = useState<InterpolNotice[]>([]);
  const [interpolTotal, setInterpolTotal]         = useState(0);
  const [interpolPage, setInterpolPage]           = useState(1);
  const [interpolLoading, setInterpolLoading]     = useState(false);
  const [interpolError, setInterpolError]         = useState('');

  // ── FBI state ──────────────────────────────────────────────────────────────
  const [fbiTitle, setFbiTitle]                   = useState('');
  const [fbiItems, setFbiItems]                   = useState<FBIItem[]>([]);
  const [fbiTotal, setFbiTotal]                   = useState(0);
  const [fbiPage, setFbiPage]                     = useState(1);
  const [fbiLoading, setFbiLoading]               = useState(false);
  const [fbiError, setFbiError]                   = useState('');

  // ── Sanctions search ───────────────────────────────────────────────────────
  async function searchSanctions() {
    if (!sanctionsQuery.trim()) return;
    setSanctionsLoading(true);
    setSanctionsError('');
    setSanctionsUnconfigured(false);
    try {
      const res  = await fetch(`/api/watchlist/sanctions?q=${encodeURIComponent(sanctionsQuery)}`);
      const data = await res.json();
      if (data.unconfigured) {
        setSanctionsUnconfigured(true);
      } else if (data.error) {
        setSanctionsError(data.error);
      } else {
        setSanctionsResults(data.results ?? []);
        setSanctionsTotal(data.total ?? 0);
      }
    } catch {
      setSanctionsError('Request failed. Please try again.');
    } finally {
      setSanctionsLoading(false);
    }
  }

  // ── Interpol fetch ─────────────────────────────────────────────────────────
  const fetchInterpol = useCallback(async (name: string, forename: string, page: number) => {
    setInterpolLoading(true);
    setInterpolError('');
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (name)     params.set('name',     name);
      if (forename) params.set('forename', forename);
      const res  = await fetch(`/api/watchlist/interpol?${params}`);
      const data = await res.json();
      if (data.error) {
        setInterpolError(data.error);
      } else {
        setInterpolNotices(data.notices ?? []);
        setInterpolTotal(data.total ?? 0);
      }
    } catch {
      setInterpolError('Request failed. Please try again.');
    } finally {
      setInterpolLoading(false);
    }
  }, []);

  // ── FBI fetch ──────────────────────────────────────────────────────────────
  const fetchFBI = useCallback(async (title: string, page: number) => {
    setFbiLoading(true);
    setFbiError('');
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (title) params.set('title', title);
      const res  = await fetch(`/api/watchlist/fbi?${params}`);
      const data = await res.json();
      if (data.error) {
        setFbiError(data.error);
      } else {
        setFbiItems(data.items ?? []);
        setFbiTotal(data.total ?? 0);
      }
    } catch {
      setFbiError('Request failed. Please try again.');
    } finally {
      setFbiLoading(false);
    }
  }, []);

  // Auto-load Interpol and FBI on mount
  useEffect(() => { fetchInterpol('', '', 1); }, [fetchInterpol]);
  useEffect(() => { fetchFBI('', 1); }, [fetchFBI]);

  function handleInterpolSearch() {
    setInterpolPage(1);
    fetchInterpol(interpolName, interpolForename, 1);
  }

  function handleFBISearch() {
    setFbiPage(1);
    fetchFBI(fbiTitle, 1);
  }

  const inputClass = 'w-full bg-[#F8FAFC] border border-[#D1D5DB] rounded-lg px-3 py-2.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition placeholder:text-[#9CA3AF]';
  const labelClass = 'block text-xs font-semibold text-[#64748B] tracking-wide uppercase mb-1.5';

  const TABS: { id: Tab; label: string; sub: string }[] = [
    { id: 'interpol',  label: 'INTERPOL',        sub: 'Red Notices'         },
    { id: 'fbi',       label: 'FBI',              sub: 'Most Wanted'         },
    { id: 'sanctions', label: 'Sanctions',        sub: 'OFAC · EU · UN · UK' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8] mb-1">
          WATCHLIST &middot; Compliance &amp; Law Enforcement
        </p>
        <h1 className="text-3xl font-display font-800 text-[#0F172A] tracking-tight">
          Sanctions &amp; Most Wanted
        </h1>
        <p className="text-sm text-[#64748B] mt-1">
          Real-time queries against global sanctions databases, INTERPOL Red Notices, and FBI Most Wanted listings.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'OpenSanctions',    stat: '1.2M+',  sub: '100+ source lists',    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
          { label: 'INTERPOL Notices', stat: interpolTotal > 0 ? interpolTotal.toLocaleString() : '~7,000', sub: 'Active Red Notices',   color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
          { label: 'FBI Most Wanted',  stat: fbiTotal   > 0 ? fbiTotal.toLocaleString()   : '~500',   sub: 'Active listings',      color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
        ].map(({ label, stat, sub, color, bg, border }) => (
          <div
            key={label}
            className="bg-white rounded-xl border shadow-sm p-4"
            style={{ borderColor: border }}>
            <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color }}>
              {label}
            </p>
            <p className="text-2xl font-display font-800 text-[#0F172A]">{stat}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 rounded-lg py-2.5 px-3 text-left transition-all ${
              activeTab === t.id
                ? 'bg-white shadow-sm border border-[#E2E8F0]'
                : 'hover:bg-[#E2E8F0]/60'
            }`}>
            <div className={`text-xs font-bold ${activeTab === t.id ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
              {t.label}
            </div>
            <div className="text-[0.65rem] text-[#94A3B8] mt-0.5">{t.sub}</div>
          </button>
        ))}
      </div>

      {/* ══════════════ INTERPOL TAB ══════════════ */}
      {activeTab === 'interpol' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4">
              Search INTERPOL Red Notices
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelClass}>Surname / Last Name</label>
                <input
                  value={interpolName}
                  onChange={e => setInterpolName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInterpolSearch()}
                  placeholder="e.g. SMITH"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Forename / First Name</label>
                <input
                  value={interpolForename}
                  onChange={e => setInterpolForename(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInterpolSearch()}
                  placeholder="e.g. JOHN"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleInterpolSearch}
                disabled={interpolLoading}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                {interpolLoading ? 'Searching...' : 'Search Red Notices'}
              </button>
              {(interpolName || interpolForename) && (
                <button
                  onClick={() => {
                    setInterpolName('');
                    setInterpolForename('');
                    setInterpolPage(1);
                    fetchInterpol('', '', 1);
                  }}
                  className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors">
                  Clear
                </button>
              )}
              {interpolTotal > 0 && !interpolLoading && (
                <span className="text-xs text-[#94A3B8] ml-auto">
                  {interpolTotal.toLocaleString()} notices found
                </span>
              )}
            </div>
          </div>

          {/* Results */}
          {interpolLoading ? (
            <Spinner />
          ) : interpolError ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#DC2626]">
              {interpolError}
            </div>
          ) : interpolNotices.length === 0 ? (
            <EmptyState message="No notices found for this search." />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {interpolNotices.map(n => (
                  <InterpolCard key={n.entity_id} notice={n} />
                ))}
              </div>
              <Pagination
                page={interpolPage}
                total={interpolTotal}
                perPage={20}
                onPrev={() => {
                  const p = interpolPage - 1;
                  setInterpolPage(p);
                  fetchInterpol(interpolName, interpolForename, p);
                }}
                onNext={() => {
                  const p = interpolPage + 1;
                  setInterpolPage(p);
                  fetchInterpol(interpolName, interpolForename, p);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════ FBI TAB ══════════════ */}
      {activeTab === 'fbi' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4">
              Search FBI Most Wanted
            </h2>
            <div className="flex gap-3">
              <input
                value={fbiTitle}
                onChange={e => setFbiTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleFBISearch()}
                placeholder="Search by name or alias..."
                className={inputClass}
              />
              <button
                onClick={handleFBISearch}
                disabled={fbiLoading}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap">
                {fbiLoading ? 'Searching...' : 'Search'}
              </button>
              {fbiTitle && (
                <button
                  onClick={() => {
                    setFbiTitle('');
                    setFbiPage(1);
                    fetchFBI('', 1);
                  }}
                  className="text-sm text-[#64748B] hover:text-[#2563EB] transition-colors px-2">
                  Clear
                </button>
              )}
            </div>
            {fbiTotal > 0 && !fbiLoading && (
              <p className="text-xs text-[#94A3B8] mt-3">
                {fbiTotal.toLocaleString()} listings found
              </p>
            )}
          </div>

          {/* Results */}
          {fbiLoading ? (
            <Spinner />
          ) : fbiError ? (
            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#DC2626]">
              {fbiError}
            </div>
          ) : fbiItems.length === 0 ? (
            <EmptyState message="No listings found for this search." />
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                {fbiItems.map(item => (
                  <FBICard key={item.uid} item={item} />
                ))}
              </div>
              <Pagination
                page={fbiPage}
                total={fbiTotal}
                perPage={20}
                onPrev={() => {
                  const p = fbiPage - 1;
                  setFbiPage(p);
                  fetchFBI(fbiTitle, p);
                }}
                onNext={() => {
                  const p = fbiPage + 1;
                  setFbiPage(p);
                  fetchFBI(fbiTitle, p);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ══════════════ SANCTIONS TAB ══════════════ */}
      {activeTab === 'sanctions' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
            <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3 mb-4">
              Global Sanctions Search
            </h2>
            <div className="flex gap-3 mb-3">
              <input
                value={sanctionsQuery}
                onChange={e => setSanctionsQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSanctions()}
                placeholder="Search by name, entity, or alias..."
                className={inputClass}
              />
              <button
                onClick={searchSanctions}
                disabled={sanctionsLoading || !sanctionsQuery.trim()}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap">
                {sanctionsLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Searches across OFAC SDN, EU Consolidated, UN Security Council, UK HM Treasury, and 100+ additional lists via OpenSanctions.
            </p>
          </div>

          {/* Unconfigured state */}
          {sanctionsUnconfigured && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 20 20" fill="#D97706" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">OpenSanctions API Key Required</h3>
              </div>
              <p className="text-sm text-[#64748B]">
                Sanctions search requires an OpenSanctions API key. Add <code className="bg-[#F1F5F9] px-1 py-0.5 rounded text-xs font-mono text-[#0F172A]">OPENSANCTIONS_API_KEY</code> to your environment variables to enable this module.
              </p>
              <ol className="text-xs text-[#64748B] space-y-1 list-decimal list-inside">
                <li>Register at <span className="font-semibold text-[#2563EB]">opensanctions.org</span> (research tier is free)</li>
                <li>Copy your API key from the account dashboard</li>
                <li>Add <code className="bg-[#F1F5F9] px-1 rounded font-mono">OPENSANCTIONS_API_KEY=your_key</code> to <code className="bg-[#F1F5F9] px-1 rounded font-mono">.env.local</code></li>
                <li>Restart the development server</li>
              </ol>
            </div>
          )}

          {/* Results */}
          {!sanctionsUnconfigured && (
            sanctionsLoading ? (
              <Spinner />
            ) : sanctionsError ? (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#DC2626]">
                {sanctionsError}
              </div>
            ) : sanctionsResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#94A3B8]">
                    {sanctionsTotal.toLocaleString()} matches found
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {sanctionsResults.map(r => (
                    <SanctionsCard key={r.id} result={r} />
                  ))}
                </div>
              </div>
            ) : sanctionsQuery && !sanctionsLoading ? (
              <EmptyState message="No sanctions matches found for this query." />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
