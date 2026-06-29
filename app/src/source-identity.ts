// Source identity: collapse channels that are almost certainly the same
// operator (language/locale variants of one brand) into a single "owner group",
// so duplicate content posted across a source's OWN paired channels does not
// count as independent corroboration. Aggregate source bookkeeping.

// Common language/locale suffixes appended to a base brand handle.
const SUFFIXES = [
  'en', 'eng', 'english', 'ru', 'rus', 'russian', 'ua', 'uk', 'ukr', 'de', 'fr',
  'es', 'esp', 'ar', 'fa', 'tr', 'it', 'pt', 'zh', 'cn', 'intl', 'international',
  'official', 'news', 'channel', 'tv', 'live', 'global', 'world', 'org', 'bot',
];

export function ownerGroup(channel: string | null | undefined): string {
  if (!channel) return 'unknown';
  let s = channel.toLowerCase().trim();
  // Normalize separators to a single token stream.
  const sep = /[\s_\-.]+/;
  let parts = s.split(sep).filter(Boolean);

  // Strip trailing suffix tokens (possibly several: e.g. "wallet_en_official").
  let changed = true;
  while (changed && parts.length > 1) {
    changed = false;
    const last = parts[parts.length - 1];
    if (SUFFIXES.includes(last)) { parts.pop(); changed = true; }
  }

  let base = parts.join('');
  // Also strip a glued trailing suffix on a single token (e.g. "mytonwalleten").
  for (const suf of SUFFIXES.sort((a, b) => b.length - a.length)) {
    if (base.length > suf.length + 3 && base.endsWith(suf)) {
      base = base.slice(0, -suf.length);
      break;
    }
  }
  return base || s;
}

// Count of distinct owner groups in a set of source channels.
export function distinctOwners(sources: Iterable<string>): number {
  const set = new Set<string>();
  for (const s of sources) set.add(ownerGroup(s));
  return set.size;
}
