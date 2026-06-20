import type { DataSourceType } from "@/lib/data-quality";
import type { ETLIssue, ETLLoadResult, ETLResult } from "./etl-result";

export interface ETLJobContext {
  run_id: string;
  requested_at: string;
  dry_run: true;
}

export interface ETLSourceRecord<TPayload = unknown> {
  record_key: string;
  symbol: string | null;
  record_date: string;
  record_time: string;
  source_name: string;
  source_type: DataSourceType;
  source_confidence: number;
  is_model_inference: boolean;
  payload: TPayload;
}

export interface ETLSourceBatch<TRecord> {
  source_name: string;
  records: TRecord[];
  warnings: ETLIssue[];
  errors: ETLIssue[];
  collected_at: string | null;
}

export interface ETLValidationBatch<TRecord> {
  valid_records: TRecord[];
  rejected_records_count: number;
  warnings: ETLIssue[];
  errors: ETLIssue[];
}

export interface ETLSource<TRecord> {
  readonly source_name: string;
  readonly source_type: DataSourceType;
  readonly source_confidence: number;
  readonly capabilities: readonly string[];
  collect(): Promise<ETLSourceBatch<TRecord>>;
}

export interface ETLJob<TRawRecord, TValidatedRecord, TRunData = unknown> {
  readonly job_name: string;
  readonly source_name: string;
  run(context?: ETLJobContext): Promise<ETLResult<TRunData>>;
  validate(
    records: readonly TRawRecord[],
  ): Promise<ETLValidationBatch<TValidatedRecord>>;
  load(records: readonly TValidatedRecord[]): Promise<ETLLoadResult>;
}
