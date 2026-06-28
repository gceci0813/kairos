-- LLM-derived canonical entity mappings. Maps any surface form (inflected,
-- transliterated, mixed-script) of an entity to a single English canonical
-- name. Populated once per distinct entity by /api/intel/build-canonical.
-- Run in Supabase → SQL Editor.

create table if not exists sigma_entity_canonical (
  raw_lower   text primary key,   -- normalized (NFKC, lowercased) surface form
  canonical   text not null,      -- English canonical name
  entity_type text,
  created_at  timestamptz default now()
);

alter table sigma_entity_canonical enable row level security;
create policy "sigma_entity_canonical_read" on sigma_entity_canonical
  for select to authenticated using (true);
