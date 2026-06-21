import type { WarRoomInput } from "../../war-room/input";
import type {
  EtlPlannedOperation,
  EtlWriteAudit,
  EtlWriteInput,
  EtlWriteResult,
  EtlWriteTarget,
} from "./etl-write-contract";
import { createEtlIdempotencyKey } from "./idempotency-key";
import {
  createEtlQuarantinePayload,
  type EtlQuarantinePayload,
} from "./quarantine";

const DEFAULT_TARGET: EtlWriteTarget = "staging_official_prices";

function validPrimary(input: WarRoomInput): boolean {
  return (
    input.eligibility === "primary" &&
    input.validation_status === "PASS" &&
    input.decision_allowed &&
    !input.data_warning &&
    input.symbol.trim().length > 0 &&
    input.source_name.trim().length > 0 &&
    input.record_date.trim().length > 0 &&
    input.record_time.trim().length > 0 &&
    input.close_price !== null &&
    Number.isFinite(input.close_price) &&
    input.close_price > 0
  );
}

function baseQuarantine(input: EtlWriteInput): EtlQuarantinePayload[] {
  return [
    ...input.war_room_inputs.reference_inputs.map((item) =>
      createEtlQuarantinePayload(
        item,
        "REFERENCE_INPUT",
        input.requested_at,
      ),
    ),
    ...input.war_room_inputs.rejected_inputs.map((item) =>
      createEtlQuarantinePayload(
        item,
        "REJECTED_INPUT",
        input.requested_at,
      ),
    ),
  ];
}

function auditFor(
  input: EtlWriteInput,
  target: EtlWriteTarget,
  eligiblePrimaryCount: number,
  plannedCount: number,
  quarantineCount: number,
): EtlWriteAudit {
  return {
    run_id: input.run_id,
    mode: input.mode,
    target_table: target,
    requested_at: input.requested_at,
    evaluated_at: input.requested_at,
    primary_input_count: input.war_room_inputs.primary_inputs.length,
    reference_input_count: input.war_room_inputs.reference_inputs.length,
    rejected_input_count: input.war_room_inputs.rejected_inputs.length,
    eligible_primary_count: eligiblePrimaryCount,
    planned_operation_count: plannedCount,
    quarantine_count: quarantineCount,
    written_record_count: 0,
    write_performed: false,
    rollback_required: false,
  };
}

/**
 * Planning gate only. Every mode returns write_performed=false and no database
 * adapter is accepted or imported.
 */
export function planEtlWrites(input: EtlWriteInput): EtlWriteResult {
  const target = input.target_table ?? DEFAULT_TARGET;
  const quarantine = baseQuarantine(input);
  const eligible: Array<{ input: WarRoomInput; key: string }> = [];
  const seenKeys = new Set<string>();

  for (const primary of input.war_room_inputs.primary_inputs) {
    if (!validPrimary(primary) || !input.data_frequency.trim()) {
      quarantine.push(
        createEtlQuarantinePayload(
          primary,
          "INVALID_PRIMARY_INPUT",
          input.requested_at,
          [
            {
              code: "PRIMARY_WRITE_CONTRACT_FAILED",
              severity: "FAIL",
              message:
                "Primary input or data_frequency failed the staging write contract.",
            },
          ],
        ),
      );
      continue;
    }

    const key = createEtlIdempotencyKey({
      symbol: primary.symbol,
      record_date: primary.record_date,
      source_name: primary.source_name,
      data_frequency: input.data_frequency,
    });
    if (seenKeys.has(key)) {
      quarantine.push(
        createEtlQuarantinePayload(
          primary,
          "DUPLICATE_PRIMARY_INPUT",
          input.requested_at,
          [
            {
              code: "DUPLICATE_IDEMPOTENCY_KEY",
              severity: "FAIL",
              message: "Duplicate primary input was removed from the write plan.",
            },
          ],
        ),
      );
      continue;
    }
    seenKeys.add(key);
    eligible.push({ input: primary, key });
  }

  const plannedOperations: EtlPlannedOperation[] =
    input.mode === "disabled"
      ? []
      : eligible.map(({ input: primary, key }) => ({
          operation: "upsert",
          target_table: target,
          idempotency_key: key,
          payload: {
            symbol: primary.symbol,
            close_price: primary.close_price!,
            record_date: primary.record_date,
            record_time: primary.record_time,
            source_name: primary.source_name,
            data_frequency: input.data_frequency.trim(),
          },
          execution:
            input.mode === "dry_run"
              ? "dry_run_only"
              : "staging_skeleton_only",
        }));
  const warnings = [
    "ETL Write Layer is no-write in V9; no Supabase operation was executed.",
  ];
  if (input.mode === "staging") {
    warnings.push(
      "Staging mode is a skeleton and only emits planned operations.",
    );
  }

  return {
    success: true,
    mode: input.mode,
    status:
      input.mode === "disabled"
        ? "disabled"
        : input.mode === "dry_run"
          ? "dry_run_planned"
          : "staging_skeleton",
    planned_operations: plannedOperations,
    quarantine,
    warnings,
    errors: [],
    write_performed: false,
    audit: auditFor(
      input,
      target,
      eligible.length,
      plannedOperations.length,
      quarantine.length,
    ),
  };
}
