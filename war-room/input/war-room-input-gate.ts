import type {
  OfficialPricePipelineResult,
} from "../../pipelines/official-price";
import type {
  WarRoomDecisionEligibility,
  WarRoomInput,
} from "./war-room-input-contract";
import type {
  WarRoomDataWarning,
  WarRoomInputGateIssue,
  WarRoomInputResult,
} from "./war-room-input-result";

function eligibilityFor(
  result: OfficialPricePipelineResult,
): WarRoomDecisionEligibility {
  if (result.validation_status === "FAIL") return "rejected";
  if (result.validation_status === "WARNING") return "reference_only";
  if (!result.decision_allowed || result.data_warning) return "rejected";
  return "primary";
}

function toWarRoomInput(
  result: OfficialPricePipelineResult,
  eligibility: WarRoomDecisionEligibility,
): WarRoomInput {
  return {
    symbol: result.symbol,
    close_price: result.close_price,
    source_name: result.source_name,
    record_date: result.record_date,
    record_time: result.record_time,
    validation_status: result.validation_status,
    eligibility,
    data_warning: result.data_warning || eligibility !== "primary",
    decision_allowed:
      eligibility === "primary" && result.decision_allowed,
    issues: result.issues.map((issue) => ({ ...issue })),
  };
}

function warningFor(input: WarRoomInput): WarRoomDataWarning | null {
  if (input.eligibility === "primary") return null;
  return {
    symbol: input.symbol,
    source_name: input.source_name,
    status: input.validation_status,
    message:
      input.eligibility === "reference_only"
        ? "Data is reference-only and cannot produce trading guidance."
        : "Data was rejected and is excluded from War Room decisions.",
  };
}

function issuesFor(
  result: OfficialPricePipelineResult,
  input: WarRoomInput,
): WarRoomInputGateIssue[] {
  const issues: WarRoomInputGateIssue[] = result.issues.map((issue) => ({
    symbol: result.symbol,
    source_name: result.source_name,
    code: issue.code,
    severity: issue.severity,
    message: issue.message,
  }));

  if (
    result.validation_status === "PASS" &&
    (!result.decision_allowed || result.data_warning)
  ) {
    issues.push({
      symbol: result.symbol,
      source_name: result.source_name,
      code: "INCONSISTENT_DECISION_CONTRACT",
      severity: "FAIL",
      message:
        "PASS input declared decision_allowed=false or data_warning=true and was rejected.",
    });
  }
  if (
    result.validation_status !== "PASS" &&
    result.decision_allowed
  ) {
    issues.push({
      symbol: result.symbol,
      source_name: result.source_name,
      code: "NON_PASS_DECISION_OVERRIDE_BLOCKED",
      severity: "FAIL",
      message: "Non-PASS input attempted to enable decision eligibility.",
    });
  }

  return issues;
}

/** Pure classifier. It creates no decisions and performs no I/O. */
export function gateWarRoomInputs(
  results: readonly OfficialPricePipelineResult[],
): WarRoomInputResult {
  const output: WarRoomInputResult = {
    primary_inputs: [],
    reference_inputs: [],
    rejected_inputs: [],
    data_warnings: [],
    issues: [],
  };

  for (const result of results) {
    const eligibility = eligibilityFor(result);
    const input = toWarRoomInput(result, eligibility);

    if (eligibility === "primary") output.primary_inputs.push(input);
    if (eligibility === "reference_only") output.reference_inputs.push(input);
    if (eligibility === "rejected") output.rejected_inputs.push(input);

    const warning = warningFor(input);
    if (warning) output.data_warnings.push(warning);
    output.issues.push(...issuesFor(result, input));
  }

  return output;
}
