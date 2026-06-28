-- Stores NLP findings produced asynchronously by the process worker after it
-- consumes message keys from the Redis Streams queue. Run in Supabase → SQL
-- Editor (one paste), same as migration 0001.

create table if not exists sigma_findings (
  id              bigint generated always as identity primary key,
  msg_key         text unique not null references sigma_messages (msg_key) on delete cascade,
  channel         text,
  finding         text,
  confidence      real,
  language        text,
  sentiment       text,
  sentiment_score real,
  entities        jsonb default '[]'::jsonb,
  topics          jsonb default '[]'::jsonb,
  coordination    jsonb default '{}'::jsonb,
  recommended_action text,
  analyzed_at     timestamptz default now()
);

create index if not exists sigma_findings_analyzed_at_idx
  on sigma_findings (analyzed_at desc);
create index if not exists sigma_findings_action_idx
  on sigma_findings (recommended_action);

alter table sigma_findings enable row level security;

create policy "sigma_findings_read" on sigma_findings
  for select to authenticated using (true);
