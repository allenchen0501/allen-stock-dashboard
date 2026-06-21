import type {
  OfficialPricePipelineIssue,
  OfficialPricePipelineStatus,
} from "../../pipelines/official-price";

export type WarRoomInputStatus = OfficialPricePipelineStatus;

export interface WarRoomDataSource {
  source_name: string;
  record_date: string;
  record_time: string;
}

export type WarRoomDecisionEligibility =
  | "primary"
  | "reference_only"
  | "rejected";

export interface WarRoomInput extends WarRoomDataSource {
  symbol: string;
  close_price: number | null;
  validation_status: WarRoomInputStatus;
  eligibility: WarRoomDecisionEligibility;
  data_warning: boolean;
  decision_allowed: boolean;
  issues: OfficialPricePipelineIssue[];
}
