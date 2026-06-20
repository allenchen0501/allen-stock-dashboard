import type { ETLLoadResult } from "../core/etl-result";

export interface SupabaseLoadRequest<TRecord> {
  target_table: string;
  records: readonly TRecord[];
  conflict_keys: readonly string[];
}

/**
 * Safe no-op loader. It deliberately has no SupabaseClient dependency and
 * never writes records in V3-4.6.
 */
export class SupabaseLoader {
  readonly loader_name = "supabase-loader-skeleton";
  readonly dry_run = true;

  async load<TRecord>(
    request: SupabaseLoadRequest<TRecord>,
  ): Promise<ETLLoadResult> {
    const startedAt = new Date().toISOString();
    const finishedAt = new Date().toISOString();

    return {
      success: true,
      records_count: request.records.length,
      warnings: [
        {
          code: "DRY_RUN_NO_WRITE",
          message:
            "Supabase loading is disabled; no record was written in V3-4.6.",
          details: {
            conflict_keys: [...request.conflict_keys],
          },
        },
      ],
      errors: [],
      started_at: startedAt,
      finished_at: finishedAt,
      skipped: true,
      attempted_records_count: request.records.length,
      loaded_records_count: 0,
      target_table: request.target_table,
    };
  }
}
