create table public.matches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opponent text not null default 'Rivals FC',
  match_date date,
  kickoff text,
  duration text,
  location text,
  format text not null default '7v7',
  home_color text not null default '#1e3a5f',
  away_color text not null default '#d44a2a',
  home_players jsonb not null default '[]'::jsonb,
  away_players jsonb not null default '[]'::jsonb,
  stats jsonb not null default '[]'::jsonb,
  goals jsonb not null default '[]'::jsonb,
  videos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.matches enable row level security;

create policy "Public read matches" on public.matches for select using (true);
create policy "Public insert matches" on public.matches for insert with check (true);
create policy "Public update matches" on public.matches for update using (true);
create policy "Public delete matches" on public.matches for delete using (true);

create index matches_created_at_idx on public.matches (created_at desc);
create index matches_name_idx on public.matches using gin (to_tsvector('simple', name || ' ' || opponent || ' ' || coalesce(location,'')));