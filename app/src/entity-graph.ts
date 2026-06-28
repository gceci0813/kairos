import { getSupabaseAdmin } from './supabase-admin';
import { canonicalizeEntity } from './entity-resolution';

// Entity co-occurrence graph: which entities (orgs, places, and topics) appear
// together in the same findings. Aggregate relationships between PUBLIC
// entities/narratives — not personal dossiers or networks of private people.

export interface GraphNode {
  id: string;
  type: string;
  weight: number; // total mentions
}
export interface GraphEdge {
  source: string;
  target: string;
  weight: number; // co-occurrence count
}

interface FindingRow {
  entities: Array<{ text: string; type: string }> | null;
  topics: string[] | null;
  analyzed_at: string;
}

export async function entityGraph(
  sinceDays = 30,
  options: { minEdgeWeight?: number; maxNodes?: number; includeTopics?: boolean } = {}
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error('Supabase admin client not configured');

  const minEdge = options.minEdgeWeight ?? 2;
  const maxNodes = options.maxNodes ?? 60;
  const includeTopics = options.includeTopics ?? true;

  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data, error } = await supabase
    .from('sigma_findings')
    .select('entities, topics, analyzed_at')
    .gte('analyzed_at', since)
    .limit(8000);
  if (error) throw new Error(error.message);

  const nodeWeight = new Map<string, { type: string; weight: number }>();
  const edgeWeight = new Map<string, number>();

  for (const f of (data ?? []) as FindingRow[]) {
    // Build the set of canonical entity nodes in this finding. Exclude persons
    // from the node set to keep the graph about orgs/places/narratives, not
    // individuals.
    const items: { id: string; type: string }[] = [];
    for (const e of f.entities ?? []) {
      if (e.type === 'person') continue; // keep graph non-personal
      items.push({ id: canonicalizeEntity(e.text), type: e.type });
    }
    if (includeTopics) {
      for (const t of f.topics ?? []) items.push({ id: canonicalizeEntity(t), type: 'topic' });
    }

    // Dedup within the finding.
    const uniq = Array.from(new Map(items.map((i) => [i.id, i])).values());
    for (const n of uniq) {
      const cur = nodeWeight.get(n.id) ?? { type: n.type, weight: 0 };
      cur.weight++;
      nodeWeight.set(n.id, cur);
    }
    // Pairwise co-occurrence.
    for (let i = 0; i < uniq.length; i++) {
      for (let j = i + 1; j < uniq.length; j++) {
        const [a, b] = [uniq[i].id, uniq[j].id].sort();
        const key = `${a}|||${b}`;
        edgeWeight.set(key, (edgeWeight.get(key) ?? 0) + 1);
      }
    }
  }

  // Keep the strongest nodes.
  const topNodes = Array.from(nodeWeight.entries())
    .sort((a, b) => b[1].weight - a[1].weight)
    .slice(0, maxNodes);
  const nodeIds = new Set(topNodes.map(([id]) => id));

  const nodes: GraphNode[] = topNodes.map(([id, v]) => ({ id, type: v.type, weight: v.weight }));
  const edges: GraphEdge[] = Array.from(edgeWeight.entries())
    .filter(([, w]) => w >= minEdge)
    .map(([key, w]) => {
      const [source, target] = key.split('|||');
      return { source, target, weight: w };
    })
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 200);

  return { nodes, edges };
}
