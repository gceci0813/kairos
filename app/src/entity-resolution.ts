// Entity resolution + story deduplication. Aggregate-only: canonicalizes the
// NAMES of entities (people-as-public-figures, orgs, places) so counts aren't
// fragmented across spelling/title variants, and collapses syndicated/near-
// duplicate stories so one event isn't counted many times. This corrects
// over-counting that otherwise inflates every downstream metric.
import { canonicalLookup } from './entity-canonical';

const HONORIFICS = [
  'president', 'pres', 'mr', 'mrs', 'ms', 'dr', 'sen', 'senator', 'rep',
  'representative', 'gov', 'governor', 'prime minister', 'pm', 'chancellor',
  'minister', 'secretary', 'gen', 'general', 'capt', 'sir', 'lord', 'former',
];

// Known alias → canonical, for high-frequency entities where surface forms
// diverge a lot. Extend as needed.
const ALIASES: Record<string, string> = {
  'donald trump': 'Trump',
  'donald j trump': 'Trump',
  'trump': 'Trump',
  'joe biden': 'Biden',
  'joseph biden': 'Biden',
  'biden': 'Biden',
  'vladimir putin': 'Putin',
  'putin': 'Putin',
  'volodymyr zelensky': 'Zelensky',
  'volodymyr zelenskyy': 'Zelensky',
  'zelenskyy': 'Zelensky',
  'zelensky': 'Zelensky',
  'benjamin netanyahu': 'Netanyahu',
  'netanyahu': 'Netanyahu',
  'us': 'United States',
  'u s': 'United States',
  'usa': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'eu': 'European Union',
  'uae': 'United Arab Emirates',

  // --- Cross-language normalization (corpus is ~42% Russian) ---
  // Russian (Cyrillic) → English canonical. Russian is inflected, so the
  // common case forms (nominative/genitive/accusative/instrumental) of the
  // highest-frequency entities are mapped explicitly.
  'россия': 'Russia',
  'россии': 'Russia',
  'россию': 'Russia',
  'россией': 'Russia',
  'рф': 'Russia',
  'украина': 'Ukraine',
  'украины': 'Ukraine',
  'украине': 'Ukraine',
  'украину': 'Ukraine',
  'украиной': 'Ukraine',
  'сша': 'United States',
  'америка': 'United States',
  'китай': 'China',
  'китая': 'China',
  'израиль': 'Israel',
  'израиля': 'Israel',
  'израиле': 'Israel',
  'иран': 'Iran',
  'ирана': 'Iran',
  'иране': 'Iran',
  'ирак': 'Iraq',
  'ирака': 'Iraq',
  'сирия': 'Syria',
  'сирии': 'Syria',
  'турция': 'Turkey',
  'турции': 'Turkey',
  'германия': 'Germany',
  'франция': 'France',
  'европа': 'Europe',
  'евросоюз': 'European Union',
  'белоруссия': 'Belarus',
  'беларусь': 'Belarus',
  'казахстан': 'Kazakhstan',
  'польша': 'Poland',
  'москва': 'Moscow',
  'киев': 'Kyiv',
  'путин': 'Putin',
  'зеленский': 'Zelensky',
  'байден': 'Biden',
  'трамп': 'Trump',
  'нато': 'NATO',
  'оон': 'United Nations',
  // Arabic → English canonical
  'روسيا': 'Russia',
  'أوكرانيا': 'Ukraine',
  'إيران': 'Iran',
  'إسرائيل': 'Israel',
  'غزة': 'Gaza',
  'أمريكا': 'United States',
  'الولايات المتحدة': 'United States',
  'سوريا': 'Syria',
  'تركيا': 'Turkey',
  'مصر': 'Egypt',
};

export function canonicalizeEntity(raw: string): string {
  if (!raw) return raw;
  // First consult the LLM-derived canonical map (handles inflection,
  // transliteration, mixed-script). Falls back to static rules below.
  const llm = canonicalLookup(raw);
  if (llm) return llm;
  // Normalize Unicode (NFKC) so visually-identical Cyrillic/Latin forms with
  // different byte sequences compare equal against the alias map.
  let s = raw.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
  // Strip leading honorifics (possibly several).
  let changed = true;
  while (changed) {
    changed = false;
    for (const h of HONORIFICS) {
      if (s.startsWith(h + ' ')) {
        s = s.slice(h.length + 1);
        changed = true;
      }
    }
  }
  // Strip punctuation used in initials etc.
  const key = s.replace(/[.\-_'']/g, '').replace(/\s+/g, ' ').trim();
  if (ALIASES[key]) return ALIASES[key];
  if (ALIASES[s]) return ALIASES[s];
  // Title-case the canonical surface form.
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Story deduplication -------------------------------------------------

function normalizeForDedup(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingleSet(text: string, size = 5): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) out.add(words.slice(i, i + size).join(' '));
  if (out.size === 0 && words.length) out.add(words.join(' '));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface DedupableRow {
  content?: string | null;
  channel?: string | null;
}

// Collapses near-duplicate stories. Returns one representative per cluster,
// annotated with how many raw items and how many DISTINCT sources it covered
// (the latter powers corroboration).
export interface DedupCluster<T> {
  representative: T;
  size: number;
  sources: string[];
}

export function dedupFindings<T extends DedupableRow>(
  rows: T[],
  threshold = 0.55
): DedupCluster<T>[] {
  const clusters: { shingles: Set<string>; items: T[]; sources: Set<string> }[] = [];

  for (const row of rows) {
    const sh = shingleSet(normalizeForDedup(row.content ?? ''));
    let placed = false;
    // Compare against existing cluster representatives (first item).
    for (const c of clusters) {
      if (jaccard(sh, c.shingles) >= threshold) {
        c.items.push(row);
        if (row.channel) c.sources.add(row.channel);
        placed = true;
        break;
      }
    }
    if (!placed) {
      clusters.push({ shingles: sh, items: [row], sources: new Set(row.channel ? [row.channel] : []) });
    }
  }

  return clusters.map((c) => ({
    representative: c.items[0],
    size: c.items.length,
    sources: Array.from(c.sources),
  }));
}
