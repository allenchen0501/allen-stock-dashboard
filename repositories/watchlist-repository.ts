import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateWatchlistStockInput,
  UpdateWatchlistStockInput,
  WatchlistStock,
} from "@/lib/types/database";
import {
  type BaseRepository,
  raiseOnRepositoryError,
  requireRepositoryData,
} from "./base-repository";

const TABLE_NAME = "watchlist_stocks";

export interface WatchlistRepository
  extends BaseRepository<
    WatchlistStock,
    CreateWatchlistStockInput,
    UpdateWatchlistStockInput
  > {
  getWatchlistStocks(): Promise<WatchlistStock[]>;
  createWatchlistStock(input: CreateWatchlistStockInput): Promise<WatchlistStock>;
  updateWatchlistStock(
    id: string,
    input: UpdateWatchlistStockInput,
  ): Promise<WatchlistStock>;
  removeWatchlistStock(id: string): Promise<void>;
}

/** Supabase skeleton; V3-3 does not instantiate or connect it to an API. */
export class SupabaseWatchlistRepository implements WatchlistRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<WatchlistStock[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .order("tier", { ascending: true })
      .order("symbol", { ascending: true });

    raiseOnRepositoryError(error, "watchlist.findAll");
    return (data ?? []) as WatchlistStock[];
  }

  async findById(id: string): Promise<WatchlistStock | null> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    raiseOnRepositoryError(error, "watchlist.findById");
    return data as WatchlistStock | null;
  }

  async create(input: CreateWatchlistStockInput): Promise<WatchlistStock> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .insert(input)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "watchlist.create");
    return requireRepositoryData(data as WatchlistStock | null, "watchlist.create");
  }

  async update(
    id: string,
    input: UpdateWatchlistStockInput,
  ): Promise<WatchlistStock> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "watchlist.update");
    return requireRepositoryData(data as WatchlistStock | null, "watchlist.update");
  }

  async delete(id: string): Promise<void> {
    await this.removeWatchlistStock(id);
  }

  async getWatchlistStocks(): Promise<WatchlistStock[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .eq("is_active", true)
      .order("tier", { ascending: true })
      .order("symbol", { ascending: true });

    raiseOnRepositoryError(error, "watchlist.getWatchlistStocks");
    return (data ?? []) as WatchlistStock[];
  }

  createWatchlistStock(input: CreateWatchlistStockInput): Promise<WatchlistStock> {
    return this.create(input);
  }

  updateWatchlistStock(
    id: string,
    input: UpdateWatchlistStockInput,
  ): Promise<WatchlistStock> {
    return this.update(id, input);
  }

  async removeWatchlistStock(id: string): Promise<void> {
    await this.update(id, { is_active: false });
  }
}
