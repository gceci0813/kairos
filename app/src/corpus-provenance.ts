import { getSupabaseAdmin } from './supabase-admin';

// Auditable corpus metadata: what's actually in the dataset that ATLAS/ORACLE/
// Political forecasts are computed over. Surfaces coverage limitations (source
// mix, language mix, date range, % analyzed) that confidence intervals can't —
// the selection/coverage bias that dominates real error.

export interface SourceProvenance {
  source: string;
  messages: number;
  share: number;
  earliest: string | null;
  latest: string | null;
  language?: string | null;
}

export interface CorpusProvenance {
  generatedAt: string;
  totals: {
    messages: number;
    findings: number;
    analyzedCoverage: number; // findings / messages
    distinctSources: number;
  };
  dateRange: { earliestPost: string | null; latestPost: string | null; earliestIngest: string | null; latestIngest: string | null };
  languageMix: { language: string; findings: number; share: number }[];
  sources: SourceProvenance[];
}

export async function getCorpusProvenance(sampleLimit = 12000): Promise<CorpusProvenance> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  // Exact counts (head requests — no rows transferred).
  const [{ count: msgCount }, { count: findCount }] = await Promise.all([
    supabase.from('sigma_messages').select('*', { count: 'exact', head: true }),
    supabase.from('sigma_findings').select('*', { count: 'exact', head: true }),
  ]);

  // Pull metadata columns to aggregate per-source + date range in JS.
  const { data: msgs, error: msgErr } = await supabase
    .from('sigma_messages')
    .select('channel, posted_at, ingested_at')
    .order('posted_at', { ascending: true })
    .limit(sampleLimit);
  if (msgErr) throw new Error(msgErr.message);

  const { data: finds, error: findErr } = await supabase
    .from('sigma_findings')
    .select('language')
    .limit(sampleLimit);
  if (findErr) throw new Error(findErr.message);

  // Channel-declared languages (from the seeded registry).
  const { data: chans } = await supabase.from('sigma_channels').select('username, language');
  const chanLang = new Map<string, string | null>((chans ?? []).map((c: any) => [c.username, c.language]));

  // Per-source aggregation + global date bounds.
  const bySource = new Map<string, { messages: number; earliest: string | null; latest: string | null }>();
  let earliestPost: string | null = null, latestPost: string | null = null;
  let earliestIngest: string | null = null, latestIngest: string | null = null;

  for (const m of msgs ?? []) {
    const src = (m as any).channel ?? 'unknown';
    if (!bySource.has(src)) bySource.set(src, { messages: 0, earliest: null, latest: null });
    const s = bySource.get(src)!;
    s.messages++;
    const p = (m as any).posted_at as string | null;
    const ing = (m as any).ingested_at as string | null;
    if (p) {
      if (!s.earliest || p < s.earliest) s.earliest = p;
      if (!s.latest || p > s.latest) s.latest = p;
      if (!earliestPost || p < earliestPost) earliestPost = p;
      if (!latestPost || p > latestPost) latestPost = p;
    }
    if (ing) {
      if (!earliestIngest || ing < earliestIngest) earliestIngest = ing;
      if (!latestIngest || ing > latestIngest) latestIngest = ing;
    }
  }

  const sampledTotal = (msgs ?? []).length || 1;
  const sources: SourceProvenance[] = Array.from(bySource.entries())
    .map(([source, s]) => ({
      source,
      messages: s.messages,
      share: s.messages / sampledTotal,
      earliest: s.earliest,
      latest: s.latest,
      language: chanLang.get(source) ?? null,
    }))
    .sort((a, b) => b.messages - a.messages);

  // Language mix from findings.
  const langCounts = new Map<string, number>();
  for (const f of finds ?? []) {
    const l = (f as any).language ?? 'unknown';
    langCounts.set(l, (langCounts.get(l) ?? 0) + 1);
  }
  const langTotal = (finds ?? []).length || 1;
  const languageMix = Array.from(langCounts.entries())
    .map(([language, n]) => ({ language, findings: n, share: n / langTotal }))
    .sort((a, b) => b.findings - a.findings);

  const messages = msgCount ?? sampledTotal;
  const findings = findCount ?? 0;

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      messages,
      findings,
      analyzedCoverage: messages > 0 ? findings / messages : 0,
      distinctSources: bySource.size,
    },
    dateRange: { earliestPost, latestPost, earliestIngest, latestIngest },
    languageMix,
    sources,
  };
}
