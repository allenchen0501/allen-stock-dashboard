-- Allen Stock Dashboard V3-5.5
-- SHAPE-ONLY EXAMPLE: contains zero Portfolio rows and writes no permanent data.
-- Copy the contract into an approved private staging workflow; never add holdings here.

begin;

create temporary table portfolio_staging_seed_input (
  owner_id uuid not null,
  symbol text not null check (btrim(symbol) <> ''),
  stock_name text not null check (btrim(stock_name) <> ''),
  market_type text not null check (market_type in ('TWSE', 'TPEx', 'NASDAQ', 'NYSE')),
  industry text,
  quantity numeric(18, 4) not null check (quantity > 0),
  average_cost numeric(18, 4) not null check (average_cost >= 0),
  is_active boolean not null,
  opened_at timestamptz not null,
  source_name text not null check (btrim(source_name) <> ''),
  source_type text not null check (btrim(source_type) <> ''),
  data_frequency text not null check (btrim(data_frequency) <> ''),
  is_model_inference boolean not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
) on commit drop;

-- This repository example must remain empty. A reviewed private staging seed may
-- populate the temporary contract and map it to the approved target schema.
do $$
begin
  if exists (select 1 from portfolio_staging_seed_input) then
    raise exception 'Repository staging seed example must contain zero rows';
  end if;
end;
$$;

rollback;
