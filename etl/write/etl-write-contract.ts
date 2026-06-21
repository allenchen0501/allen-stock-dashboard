import type { WarRoomInputResult } from "../../war-room/input";
import type { EtlQuarantinePayload } from "./quarantine";

export type EtlWriteMode = "disabled" | "dry_run" | "staging";
export type EtlWriteTarget = "staging_official_prices";

export interface EtlWriteInput {
  mode: EtlWriteMode;
  run_id: string;
  requested_at: string;
  target_table?: EtlWriteTarget;
  data_frequency: string;
  war_room_inputs: WarRoomInputResult;
}

export interface EtlPlannedWritePayload {
  symbol: string;
  close_price: number;
  record_date: string;
  record_time: string;
  source_name: string;
  data_frequency: string;
}

export interface EtlPlannedOperation {
  operation: "upsert";
  target_table: EtlWriteTarget;
  idempotency_key: string;
  payload: EtlPlannedWritePayload;
  execution: "dry_run_only" | "staging_skeleton_only";
}

export interface EtlWriteAudit {
  run_id: string;
  mode: EtlWriteMode;
  target_table: EtlWriteTarget;
  requested_at: string;
  evaluated_at: string;
  primary_input_count: number;
  reference_input_count: number;
  rejected_input_count: number;
  eligible_primary_count: number;
  planned_operation_count: number;
  quarantine_count: number;
  written_record_count: 0;
  write_performed: false;
  rollback_required: false;
}

export interface EtlWriteResult {
  success: boolean;
  mode: EtlWriteMode;
  status: "disabled" | "dry_run_planned" | "staging_skeleton";
  planned_operations: EtlPlannedOperation[];
  quarantine: EtlQuarantinePayload[];
  warnings: string[];
  errors: string[];
  write_performed: false;
  audit: EtlWriteAudit;
}
