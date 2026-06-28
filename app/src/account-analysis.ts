import { getSupabaseAdmin } from './supabase-admin';

// Account-level automated-behavior signals computed over the stored corpus.
// Heuristic, not a definitive bot classifier — these surface accounts worth a
// human look. Signals:
//   - cadence regularity: bots often post at suspiciously even intervals
//   - cross-channel duplication: identical text appearing across many channels
//     is a hallmark of coordinated amplification
//   - volume: abnormally high posting rate
//   - near-duplicate self-repetition: same account reposting near-identical text

export interface AccountSignal {
  account: string;
  channel: string;
  messageCount: number;
  cadenceRegularity: number;   // 0-1, higher = more bot-like (even intervals)
  crossChannelDupes: number;   // # of other channels carrying near-identical content
  selfRepetition: number;      // 0-1, fraction of near-duplicate own posts
  automationScore: number;     // 0-1 composite
  reasons: string[];
}

interface StoredRow {
  channel: string;
  author: string;
  content: string;
  posted_at: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(text: string, size = 4): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const out = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) out.add(words.slice(i, i + size).join(' '));
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const s of a) if (b.has(s)) inter++;
  return inter / (a.size + b.size - inter);
}

// Coefficient of variation of inter-post intervals → regularity score.
// Very low variation (evenly spaced) → high regularity → bot-like.
function cadenceRegularity(timestamps: number[]): number {
  if (timestamps.length < 4) return 0;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  if (mean === 0) return 1;
  const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  // cv near 0 = perfectly regular (bot); cv >= 1 = bursty/human. Invert + clamp.
  return Math.max(0, Math.min(1, 1 - cv));
}

const DUPLICATE_THRESHOLD = 0.7;

export async function analyzeAccounts(limit = 2000): Promise<AccountSignal[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    throw new Error('Supabase admin client not configured — set SUPABASE_SERVICE_ROLE_KEY');
  }

  const { data, error } = await supabase
    .from('sigma_messages')
    .select('channel, author, content, posted_at')
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Account analysis load failed: ${error.message}`);
  const rows = (data ?? []) as StoredRow[];

  // Group by account@channel
  const groups = new Map<string, StoredRow[]>();
  for (const r of rows) {
    const key = `${r.author}@@${r.channel}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  // Pre-compute normalized shingle sets per message for cross-channel comparison.
  const allShingles = rows.map((r) => ({ channel: r.channel, sh: shingles(normalize(r.content)) }));

  const signals: AccountSignal[] = [];

  for (const [key, msgs] of groups) {
    if (msgs.length < 3) continue; // need some volume to judge
    const [account, channel] = key.split('@@');

    const reasons: string[] = [];

    const cadence = cadenceRegularity(msgs.map((m) => new Date(m.posted_at).getTime()));
    if (cadence >= 0.7) reasons.push(`Highly regular posting cadence (${cadence.toFixed(2)})`);

    // Self-repetition: fraction of this account's posts that near-duplicate another of its own.
    const sh = msgs.map((m) => shingles(normalize(m.content)));
    let dupPairs = 0;
    for (let i = 0; i < sh.length; i++)
      for (let j = i + 1; j < sh.length; j++)
        if (jaccard(sh[i], sh[j]) >= DUPLICATE_THRESHOLD) dupPairs++;
    const selfRepetition = msgs.length > 1 ? Math.min(1, dupPairs / msgs.length) : 0;
    if (selfRepetition >= 0.3) reasons.push(`Repetitive near-duplicate content (${selfRepetition.toFixed(2)})`);

    // Cross-channel duplication: does this account's content appear in OTHER channels?
    const otherChannels = new Set<string>();
    for (const m of msgs) {
      const mySh = shingles(normalize(m.content));
      for (const other of allShingles) {
        if (other.channel === channel) continue;
        if (jaccard(mySh, other.sh) >= DUPLICATE_THRESHOLD) otherChannels.add(other.channel);
      }
    }
    const crossChannelDupes = otherChannels.size;
    if (crossChannelDupes >= 2) reasons.push(`Content mirrored across ${crossChannelDupes} other channels`);

    // High volume relative to corpus window.
    if (msgs.length >= 15) reasons.push(`High posting volume (${msgs.length} messages)`);

    const automationScore = Math.min(
      1,
      cadence * 0.35 + selfRepetition * 0.3 + Math.min(1, crossChannelDupes / 5) * 0.25 + Math.min(1, msgs.length / 30) * 0.1
    );

    if (automationScore >= 0.3) {
      signals.push({
        account,
        channel,
        messageCount: msgs.length,
        cadenceRegularity: cadence,
        crossChannelDupes,
        selfRepetition,
        automationScore,
        reasons,
      });
    }
  }

  return signals.sort((a, b) => b.automationScore - a.automationScore);
}
