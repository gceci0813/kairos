-- SIGMA ingestion store: channels + messages.
-- Run this in your Supabase dashboard → SQL Editor (one paste).
-- Writes happen only via the service-role key (server-side cron/ingest),
-- so RLS denies all anon access by default and we add a read policy for
-- authenticated dashboard users.

create table if not exists sigma_channels (
  id            bigint generated always as identity primary key,
  username      text unique not null,
  title         text,
  language      text,
  p90_views     bigint default 0,
  priority      int default 0,
  last_crawled  timestamptz,
  created_at    timestamptz default now()
);

create index if not exists sigma_channels_last_crawled_idx
  on sigma_channels (last_crawled nulls first, p90_views desc);

create table if not exists sigma_messages (
  id           bigint generated always as identity primary key,
  channel      text not null,
  msg_key      text unique not null,   -- e.g. "username/12345" — dedup key
  content      text not null,
  author       text,
  posted_at    timestamptz,
  url          text,
  ingested_at  timestamptz default now()
);

create index if not exists sigma_messages_posted_at_idx
  on sigma_messages (posted_at desc);
create index if not exists sigma_messages_content_idx
  on sigma_messages using gin (to_tsvector('simple', content));

alter table sigma_channels enable row level security;
alter table sigma_messages enable row level security;

-- Authenticated users (your logged-in analysts) can read; nobody can write
-- via anon/auth keys — only the service-role key (which bypasses RLS) writes.
create policy "sigma_channels_read" on sigma_channels
  for select to authenticated using (true);
create policy "sigma_messages_read" on sigma_messages
  for select to authenticated using (true);
