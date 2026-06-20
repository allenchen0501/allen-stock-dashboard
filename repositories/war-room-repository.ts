import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  WarRoomDecision,
  WarRoomReport,
} from "@/lib/types/database";
import { raiseOnRepositoryError } from "./base-repository";

const DECISIONS_TABLE = "war_room_decisions";
const REPORTS_TABLE = "war_room_reports";

export interface WarRoomRepository {
  getLatestDecision(reportType?: string): Promise<WarRoomDecision | null>;
  getDecisionHistory(limit?: number): Promise<WarRoomDecision[]>;
  getLatestWarRoomReport(reportType?: string): Promise<WarRoomReport | null>;
}

/**
 * Supabase read skeleton. war_room_decisions exists in V3-1.6;
 * war_room_reports remains a future table and is not queried by current flows.
 */
export class SupabaseWarRoomRepository implements WarRoomRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getLatestDecision(
    reportType?: string,
  ): Promise<WarRoomDecision | null> {
    let query = this.client.from(DECISIONS_TABLE).select("*");
    if (reportType) query = query.eq("report_type", reportType);

    const { data, error } = await query
      .order("decision_date", { ascending: false })
      .order("decision_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    raiseOnRepositoryError(error, "warRoom.getLatestDecision");
    return data as WarRoomDecision | null;
  }

  async getDecisionHistory(limit = 30): Promise<WarRoomDecision[]> {
    const safeLimit = Math.max(1, Math.min(limit, 250));
    const { data, error } = await this.client
      .from(DECISIONS_TABLE)
      .select("*")
      .order("decision_date", { ascending: false })
      .order("decision_time", { ascending: false })
      .limit(safeLimit);

    raiseOnRepositoryError(error, "warRoom.getDecisionHistory");
    return (data ?? []) as WarRoomDecision[];
  }

  async getLatestWarRoomReport(
    reportType?: string,
  ): Promise<WarRoomReport | null> {
    let query = this.client.from(REPORTS_TABLE).select("*");
    if (reportType) query = query.eq("report_type", reportType);

    const { data, error } = await query
      .eq("status", "published")
      .order("report_date", { ascending: false })
      .order("report_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    raiseOnRepositoryError(error, "warRoom.getLatestWarRoomReport");
    return data as WarRoomReport | null;
  }
}
