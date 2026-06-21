import type {
  WarRoomInput,
  WarRoomInputStatus,
} from "./war-room-input-contract";

export interface WarRoomDataWarning {
  symbol: string;
  source_name: string;
  status: WarRoomInputStatus;
  message: string;
}

export interface WarRoomInputGateIssue {
  symbol: string;
  source_name: string;
  code: string;
  severity: "WARNING" | "FAIL";
  message: string;
}

export interface WarRoomInputResult {
  primary_inputs: WarRoomInput[];
  reference_inputs: WarRoomInput[];
  rejected_inputs: WarRoomInput[];
  data_warnings: WarRoomDataWarning[];
  issues: WarRoomInputGateIssue[];
}
