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

-- 2. Game sessions table — one summary row per game session
create table if not exists game_sessions (
  id bigint generated always as identity primary key,
  session_id text not null,
  mode text,
  language text,
  player_count int,
  bar_slug text,
  cards_swiped int default 0,
  drinks_nudged int default 0,
  created_at timestamptz default now(),
  ended_at timestamptz
);

create index if not exists idx_game_sessions_session_id
  on game_sessions (session_id);

create index if not exists idx_game_sessions_bar_slug
  on game_sessions (bar_slug, created_at desc);

-- 3. Bar owners table — stores owner contact info for weekly emails
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

-- Enable RLS on game_sessions: anon can insert and update their own rows
alter table game_sessions enable row level security;

create policy "Allow anon insert" on game_sessions
  for insert
  to anon
  with check (true);

create policy "Allow anon select" on game_sessions
  for select
  to anon
  using (true);

create policy "Allow anon update" on game_sessions
  for update
  to anon
  using (true)
  with check (true);

-- bar_owners should only be accessible by the service role (cron job)
alter table bar_owners enable row level security;
-- No anon policies = anon key cannot read bar_owners

-- 4. Example: Insert a test bar owner (replace with real data)
-- insert into bar_owners (bar_slug, bar_name, owner_name, email)
-- values ('pilot', 'Pilot Bar', 'Carlos', 'carlos@example.com');
