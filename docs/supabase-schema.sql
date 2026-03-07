-- Supabase SQL Schema for Salud Game Bar Analytics
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Bar events table — stores all analytics events from the client
create table if not exists bar_events (
  id bigint generated always as identity primary key,
  bar_slug text not null,
  event_type text not null,
  session_id text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Index for weekly report queries (filter by bar + date range)
create index if not exists idx_bar_events_slug_created
  on bar_events (bar_slug, created_at desc);

-- Index for event type filtering
create index if not exists idx_bar_events_type
  on bar_events (event_type);

-- 2. Bar owners table — stores owner contact info for weekly emails
create table if not exists bar_owners (
  id bigint generated always as identity primary key,
  bar_slug text not null unique,
  bar_name text not null,
  owner_name text not null,
  email text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Row Level Security (RLS)
-- Enable RLS on bar_events so the anon key can only INSERT (not read/delete)
alter table bar_events enable row level security;

create policy "Allow anon insert" on bar_events
  for insert
  to anon
  with check (true);

-- bar_owners should only be accessible by the service role (cron job)
alter table bar_owners enable row level security;
-- No anon policies = anon key cannot read bar_owners

-- 4. Example: Insert a test bar owner (replace with real data)
-- insert into bar_owners (bar_slug, bar_name, owner_name, email)
-- values ('pilot', 'Pilot Bar', 'Carlos', 'carlos@example.com');
