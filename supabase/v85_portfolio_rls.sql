-- Allen Stock Dashboard V3-4.5
-- DRAFT ONLY: do not apply until owner_id backfill and an authenticated identity
-- strategy have been approved and tested in staging.
-- This migration intentionally creates NO anon policy and contains NO API key.

begin;

do $$
begin
  if to_regclass('public.portfolio_stocks') is null
     or to_regclass('public.watchlist_stocks') is null then
    raise exception 'Apply supabase/schema.sql before v85_portfolio_rls.sql';
  end if;

  if to_regprocedure('auth.uid()') is null then
    raise exception 'Supabase auth.uid() is required for this RLS draft';
  end if;
end;
$$;

-- Nullable for migration safety. Existing rows must be assigned to the approved
-- owner before this draft is applied; NULL rows are deliberately invisible.
alter table public.portfolio_stocks
  add column if not exists owner_id uuid references auth.users (id) on delete restrict;

alter table public.watchlist_stocks
  add column if not exists owner_id uuid references auth.users (id) on delete restrict;

create index if not exists portfolio_stocks_owner_active_idx
  on public.portfolio_stocks (owner_id, is_active, market, symbol);

create index if not exists watchlist_stocks_owner_active_idx
  on public.watchlist_stocks (owner_id, is_active, tier, symbol);

comment on column public.portfolio_stocks.owner_id is
  'Future authenticated owner. Must equal auth.uid(); never supplied by an anon browser.';
comment on column public.watchlist_stocks.owner_id is
  'Future authenticated owner. Must equal auth.uid(); never supplied by an anon browser.';

alter table public.portfolio_stocks enable row level security;
alter table public.portfolio_stocks force row level security;
alter table public.watchlist_stocks enable row level security;
alter table public.watchlist_stocks force row level security;

-- Fail closed: browser anon receives no table privilege and no policy.
revoke all on table public.portfolio_stocks from anon, authenticated;
revoke all on table public.watchlist_stocks from anon, authenticated;

grant select, insert, update on table public.portfolio_stocks to authenticated;
grant select, insert, update on table public.watchlist_stocks to authenticated;

drop policy if exists portfolio_owner_select on public.portfolio_stocks;
create policy portfolio_owner_select
on public.portfolio_stocks
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists portfolio_owner_insert on public.portfolio_stocks;
create policy portfolio_owner_insert
on public.portfolio_stocks
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists portfolio_owner_update on public.portfolio_stocks;
create policy portfolio_owner_update
on public.portfolio_stocks
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Explicitly remove any earlier draft hard-delete policy.
drop policy if exists portfolio_owner_delete on public.portfolio_stocks;

drop policy if exists watchlist_owner_select on public.watchlist_stocks;
create policy watchlist_owner_select
on public.watchlist_stocks
for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists watchlist_owner_insert on public.watchlist_stocks;
create policy watchlist_owner_insert
on public.watchlist_stocks
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists watchlist_owner_update on public.watchlist_stocks;
create policy watchlist_owner_update
on public.watchlist_stocks
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- Explicitly remove any earlier draft hard-delete policy.
drop policy if exists watchlist_owner_delete on public.watchlist_stocks;

commit;

-- Required staging checks before production application:
-- 1. Backfill owner_id from an approved manifest; verify no NULL active rows.
-- 2. Confirm anon SELECT/INSERT/UPDATE/DELETE are denied.
-- 3. Confirm authenticated user A cannot read or mutate user B rows.
-- 4. Confirm active-only repository returns only the current user's rows.
-- 5. Confirm authenticated hard DELETE remains denied; use is_active soft delete.
-- 6. Revisit global unique(symbol, market) / unique(symbol) constraints before
--    supporting more than one owner; current schema remains single-owner oriented.
