-- Allen Stock Dashboard V11.6 / war_room_reports
-- Apply after schema.sql, v85_pro_plus_schema.sql, and v85_pro_plus_schema_v2.sql.
-- This migration is additive and does not modify any existing table.
--
-- Schema gap addressed: WarRoomReport type and SupabaseWarRoomRepository.getLatestWarRoomReport()
-- have existed since V3-3, but the matching physical table was never created.
--
-- Security: fail-closed. RLS is enabled with no policy (deny-by-default).
-- anon and authenticated are revoked. Access is server-only via service role.
-- RLS policies and grants MUST be added before connecting any API or UI layer.

begin;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null
     or to_regclass('public.war_room_decisions') is null then
    raise exception
      'Apply schema.sql, v85_pro_plus_schema.sql, and v85_pro_plus_schema_v2.sql '
      'before v85_war_room_reports.sql';
  end if;
end;
$$;

-- war_room_reports mirrors lib/types/database.ts WarRoomReport (extends TimestampedRecord).
-- It does NOT mirror SourcedRecord; see docs/war-room-reports-migration.md for the difference.
create table if not exists public.war_room_reports (
  id             uuid        primary key default gen_random_uuid(),
  report_type    text        not null,
  report_date    date        not null,
  report_time    time without time zone not null,
  title          text        not null,
  summary        text        not null,
  content        jsonb       not null default '{}'::jsonb,
  status         text        not null default 'draft'
                   check (status in ('draft', 'published', 'archived')),
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint war_room_reports_identity_unique
    unique (report_type, report_date, report_time),
  constraint war_room_reports_report_type_not_blank
    check (btrim(report_type) <> ''),
  constraint war_room_reports_title_not_blank
    check (btrim(title) <> ''),
  constraint war_room_reports_summary_not_blank
    check (btrim(summary) <> ''),
  constraint war_room_reports_publish_state_valid check (
    (status = 'published' and published_at is not null)
    or (status <> 'published')
  )
);

comment on table public.war_room_reports
  is '對外可讀的戰情室報告文件；與 war_room_snapshots（read model）和 war_room_decisions（決策稽核）分開保存。';
comment on column public.war_room_reports.report_type
  is '報告類型識別碼，例如 daily、pre_market、post_market；無列舉限制，由寫入端維護一致性。';
comment on column public.war_room_reports.content
  is 'jsonb 結構化報告主體；格式由 report_type 決定，不得存入 raw 市場資料、key 或個資。';
comment on column public.war_room_reports.published_at
  is 'status = published 時不得為 null（publish_state_valid constraint 強制執行）。';

-- report_date 降冪：getLatestWarRoomReport 依 report_date desc / report_time desc 排序
create index if not exists war_room_reports_report_date_idx
  on public.war_room_reports (report_date desc, report_time desc);

-- report_type + date：依類型篩選最新報告
create index if not exists war_room_reports_report_type_date_idx
  on public.war_room_reports (report_type, report_date desc, report_time desc);

-- status：查詢 published 清單
create index if not exists war_room_reports_status_date_idx
  on public.war_room_reports (status, report_date desc);

-- published_at 降冪：依發布時間排序，僅索引已發布列
create index if not exists war_room_reports_published_at_idx
  on public.war_room_reports (published_at desc)
  where status = 'published' and published_at is not null;

drop trigger if exists war_room_reports_set_updated_at on public.war_room_reports;
create trigger war_room_reports_set_updated_at
before update on public.war_room_reports
for each row execute function public.set_updated_at();

-- Fail-closed security. No policy = deny all via RLS. Service role bypasses RLS by design.
alter table public.war_room_reports enable row level security;

revoke all on table public.war_room_reports from anon, authenticated;

commit;
