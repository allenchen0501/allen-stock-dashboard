-- Allen Stock Dashboard V3-1.6 / V8.5 Pro+ schema v2
-- Apply after schema.sql and v85_pro_plus_schema.sql.
-- This migration is additive and intentionally does not enable RLS.

begin;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null
     or to_regclass('public.v85_pro_plus_scores') is null then
    raise exception 'Apply schema.sql and v85_pro_plus_schema.sql before v85_pro_plus_schema_v2.sql';
  end if;
end;
$$;

create table if not exists public.portfolio_performance_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  total_invested_cost numeric(20, 4) not null check (total_invested_cost >= 0),
  current_market_value numeric(20, 4) not null check (current_market_value >= 0),
  realized_profit_loss numeric(20, 4) not null,
  unrealized_profit_loss numeric(20, 4) not null,
  total_profit_loss numeric(20, 4) not null,
  return_rate numeric(12, 4) not null check (return_rate >= -100),
  cash_ratio numeric(9, 4) not null check (cash_ratio between 0 and 100),
  position_ratio numeric(9, 4) not null check (position_ratio between 0 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portfolio_performance_identity_unique unique (record_date, record_time, source_name),
  constraint portfolio_performance_source_name_not_blank check (btrim(source_name) <> ''),
  constraint portfolio_performance_source_type_not_blank check (btrim(source_type) <> ''),
  constraint portfolio_performance_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint portfolio_performance_profit_loss_valid check (
    abs(total_profit_loss - realized_profit_loss - unrealized_profit_loss) <= 0.01
  )
);

comment on table public.portfolio_performance_snapshots is '投資績效中心的時間點快照；ratio 與 return_rate 以百分比值保存。';

create index if not exists portfolio_performance_record_date_idx
  on public.portfolio_performance_snapshots (record_date desc, record_time desc);
create index if not exists portfolio_performance_return_idx
  on public.portfolio_performance_snapshots (return_rate desc, record_date desc);

drop trigger if exists portfolio_performance_set_updated_at on public.portfolio_performance_snapshots;
create trigger portfolio_performance_set_updated_at
before update on public.portfolio_performance_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.technical_signals (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  symbol text not null,
  week_30ma_turning_up boolean not null default false,
  above_day_200ma boolean not null default false,
  day_200ma_distance_ratio numeric(10, 4)
    check (day_200ma_distance_ratio between -100 and 1000),
  monthly_deduction_3_low boolean not null default false,
  monthly_deduction_6_low boolean not null default false,
  monthly_deduction_3_high boolean not null default false,
  monthly_deduction_6_high boolean not null default false,
  bollinger_squeeze boolean not null default false,
  bollinger_expansion boolean not null default false,
  ma_reversal_signal boolean not null default false,
  old_duck_head boolean not null default false,
  washout_four_steps boolean not null default false,
  volume_breakout boolean not null default false,
  platform_breakout boolean not null default false,
  pullback_support boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint technical_signals_identity_unique unique (symbol, record_date, record_time, source_name),
  constraint technical_signals_symbol_not_blank check (btrim(symbol) <> ''),
  constraint technical_signals_source_name_not_blank check (btrim(source_name) <> ''),
  constraint technical_signals_source_type_not_blank check (btrim(source_type) <> ''),
  constraint technical_signals_frequency_not_blank check (btrim(data_frequency) <> '')
);

comment on table public.technical_signals is '每日個股技術訊號事實表；布林欄位表示該時間點是否成立。';
comment on column public.technical_signals.day_200ma_distance_ratio is '現價相對日線 200MA 的距離百分比，可為負值。';

create index if not exists technical_signals_symbol_date_idx
  on public.technical_signals (symbol, record_date desc, record_time desc);
create index if not exists technical_signals_date_idx
  on public.technical_signals (record_date desc, record_time desc);
create index if not exists technical_signals_active_resonance_idx
  on public.technical_signals (record_date desc, symbol)
  where week_30ma_turning_up
     or ma_reversal_signal
     or old_duck_head
     or washout_four_steps
     or volume_breakout
     or platform_breakout
     or pullback_support;

drop trigger if exists technical_signals_set_updated_at on public.technical_signals;
create trigger technical_signals_set_updated_at
before update on public.technical_signals
for each row execute function public.set_updated_at();

create table if not exists public.strategy_patterns (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default true,
  pattern_name text not null,
  pattern_description text not null,
  signal_combination jsonb not null default '[]'::jsonb
    check (jsonb_typeof(signal_combination) = 'array'),
  market_regime text not null,
  industry_category text not null default 'all',
  sample_count integer not null check (sample_count >= 0),
  success_count integer not null check (success_count >= 0),
  failure_count integer not null check (failure_count >= 0),
  win_rate numeric(7, 4) not null check (win_rate between 0 and 100),
  average_return numeric(12, 4) not null check (average_return >= -100),
  average_drawdown numeric(12, 4) not null check (average_drawdown between -100 and 0),
  score numeric(5, 2) not null check (score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_patterns_identity_unique unique (
    pattern_name,
    market_regime,
    industry_category,
    record_date,
    record_time,
    source_name
  ),
  constraint strategy_patterns_name_not_blank check (btrim(pattern_name) <> ''),
  constraint strategy_patterns_description_not_blank check (btrim(pattern_description) <> ''),
  constraint strategy_patterns_regime_not_blank check (btrim(market_regime) <> ''),
  constraint strategy_patterns_industry_not_blank check (btrim(industry_category) <> ''),
  constraint strategy_patterns_source_name_not_blank check (btrim(source_name) <> ''),
  constraint strategy_patterns_source_type_not_blank check (btrim(source_type) <> ''),
  constraint strategy_patterns_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint strategy_patterns_counts_valid check (success_count + failure_count <= sample_count)
);

comment on table public.strategy_patterns is '技術訊號組合在市場型態與產業分類下的歷史驗證摘要。';
comment on column public.strategy_patterns.average_drawdown is '平均回撤以負百分比保存，例如 -8.5 表示回撤 8.5%。';

create index if not exists strategy_patterns_score_idx
  on public.strategy_patterns (score desc, win_rate desc, record_date desc);
create index if not exists strategy_patterns_regime_industry_idx
  on public.strategy_patterns (market_regime, industry_category, record_date desc);
create index if not exists strategy_patterns_signal_combination_gin_idx
  on public.strategy_patterns using gin (signal_combination);

drop trigger if exists strategy_patterns_set_updated_at on public.strategy_patterns;
create trigger strategy_patterns_set_updated_at
before update on public.strategy_patterns
for each row execute function public.set_updated_at();

create table if not exists public.market_breadth_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  market_name text not null default 'TWSE',
  rising_count integer not null check (rising_count >= 0),
  falling_count integer not null check (falling_count >= 0),
  limit_up_count integer not null check (limit_up_count >= 0),
  limit_down_count integer not null check (limit_down_count >= 0),
  new_high_count integer not null check (new_high_count >= 0),
  new_low_count integer not null check (new_low_count >= 0),
  strong_stock_ratio numeric(7, 4) not null check (strong_stock_ratio between 0 and 100),
  weak_stock_ratio numeric(7, 4) not null check (weak_stock_ratio between 0 and 100),
  breadth_score numeric(5, 2) not null check (breadth_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint market_breadth_identity_unique unique (market_name, record_date, record_time, source_name),
  constraint market_breadth_market_not_blank check (btrim(market_name) <> ''),
  constraint market_breadth_source_name_not_blank check (btrim(source_name) <> ''),
  constraint market_breadth_source_type_not_blank check (btrim(source_type) <> ''),
  constraint market_breadth_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint market_breadth_ratios_valid check (strong_stock_ratio + weak_stock_ratio <= 100)
);

comment on table public.market_breadth_snapshots is '市場漲跌家數、新高低家數與強弱股比例快照。';

create index if not exists market_breadth_market_date_idx
  on public.market_breadth_snapshots (market_name, record_date desc, record_time desc);
create index if not exists market_breadth_score_idx
  on public.market_breadth_snapshots (breadth_score desc, record_date desc);

drop trigger if exists market_breadth_set_updated_at on public.market_breadth_snapshots;
create trigger market_breadth_set_updated_at
before update on public.market_breadth_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.capital_management_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  available_cash numeric(20, 4) not null check (available_cash >= 0),
  invested_capital numeric(20, 4) not null check (invested_capital >= 0),
  total_equity numeric(20, 4) not null check (total_equity >= 0),
  max_single_position_ratio numeric(9, 4) not null
    check (max_single_position_ratio between 0 and 100),
  total_position_ratio numeric(9, 4) not null
    check (total_position_ratio between 0 and 500),
  cash_ratio numeric(9, 4) not null check (cash_ratio between 0 and 100),
  suggested_position_ratio numeric(9, 4) not null
    check (suggested_position_ratio between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint capital_management_identity_unique unique (record_date, record_time, source_name),
  constraint capital_management_source_name_not_blank check (btrim(source_name) <> ''),
  constraint capital_management_source_type_not_blank check (btrim(source_type) <> ''),
  constraint capital_management_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint capital_management_equity_valid check (
    abs(total_equity - available_cash - invested_capital) <= 0.01
  ),
  constraint capital_management_position_valid check (
    max_single_position_ratio <= total_position_ratio
  )
);

comment on table public.capital_management_snapshots is '現金、投入資本、總權益與模型建議水位的資金管理快照。';

create index if not exists capital_management_record_date_idx
  on public.capital_management_snapshots (record_date desc, record_time desc);
create index if not exists capital_management_risk_idx
  on public.capital_management_snapshots (risk_level, record_date desc);

drop trigger if exists capital_management_set_updated_at on public.capital_management_snapshots;
create trigger capital_management_set_updated_at
before update on public.capital_management_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.position_risk_snapshots (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  symbol text not null,
  position_cost numeric(20, 4) not null check (position_cost >= 0),
  current_price numeric(20, 4) not null check (current_price >= 0),
  quantity numeric(20, 4) not null check (quantity > 0),
  financing_used boolean not null default false,
  financing_ratio numeric(9, 4) not null default 0 check (financing_ratio between 0 and 100),
  margin_call_price numeric(20, 4) check (margin_call_price is null or margin_call_price >= 0),
  forced_liquidation_price numeric(20, 4)
    check (forced_liquidation_price is null or forced_liquidation_price >= 0),
  stop_loss_price numeric(20, 4) check (stop_loss_price is null or stop_loss_price >= 0),
  max_drawdown_estimate numeric(9, 4) not null
    check (max_drawdown_estimate between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint position_risk_identity_unique unique (symbol, record_date, record_time, source_name),
  constraint position_risk_symbol_not_blank check (btrim(symbol) <> ''),
  constraint position_risk_source_name_not_blank check (btrim(source_name) <> ''),
  constraint position_risk_source_type_not_blank check (btrim(source_type) <> ''),
  constraint position_risk_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint position_risk_financing_valid check (
    (financing_used and financing_ratio > 0)
    or (not financing_used and financing_ratio = 0)
  )
);

comment on table public.position_risk_snapshots is '逐一持股的融資、停損、預估回撤與風險層級快照。';

create index if not exists position_risk_symbol_date_idx
  on public.position_risk_snapshots (symbol, record_date desc, record_time desc);
create index if not exists position_risk_level_date_idx
  on public.position_risk_snapshots (risk_level, record_date desc, record_time desc);
create index if not exists position_risk_financing_idx
  on public.position_risk_snapshots (record_date desc, symbol)
  where financing_used;

drop trigger if exists position_risk_set_updated_at on public.position_risk_snapshots;
create trigger position_risk_set_updated_at
before update on public.position_risk_snapshots
for each row execute function public.set_updated_at();

create table if not exists public.strategy_validation_results (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default false,
  strategy_name text not null,
  symbol text not null,
  signal_date date not null,
  validation_date date not null,
  entry_price numeric(20, 4) not null check (entry_price > 0),
  result_price_1d numeric(20, 4) not null check (result_price_1d >= 0),
  result_price_5d numeric(20, 4) not null check (result_price_5d >= 0),
  result_price_20d numeric(20, 4) not null check (result_price_20d >= 0),
  result_return_1d numeric(12, 4) not null check (result_return_1d >= -100),
  result_return_5d numeric(12, 4) not null check (result_return_5d >= -100),
  result_return_20d numeric(12, 4) not null check (result_return_20d >= -100),
  success boolean not null,
  failure_reason text,
  score numeric(5, 2) not null check (score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_validation_identity_unique unique (
    strategy_name,
    symbol,
    signal_date,
    validation_date,
    source_name
  ),
  constraint strategy_validation_strategy_not_blank check (btrim(strategy_name) <> ''),
  constraint strategy_validation_symbol_not_blank check (btrim(symbol) <> ''),
  constraint strategy_validation_source_name_not_blank check (btrim(source_name) <> ''),
  constraint strategy_validation_source_type_not_blank check (btrim(source_type) <> ''),
  constraint strategy_validation_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint strategy_validation_date_order check (validation_date >= signal_date),
  constraint strategy_validation_failure_reason_valid check (
    (success and failure_reason is null)
    or (not success and failure_reason is not null and btrim(failure_reason) <> '')
  )
);

comment on table public.strategy_validation_results is '策略訊號在 1、5、20 個交易日後的價格與報酬驗證結果。';

create index if not exists strategy_validation_strategy_date_idx
  on public.strategy_validation_results (strategy_name, signal_date desc);
create index if not exists strategy_validation_symbol_date_idx
  on public.strategy_validation_results (symbol, signal_date desc);
create index if not exists strategy_validation_success_score_idx
  on public.strategy_validation_results (success, score desc, validation_date desc);

drop trigger if exists strategy_validation_set_updated_at on public.strategy_validation_results;
create trigger strategy_validation_set_updated_at
before update on public.strategy_validation_results
for each row execute function public.set_updated_at();

create table if not exists public.war_room_decisions (
  id uuid primary key default gen_random_uuid(),
  record_date date not null,
  record_time time without time zone not null,
  source_name text not null,
  source_type text not null,
  source_confidence numeric(5, 2) not null check (source_confidence between 0 and 100),
  data_frequency text not null,
  is_model_inference boolean not null default true,
  report_type text not null,
  decision_date date not null,
  decision_time time without time zone not null,
  market_mode text not null,
  suggested_action text not null,
  suggested_position_ratio numeric(9, 4) not null
    check (suggested_position_ratio between 0 and 100),
  top_industries text[] not null default '{}'::text[],
  top_symbols text[] not null default '{}'::text[],
  avoid_symbols text[] not null default '{}'::text[],
  risk_summary text not null,
  ai_summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint war_room_decisions_identity_unique unique (
    report_type,
    decision_date,
    decision_time,
    source_name
  ),
  constraint war_room_decisions_report_type_not_blank check (btrim(report_type) <> ''),
  constraint war_room_decisions_market_mode_not_blank check (btrim(market_mode) <> ''),
  constraint war_room_decisions_action_not_blank check (btrim(suggested_action) <> ''),
  constraint war_room_decisions_risk_summary_not_blank check (btrim(risk_summary) <> ''),
  constraint war_room_decisions_ai_summary_not_blank check (btrim(ai_summary) <> ''),
  constraint war_room_decisions_source_name_not_blank check (btrim(source_name) <> ''),
  constraint war_room_decisions_source_type_not_blank check (btrim(source_type) <> ''),
  constraint war_room_decisions_frequency_not_blank check (btrim(data_frequency) <> ''),
  constraint war_room_decisions_record_matches_decision check (
    record_date = decision_date and record_time = decision_time
  )
);

comment on table public.war_room_decisions is '盤前、盤中、盤後或每日戰情決策與 AI 摘要的歷史紀錄。';

create index if not exists war_room_decisions_date_idx
  on public.war_room_decisions (decision_date desc, decision_time desc);
create index if not exists war_room_decisions_report_type_idx
  on public.war_room_decisions (report_type, decision_date desc, decision_time desc);
create index if not exists war_room_decisions_top_symbols_gin_idx
  on public.war_room_decisions using gin (top_symbols);
create index if not exists war_room_decisions_avoid_symbols_gin_idx
  on public.war_room_decisions using gin (avoid_symbols);

drop trigger if exists war_room_decisions_set_updated_at on public.war_room_decisions;
create trigger war_room_decisions_set_updated_at
before update on public.war_room_decisions
for each row execute function public.set_updated_at();

-- V3-1.6 keeps RLS disabled by requirement. Revoke browser roles to avoid public REST access.
revoke all on table public.portfolio_performance_snapshots from anon, authenticated;
revoke all on table public.technical_signals from anon, authenticated;
revoke all on table public.strategy_patterns from anon, authenticated;
revoke all on table public.market_breadth_snapshots from anon, authenticated;
revoke all on table public.capital_management_snapshots from anon, authenticated;
revoke all on table public.position_risk_snapshots from anon, authenticated;
revoke all on table public.strategy_validation_results from anon, authenticated;
revoke all on table public.war_room_decisions from anon, authenticated;

commit;
