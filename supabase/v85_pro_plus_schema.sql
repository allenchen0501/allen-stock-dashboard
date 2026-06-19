-- Allen Stock Dashboard V3-1.5 / V8.5 Pro+
-- Apply after supabase/schema.sql in a Supabase SQL Editor.
-- This migration is additive: it does not replace or delete V3-1 data.

begin;

create extension if not exists pgcrypto;

-- Keep this file independently repeatable after the base schema is installed.
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

create table if not exists public.v85_model_runs (
  id uuid primary key default gen_random_uuid(),
  model_version text not null default 'v8.5-pro-plus',
  as_of_date date not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'succeeded', 'partial', 'failed')),
  started_at timestamptz,
  finished_at timestamptz,
  input_cutoff_at timestamptz not null,
  symbol_count integer not null default 0 check (symbol_count >= 0),
  success_count integer not null default 0 check (success_count >= 0),
  failure_count integer not null default 0 check (failure_count >= 0),
  source_trace jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_trace) = 'object'),
  error_summary jsonb not null default '[]'::jsonb
    check (jsonb_typeof(error_summary) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint v85_model_runs_version_not_blank check (btrim(model_version) <> ''),
  constraint v85_model_runs_counts_valid check (success_count + failure_count <= symbol_count),
  constraint v85_model_runs_time_order check (finished_at is null or started_at is null or finished_at >= started_at)
);

comment on table public.v85_model_runs is 'V8.5 Pro+ 每次計算批次的狀態、資料截止時間與來源追蹤。';

create index if not exists v85_model_runs_date_status_idx
  on public.v85_model_runs (as_of_date desc, status);
create index if not exists v85_model_runs_version_date_idx
  on public.v85_model_runs (model_version, as_of_date desc);

drop trigger if exists v85_model_runs_set_updated_at on public.v85_model_runs;
create trigger v85_model_runs_set_updated_at
before update on public.v85_model_runs
for each row execute function public.set_updated_at();

create table if not exists public.v85_pro_plus_scores (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.v85_model_runs (id) on delete set null,
  symbol text not null,
  score_date date not null,
  model_version text not null default 'v8.5-pro-plus',
  market_score numeric(5, 2) not null check (market_score between 0 and 100),
  global_risk_score numeric(5, 2) not null check (global_risk_score between 0 and 100),
  industry_score numeric(5, 2) not null check (industry_score between 0 and 100),
  fundamental_score numeric(5, 2) not null check (fundamental_score between 0 and 100),
  chip_score numeric(5, 2) not null check (chip_score between 0 and 100),
  technical_score numeric(5, 2) not null check (technical_score between 0 and 100),
  risk_reward_score numeric(5, 2) not null check (risk_reward_score between 0 and 100),
  total_score numeric(5, 2) not null check (total_score between 0 and 100),
  confidence numeric(5, 2) not null check (confidence between 0 and 100),
  data_completeness numeric(5, 2) not null check (data_completeness between 0 and 100),
  rating text not null,
  signal text not null check (signal in ('strong_buy', 'buy', 'watch', 'reduce', 'avoid')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  thesis text,
  score_breakdown jsonb not null default '{}'::jsonb
    check (jsonb_typeof(score_breakdown) = 'object'),
  evidence jsonb not null default '[]'::jsonb
    check (jsonb_typeof(evidence) = 'array'),
  risk_flags jsonb not null default '[]'::jsonb
    check (jsonb_typeof(risk_flags) = 'array'),
  calculated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint v85_pro_plus_symbol_date_version_unique unique (symbol, score_date, model_version),
  constraint v85_pro_plus_symbol_not_blank check (btrim(symbol) <> ''),
  constraint v85_pro_plus_version_not_blank check (btrim(model_version) <> ''),
  constraint v85_pro_plus_rating_not_blank check (btrim(rating) <> '')
);

comment on table public.v85_pro_plus_scores is 'V8.5 Pro+ 可追溯評分；保留信心度、資料完整度、論點與證據。';
comment on column public.v85_pro_plus_scores.evidence is '證據陣列；每筆應包含來源、時間與摘要，不存整份原始檔。';

create index if not exists v85_pro_plus_symbol_date_idx
  on public.v85_pro_plus_scores (symbol, score_date desc);
create index if not exists v85_pro_plus_date_total_idx
  on public.v85_pro_plus_scores (score_date desc, total_score desc);
create index if not exists v85_pro_plus_signal_date_idx
  on public.v85_pro_plus_scores (signal, score_date desc);
create index if not exists v85_pro_plus_run_idx
  on public.v85_pro_plus_scores (run_id)
  where run_id is not null;

drop trigger if exists v85_pro_plus_scores_set_updated_at on public.v85_pro_plus_scores;
create trigger v85_pro_plus_scores_set_updated_at
before update on public.v85_pro_plus_scores
for each row execute function public.set_updated_at();

create table if not exists public.war_room_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  session text not null default 'daily'
    check (session in ('pre_market', 'intraday', 'post_market', 'daily')),
  model_version text not null default 'v8.5-pro-plus',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'superseded', 'failed')),
  market_mode text not null,
  market_score numeric(5, 2) not null check (market_score between 0 and 100),
  recommended_exposure numeric(5, 2) not null check (recommended_exposure between 0 and 100),
  headline text not null,
  summary text not null,
  data_cutoff_at timestamptz not null,
  published_at timestamptz,
  source_trace jsonb not null default '{}'::jsonb
    check (jsonb_typeof(source_trace) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint war_room_snapshot_identity_unique unique (snapshot_date, session, model_version),
  constraint war_room_market_mode_not_blank check (btrim(market_mode) <> ''),
  constraint war_room_headline_not_blank check (btrim(headline) <> ''),
  constraint war_room_summary_not_blank check (btrim(summary) <> ''),
  constraint war_room_publish_state_valid check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

comment on table public.war_room_snapshots is '戰情室一次可發布、可追溯的市場快照。';

create index if not exists war_room_snapshots_status_date_idx
  on public.war_room_snapshots (status, snapshot_date desc, data_cutoff_at desc);

drop trigger if exists war_room_snapshots_set_updated_at on public.war_room_snapshots;
create trigger war_room_snapshots_set_updated_at
before update on public.war_room_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.war_room_items (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.war_room_snapshots (id) on delete cascade,
  section text not null
    check (section in ('market_signal', 'holdings', 'risk_reward', 'breakout', 'avoid')),
  item_key text not null,
  symbol text,
  rank integer check (rank is null or rank > 0),
  title text not null,
  action text,
  score numeric(5, 2) check (score is null or score between 0 and 100),
  confidence numeric(5, 2) check (confidence is null or confidence between 0 and 100),
  reason text,
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint war_room_item_identity_unique unique (snapshot_id, section, item_key),
  constraint war_room_item_key_not_blank check (btrim(item_key) <> ''),
  constraint war_room_item_title_not_blank check (btrim(title) <> ''),
  constraint war_room_item_symbol_not_blank check (symbol is null or btrim(symbol) <> '')
);

comment on table public.war_room_items is '戰情室各區塊的排序讀取模型；payload 僅放區塊專屬欄位。';

create index if not exists war_room_items_snapshot_section_rank_idx
  on public.war_room_items (snapshot_id, section, rank nulls last);
create index if not exists war_room_items_symbol_idx
  on public.war_room_items (symbol)
  where symbol is not null;

drop trigger if exists war_room_items_set_updated_at on public.war_room_items;
create trigger war_room_items_set_updated_at
before update on public.war_room_items
for each row execute function public.set_updated_at();

create table if not exists public.research_artifacts (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'war-room-artifacts',
  object_path text not null,
  artifact_type text not null
    check (artifact_type in ('raw_import', 'source_snapshot', 'research_report', 'chart', 'export')),
  owner_type text not null
    check (owner_type in ('model_run', 'score', 'war_room_snapshot')),
  owner_id uuid not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text,
  source_url text,
  captured_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint research_artifacts_object_unique unique (bucket_id, object_path),
  constraint research_artifacts_bucket_not_blank check (btrim(bucket_id) <> ''),
  constraint research_artifacts_path_not_blank check (btrim(object_path) <> ''),
  constraint research_artifacts_mime_not_blank check (btrim(mime_type) <> ''),
  constraint research_artifacts_expiry_valid check (expires_at is null or expires_at > created_at)
);

comment on table public.research_artifacts is 'Supabase Storage 物件的可稽核登錄；檔案本體不寫入資料表。';

create index if not exists research_artifacts_owner_idx
  on public.research_artifacts (owner_type, owner_id, created_at desc)
  where deleted_at is null;
create index if not exists research_artifacts_expiry_idx
  on public.research_artifacts (expires_at)
  where expires_at is not null and deleted_at is null;

drop trigger if exists research_artifacts_set_updated_at on public.research_artifacts;
create trigger research_artifacts_set_updated_at
before update on public.research_artifacts
for each row execute function public.set_updated_at();

-- Supabase Storage is optional outside Supabase. When present, provision one private bucket.
do $$
begin
  if to_regclass('storage.buckets') is not null then
    execute $storage$
      insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      values (
        'war-room-artifacts',
        'war-room-artifacts',
        false,
        26214400,
        array['application/pdf', 'text/csv', 'application/json', 'image/png', 'image/jpeg', 'image/webp']
      )
      on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types
    $storage$;
  end if;
end;
$$;

-- All Pro+ tables are server-only. No anon/authenticated policy is created on purpose.
alter table public.v85_model_runs enable row level security;
alter table public.v85_pro_plus_scores enable row level security;
alter table public.war_room_snapshots enable row level security;
alter table public.war_room_items enable row level security;
alter table public.research_artifacts enable row level security;

revoke all on table public.v85_model_runs from anon, authenticated;
revoke all on table public.v85_pro_plus_scores from anon, authenticated;
revoke all on table public.war_room_snapshots from anon, authenticated;
revoke all on table public.war_room_items from anon, authenticated;
revoke all on table public.research_artifacts from anon, authenticated;

create or replace view public.latest_v85_pro_plus_scores
with (security_invoker = true)
as
select distinct on (symbol)
  id,
  run_id,
  symbol,
  score_date,
  model_version,
  total_score,
  confidence,
  data_completeness,
  rating,
  signal,
  risk_level,
  thesis,
  calculated_at
from public.v85_pro_plus_scores
order by symbol, score_date desc, calculated_at desc;

create or replace view public.latest_published_war_room_items
with (security_invoker = true)
as
with latest_snapshot as (
  select id
  from public.war_room_snapshots
  where status = 'published'
  order by snapshot_date desc, data_cutoff_at desc
  limit 1
)
select
  item.id,
  item.snapshot_id,
  item.section,
  item.item_key,
  item.symbol,
  item.rank,
  item.title,
  item.action,
  item.score,
  item.confidence,
  item.reason,
  item.payload
from public.war_room_items as item
join latest_snapshot on latest_snapshot.id = item.snapshot_id;

revoke all on table public.latest_v85_pro_plus_scores from anon, authenticated;
revoke all on table public.latest_published_war_room_items from anon, authenticated;

comment on view public.latest_v85_pro_plus_scores is '每檔股票最新一筆 V8.5 Pro+ 評分；僅供伺服器端讀取。';
comment on view public.latest_published_war_room_items is '最近一次已發布戰情室快照的區塊項目。';

commit;
