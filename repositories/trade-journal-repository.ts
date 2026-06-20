import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateTradeInput,
  TradeJournal,
  UpdateTradeInput,
} from "@/lib/types/database";
import {
  type BaseRepository,
  raiseOnRepositoryError,
  requireRepositoryData,
} from "./base-repository";

const TABLE_NAME = "trade_journal";

export interface TradeJournalRepository
  extends BaseRepository<TradeJournal, CreateTradeInput, UpdateTradeInput> {
  getTrades(limit?: number): Promise<TradeJournal[]>;
  createTrade(input: CreateTradeInput): Promise<TradeJournal>;
  updateTrade(id: string, input: UpdateTradeInput): Promise<TradeJournal>;
}

/**
 * Future Supabase skeleton. The trade_journal migration does not exist in V3-3,
 * so this class must not be instantiated by the current application.
 */
export class SupabaseTradeJournalRepository
  implements TradeJournalRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<TradeJournal[]> {
    return this.getTrades();
  }

  async findById(id: string): Promise<TradeJournal | null> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    raiseOnRepositoryError(error, "tradeJournal.findById");
    return data as TradeJournal | null;
  }

  async create(input: CreateTradeInput): Promise<TradeJournal> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .insert(input)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "tradeJournal.create");
    return requireRepositoryData(data as TradeJournal | null, "tradeJournal.create");
  }

  async update(id: string, input: UpdateTradeInput): Promise<TradeJournal> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "tradeJournal.update");
    return requireRepositoryData(data as TradeJournal | null, "tradeJournal.update");
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE_NAME).delete().eq("id", id);
    raiseOnRepositoryError(error, "tradeJournal.delete");
  }

  async getTrades(limit = 100): Promise<TradeJournal[]> {
    const safeLimit = Math.max(1, Math.min(limit, 250));
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .order("trade_date", { ascending: false })
      .order("trade_time", { ascending: false })
      .limit(safeLimit);

    raiseOnRepositoryError(error, "tradeJournal.getTrades");
    return (data ?? []) as TradeJournal[];
  }

  createTrade(input: CreateTradeInput): Promise<TradeJournal> {
    return this.create(input);
  }

  updateTrade(id: string, input: UpdateTradeInput): Promise<TradeJournal> {
    return this.update(id, input);
  }
}
