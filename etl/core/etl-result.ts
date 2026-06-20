export interface ETLIssue {
  code: string;
  message: string;
  record_key?: string;
  details?: Record<string, unknown>;
}

export interface ETLResult<TData = unknown> {
  success: boolean;
  records_count: number;
  warnings: ETLIssue[];
  errors: ETLIssue[];
  started_at: string;
  finished_at: string;
  data?: TData;
}

export interface ETLLoadResult extends ETLResult {
  skipped: boolean;
  attempted_records_count: number;
  loaded_records_count: number;
  target_table: string;
}
