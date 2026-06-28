// Shared corpus-quality filtering. Lets analyses run on a vetted subset
// (curated sources, specific languages, recent content) instead of the whole
// noisy pool. All aggregate — operates on source/language/date metadata.

// Curated high-signal sources: official news wires + established OSINT/intl
// affairs channels. Distinct from the long tail of view-ranked, low-signal
// channels in the raw corpus.
export const CURATED_SOURCES = new Set<string>([
  'france24_en', 'scmpnews', 'euronews', 'trtworld', 'aljazeeraenglish',
  'africanews', 'saudigazette', 'theintercept', 'osintdefender',
  'intelslava', 'warmonitor', 'middleeastmonitor',
]);

export interface CorpusFilter {
  sinceDays: number;
  languages?: string[];     // e.g. ['en','ar'] — undefined/empty = all
  curatedOnly?: boolean;    // restrict to CURATED_SOURCES
  maxContentAgeDays?: number; // drop content older than this by POST date
}

export interface FilterableRow {
  channel?: string | null;
  language?: string | null;
  posted_at?: string | null;
}

export function parseCorpusFilter(params: URLSearchParams): CorpusFilter {
  const sinceDays = Math.min(parseInt(params.get('days') || '30', 10) || 30, 365);
  const langs = (params.get('languages') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const maxAge = params.get('maxContentAgeDays');
  return {
    sinceDays,
    languages: langs.length ? langs : undefined,
    curatedOnly: params.get('curatedOnly') === 'true',
    maxContentAgeDays: maxAge ? parseInt(maxAge, 10) || undefined : undefined,
  };
}

export function passesFilter(row: FilterableRow, filter: CorpusFilter): boolean {
  if (filter.curatedOnly && !CURATED_SOURCES.has(row.channel ?? '')) return false;
  if (filter.languages && filter.languages.length > 0) {
    if (!row.language || !filter.languages.includes(row.language)) return false;
  }
  if (filter.maxContentAgeDays && row.posted_at) {
    const cutoff = Date.now() - filter.maxContentAgeDays * 86400000;
    if (new Date(row.posted_at).getTime() < cutoff) return false;
  }
  return true;
}

export function filterSummary(filter: CorpusFilter): string[] {
  const parts: string[] = [`window ${filter.sinceDays}d`];
  if (filter.curatedOnly) parts.push('curated sources only');
  if (filter.languages?.length) parts.push(`languages: ${filter.languages.join(', ')}`);
  if (filter.maxContentAgeDays) parts.push(`content ≤ ${filter.maxContentAgeDays}d old`);
  return parts;
}
