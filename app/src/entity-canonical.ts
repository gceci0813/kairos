import { anthropic } from '@/lib/anthropic';
import { getSupabaseAdmin } from './supabase-admin';

// LLM-derived canonical entity map. Loaded once and cached in module memory;
// canonicalizeEntity() consults it before its static alias/title-case logic,
// so cross-language and mixed-script forms resolve correctly everywhere.

let CANONICAL_MAP: Map<string, string> | null = null;
let loadedAt = 0;
const TTL_MS = 10 * 60 * 1000;

function norm(text: string): string {
  return text.normalize('NFKC').toLowerCase().trim().replace(/\s+/g, ' ');
}

export async function ensureCanonicalMap(): Promise<void> {
  if (CANONICAL_MAP && Date.now() - loadedAt < TTL_MS) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    CANONICAL_MAP = CANONICAL_MAP ?? new Map();
    return;
  }
  const { data, error } = await supabase.from('sigma_entity_canonical').select('raw_lower, canonical').limit(20000);
  if (error) {
    // Table may not exist yet — degrade gracefully to static rules.
    CANONICAL_MAP = CANONICAL_MAP ?? new Map();
    return;
  }
  CANONICAL_MAP = new Map((data ?? []).map((r: any) => [r.raw_lower, r.canonical]));
  loadedAt = Date.now();
}

// Synchronous lookup used inside canonicalizeEntity (map already loaded).
export function canonicalLookup(text: string): string | undefined {
  if (!CANONICAL_MAP) return undefined;
  return CANONICAL_MAP.get(norm(text));
}

// --- Build pass (LLM) ----------------------------------------------------

interface Mapping { raw: string; canonical: string; type: string }

const BUILD_TOOL = {
  name: 'record_canonical_entities',
  description: 'Map each surface form to a single canonical English name for the same real-world entity.',
  input_schema: {
    type: 'object' as const,
    properties: {
      mappings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            raw: { type: 'string', description: 'the input surface form, verbatim' },
            canonical: { type: 'string', description: 'canonical English name (e.g. россии → Russia, إيران → Iran)' },
            type: { type: 'string', enum: ['person', 'organization', 'location', 'other'] },
          },
          required: ['raw', 'canonical', 'type'],
        },
      },
    },
    required: ['mappings'],
  },
};

async function mapBatch(texts: string[]): Promise<Mapping[]> {
  const res = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    tools: [BUILD_TOOL],
    tool_choice: { type: 'tool', name: 'record_canonical_entities' },
    messages: [
      {
        role: 'user',
        content:
          'For each of these entity surface forms (any language/script/case), give the canonical English name for the same real-world entity. ' +
          'Collapse inflected, transliterated, and mixed-script variants to one canonical form.\n\n' +
          JSON.stringify(texts),
      },
    ],
  });
  const block = res.content.find((b) => b.type === 'tool_use');
  if (block && block.type === 'tool_use') return (block.input as any).mappings ?? [];
  return [];
}

export async function buildCanonicalMappings(maxDistinct = 400): Promise<{ scanned: number; mapped: number; errors: string[] }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  // Gather distinct entity surface forms from findings.
  const { data, error } = await supabase.from('sigma_findings').select('entities').limit(8000);
  if (error) throw new Error(error.message);

  const counts = new Map<string, { text: string; type: string; n: number }>();
  for (const f of data ?? []) {
    for (const e of ((f as any).entities ?? [])) {
      const key = norm(e.text);
      if (!key) continue;
      const cur = counts.get(key) ?? { text: e.text, type: e.type, n: 0 };
      cur.n++;
      counts.set(key, cur);
    }
  }

  // Which are already mapped?
  const { data: existing } = await supabase.from('sigma_entity_canonical').select('raw_lower').limit(20000);
  const done = new Set((existing ?? []).map((r: any) => r.raw_lower));

  // Prioritize highest-frequency unmapped entities.
  const todo = Array.from(counts.entries())
    .filter(([k]) => !done.has(k))
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, maxDistinct);

  const errors: string[] = [];
  let mapped = 0;
  const BATCH = 40;
  const startedAt = Date.now();

  for (let i = 0; i < todo.length; i += BATCH) {
    if (Date.now() - startedAt > 50_000) break; // stay under function limit
    const slice = todo.slice(i, i + BATCH);
    try {
      const mappings = await mapBatch(slice.map(([, v]) => v.text));
      const rows = mappings
        .filter((m) => m.raw && m.canonical)
        .map((m) => ({ raw_lower: norm(m.raw), canonical: m.canonical, entity_type: m.type }));
      if (rows.length) {
        const { error: upErr } = await supabase.from('sigma_entity_canonical').upsert(rows, { onConflict: 'raw_lower', ignoreDuplicates: true });
        if (upErr) errors.push(upErr.message);
        else mapped += rows.length;
      }
    } catch (err: any) {
      errors.push(err.message ?? 'batch failed');
    }
  }

  // Refresh the in-memory cache.
  loadedAt = 0;
  await ensureCanonicalMap();

  return { scanned: counts.size, mapped, errors };
}
