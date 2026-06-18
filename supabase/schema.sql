-- Allen Stock Dashboard V3-1
-- PostgreSQL / Supabase schema planning
-- RLS is intentionally NOT enabled in this version.

begin;

create extension if not exists pgcrypto;

-- Keep updated_at consistent for every mutable table.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.portfolio_stocks (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  market text not null,
  cost_price numeric(18, 4) not null check (cost_price >= 0),
  shares numeric(18, 4) not null check (shares >= 0),
  position_type text not null check (position_type in ('long', 'short')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_stocks_symbol_market_unique unique (symbol, market),
  constraint portfolio_stocks_symbol_not_blank check (btrim(symbol) <> ''),
  constraint portfolio_stocks_name_not_blank check (btrim(name) <> ''),
  constraint portfolio_stocks_market_not_blank check (btrim(market) <> '')
);

comment on table public.portfolio_stocks is 'Allen 實際持股、成本、股數與部位方向。';
comment on column public.portfolio_stocks.market is '交易市場，例如 TWSE、TPEx、NASDAQ。';
comment on column public.portfolio_stocks.position_type is '部位方向：long 或 short。';

create index if not exists portfolio_stocks_symbol_idx
  on public.portfolio_stocks (symbol);
create index if not exists portfolio_stocks_active_idx
  on public.portfolio_stocks (updated_at desc)
  where is_active = true;
create index if not exists portfolio_stocks_position_type_idx
  on public.portfolio_stocks (position_type, is_active);

drop trigger if exists portfolio_stocks_set_updated_at on public.portfolio_stocks;
create trigger portfolio_stocks_set_updated_at
before update on public.portfolio_stocks
for each row execute function public.set_updated_at();

create table if not exists public.watchlist_stocks (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  name text not null,
  sector text,
  industry text,
  tier text not null default 'standard',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint watchlist_stocks_symbol_unique unique (symbol),
  constraint watchlist_stocks_symbol_not_blank check (btrim(symbol) <> ''),
  constraint watchlist_stocks_name_not_blank check (btrim(name) <> ''),
  constraint watchlist_stocks_tier_not_blank check (btrim(tier) <> '')
);

comment on table public.watchlist_stocks is '非持股但需要持續追蹤的候選股票與分類層級。';
comment on column public.watchlist_stocks.tier is '自訂關注層級，例如 core、priority、standard。';

create index if not exists watchlist_stocks_active_tier_idx
  on public.watchlist_stocks (tier, updated_at desc)
  where is_active = true;
create index if not exists watchlist_stocks_sector_idx
  on public.watchlist_stocks (sector)
  where sector is not null;
create index if not exists watchlist_stocks_industry_idx
  on public.watchlist_stocks (industry)
  where industry is not null;

drop trigger if exists watchlist_stocks_set_updated_at on public.watchlist_stocks;
create trigger watchlist_stocks_set_updated_at
before update on public.watchlist_stocks
for each row execute function public.set_updated_at();

create table if not exists public.market_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  source text not null,
  twii numeric(18, 4) not null check (twii >= 0),
  nasdaq numeric(18, 4) not null check (nasdaq >= 0),
  sox numeric(18, 4) not null check (sox >= 0),
  risk_mode text not null,
  market_score numeric(5, 2) not null check (market_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_snapshots_date_source_unique unique (snapshot_date, source),
  constraint market_snapshots_source_not_blank check (btrim(source) <> ''),
  constraint market_snapshots_risk_mode_not_blank check (btrim(risk_mode) <> '')
);

comment on table public.market_snapshots is '每日市場指數、風險模式與整體市場分數。';

create index if not exists market_snapshots_date_idx
  on public.market_snapshots (snapshot_date desc);
create index if not exists market_snapshots_source_date_idx
  on public.market_snapshots (source, snapshot_date desc);
create index if not exists market_snapshots_risk_mode_idx
  on public.market_snapshots (risk_mode, snapshot_date desc);

drop trigger if exists market_snapshots_set_updated_at on public.market_snapshots;
create trigger market_snapshots_set_updated_at
before update on public.market_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.stock_snapshots (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  snapshot_date date not null,
  price numeric(18, 4) not null check (price >= 0),
  change numeric(18, 4) not null,
  change_percent numeric(10, 4) not null,
  volume bigint not null check (volume >= 0),
  turnover numeric(24, 4) not null check (turnover >= 0),
  source text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stock_snapshots_symbol_date_source_unique unique (symbol, snapshot_date, source),
  constraint stock_snapshots_symbol_not_blank check (btrim(symbol) <> ''),
  constraint stock_snapshots_source_not_blank check (btrim(source) <> '')
);

comment on table public.stock_snapshots is '個股每日價格、漲跌、成交量與成交值快照。';

create index if not exists stock_snapshots_symbol_date_idx
  on public.stock_snapshots (symbol, snapshot_date desc);
create index if not exists stock_snapshots_date_idx
  on public.stock_snapshots (snapshot_date desc);
create index if not exists stock_snapshots_source_date_idx
  on public.stock_snapshots (source, snapshot_date desc);

drop trigger if exists stock_snapshots_set_updated_at on public.stock_snapshots;
create trigger stock_snapshots_set_updated_at
before update on public.stock_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.v85_scores (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  score_date date not null,
  market_score numeric(5, 2) not null check (market_score between 0 and 100),
  global_risk_score numeric(5, 2) not null check (global_risk_score between 0 and 100),
  industry_score numeric(5, 2) not null check (industry_score between 0 and 100),
  fundamental_score numeric(5, 2) not null check (fundamental_score between 0 and 100),
  chip_score numeric(5, 2) not null check (chip_score between 0 and 100),
  technical_score numeric(5, 2) not null check (technical_score between 0 and 100),
  risk_reward_score numeric(5, 2) not null check (risk_reward_score between 0 and 100),
  total_score numeric(5, 2) not null check (total_score between 0 and 100),
  rating text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint v85_scores_symbol_date_unique unique (symbol, score_date),
  constraint v85_scores_symbol_not_blank check (btrim(symbol) <> ''),
  constraint v85_scores_rating_not_blank check (btrim(rating) <> '')
);

comment on table public.v85_scores is 'V8.5 模型每日各維度分數、總分與評級結果。';

create index if not exists v85_scores_symbol_date_idx
  on public.v85_scores (symbol, score_date desc);
create index if not exists v85_scores_date_total_idx
  on public.v85_scores (score_date desc, total_score desc);
create index if not exists v85_scores_rating_date_idx
  on public.v85_scores (rating, score_date desc);

drop trigger if exists v85_scores_set_updated_at on public.v85_scores;
create trigger v85_scores_set_updated_at
before update on public.v85_scores
for each row execute function public.set_updated_at();

commit;
