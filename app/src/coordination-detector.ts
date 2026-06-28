import { StandardizedData } from './base-connector';
import { CoordinationSignal } from './sigma-types';

// Heuristic, not a definitive bot/coordination classifier. Signals are based
// only on what's available in a single query's result batch (no historical
// per-account behavior), so treat output as "worth a human look", not proof.

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shingles(text: string, size = 3): Set<string> {
  const words = text.split(' ').filter(Boolean);
  const result = new Set<string>();
  for (let i = 0; i <= words.length - size; i++) {
    result.add(words.slice(i, i + size).join(' '));
  }
  return result;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const NEAR_DUPLICATE_THRESHOLD = 0.6;
const BURST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const BURST_DISTINCT_AUTHOR_THRESHOLD = 3;

export function detectCoordination(
  item: StandardizedData,
  batch: StandardizedData[]
): CoordinationSignal {
  const reasons: string[] = [];
  let score = 0;

  const itemShingles = shingles(normalizeForComparison(item.content));
  const itemTime = item.timestamp.getTime();

  const nearDuplicateAuthors = new Set<string>();
  for (const other of batch) {
    if (other.id === item.id) continue;
    const similarity = jaccardSimilarity(itemShingles, shingles(normalizeForComparison(other.content)));
    if (similarity >= NEAR_DUPLICATE_THRESHOLD && Math.abs(other.timestamp.getTime() - itemTime) <= BURST_WINDOW_MS) {
      nearDuplicateAuthors.add(other.author);
    }
  }

  if (nearDuplicateAuthors.size >= BURST_DISTINCT_AUTHOR_THRESHOLD) {
    reasons.push(
      `Near-identical content posted by ${nearDuplicateAuthors.size} other accounts within a 5-minute window`
    );
    score += Math.min(0.6, 0.15 * nearDuplicateAuthors.size);
  } else if (nearDuplicateAuthors.size > 0) {
    reasons.push(`Near-identical content found from ${nearDuplicateAuthors.size} other account(s)`);
    score += 0.15 * nearDuplicateAuthors.size;
  }

  const sameAuthorPosts = batch.filter((other) => other.author === item.author);
  if (sameAuthorPosts.length >= 5) {
    reasons.push(`Author posted ${sameAuthorPosts.length} times in this result set`);
    score += 0.2;
  }

  score = Math.min(1, score);

  return {
    isFlagged: score >= 0.4,
    reasons,
    score,
  };
}
