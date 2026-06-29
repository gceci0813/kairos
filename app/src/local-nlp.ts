import { Entity, Sentiment } from './sigma-types';
import { lookupPlace } from './atlas-gazetteer';

// Local, LLM-free analysis tier. Lower fidelity than the Anthropic/Ollama
// tiers, but runs with zero API cost so the corpus can keep growing when no
// model is available. Lexicon sentiment + gazetteer/keyword entity extraction
// + keyword topics. Aggregate content analysis — no individual identification.

interface LocalResult {
  sentiment: Sentiment;
  sentimentScore: number;
  entities: Entity[];
  topics: string[];
}

// Compact sentiment lexicon (English). Multilingual content scores neutral and
// is better handled by the LLM tier when available.
const POS = new Set([
  'good', 'great', 'positive', 'win', 'wins', 'won', 'success', 'successful', 'peace',
  'agreement', 'deal', 'support', 'aid', 'progress', 'recovery', 'gain', 'gains', 'hope',
  'breakthrough', 'cooperation', 'stable', 'growth', 'victory', 'relief', 'improve', 'improved',
  'celebrate', 'strong', 'boost', 'welcome', 'praise', 'benefit', 'resolved', 'ceasefire',
]);
const NEG = new Set([
  'bad', 'worse', 'worst', 'negative', 'loss', 'losses', 'lost', 'fail', 'failed', 'failure',
  'war', 'attack', 'attacks', 'killed', 'death', 'deaths', 'dead', 'casualties', 'crisis',
  'conflict', 'threat', 'threats', 'sanction', 'sanctions', 'strike', 'strikes', 'fear',
  'violence', 'collapse', 'corruption', 'fraud', 'protest', 'unrest', 'damage', 'destroyed',
  'wounded', 'explosion', 'missile', 'shelling', 'invasion', 'escalation', 'blast', 'crackdown',
]);

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'by',
  'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'will', 'would',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their', 'he', 'she', 'his',
  'her', 'we', 'you', 'i', 'not', 'no', 'so', 'if', 'than', 'then', 'there', 'here', 'about',
  'into', 'over', 'after', 'before', 'more', 'most', 'said', 'says', 'new', 'one', 'two', 'also',
]);

const ORG_HINTS = /\b(ministry|ministers?|government|party|council|agency|forces?|army|navy|corps|brigade|union|nato|un|eu|imf|opec|company|corp|inc|bank|court|parliament|congress|senate|commission)\b/i;

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

function localSentiment(text: string): { sentiment: Sentiment; score: number } {
  const toks = tokenize(text);
  let pos = 0, neg = 0;
  for (const t of toks) { if (POS.has(t)) pos++; else if (NEG.has(t)) neg++; }
  const total = pos + neg;
  if (total === 0) return { sentiment: 'neutral', score: 0 };
  const score = (pos - neg) / total;
  const sentiment: Sentiment =
    score > 0.25 ? 'positive' : score < -0.25 ? 'negative' : pos > 0 && neg > 0 ? 'mixed' : 'neutral';
  return { sentiment, score: Math.max(-1, Math.min(1, score)) };
}

// Capitalized multi-word sequences are candidate proper nouns. Classify by
// gazetteer (location) or org hints; skip everything else (we don't attempt
// person identification).
function localEntities(text: string): Entity[] {
  const out = new Map<string, Entity>();
  const matches = text.match(/\b([A-ZА-ЯЁ][\p{L}.&-]+(?:\s+[A-ZА-ЯЁ][\p{L}.&-]+){0,3})\b/gu) ?? [];
  for (const m of matches) {
    const term = m.trim();
    if (term.length < 3) continue;
    if (lookupPlace(term)) {
      out.set(term.toLowerCase(), { text: term, type: 'location' });
    } else if (ORG_HINTS.test(term)) {
      out.set(term.toLowerCase(), { text: term, type: 'organization' });
    }
  }
  return Array.from(out.values()).slice(0, 12);
}

function localTopics(text: string): string[] {
  const toks = tokenize(text);
  const freq = new Map<string, number>();
  for (const t of toks) {
    if (t.length < 4 || STOP.has(t)) continue;
    freq.set(t, (freq.get(t) ?? 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t]) => t.charAt(0).toUpperCase() + t.slice(1));
}

export function localAnalyze(text: string): LocalResult {
  const { sentiment, score } = localSentiment(text);
  return {
    sentiment,
    sentimentScore: Number(score.toFixed(2)),
    entities: localEntities(text),
    topics: localTopics(text),
  };
}
