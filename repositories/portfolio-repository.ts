import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreatePortfolioStockInput,
  PortfolioStock,
  UpdatePortfolioStockInput,
} from "@/lib/types/database";
import {
  type BaseRepository,
  raiseOnRepositoryError,
  requireRepositoryData,
} from "./base-repository";

const TABLE_NAME = "portfolio_stocks";
const PORTFOLIO_COLUMNS =
  "id, symbol, name, market, cost_price, shares, position_type, is_active, created_at, updated_at";

export interface PortfolioRepository
  extends BaseRepository<
    PortfolioStock,
    CreatePortfolioStockInput,
    UpdatePortfolioStockInput
  > {
  getActivePortfolioStocks(): Promise<PortfolioStock[]>;
  getPortfolioStock(id: string): Promise<PortfolioStock | null>;
  createPortfolioStock(input: CreatePortfolioStockInput): Promise<PortfolioStock>;
  updatePortfolioStock(
    id: string,
    input: UpdatePortfolioStockInput,
  ): Promise<PortfolioStock>;
  deactivatePortfolioStock(id: string): Promise<PortfolioStock>;
}

/** Supabase skeleton; V3-3 does not instantiate or connect it to an API. */
export class SupabasePortfolioRepository implements PortfolioRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAll(): Promise<PortfolioStock[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .order("symbol", { ascending: true });

    raiseOnRepositoryError(error, "portfolio.findAll");
    return (data ?? []) as PortfolioStock[];
  }

  async findById(id: string): Promise<PortfolioStock | null> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    raiseOnRepositoryError(error, "portfolio.findById");
    return data as PortfolioStock | null;
  }

  async create(input: CreatePortfolioStockInput): Promise<PortfolioStock> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .insert(input)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "portfolio.create");
    return requireRepositoryData(data as PortfolioStock | null, "portfolio.create");
  }

  async update(
    id: string,
    input: UpdatePortfolioStockInput,
  ): Promise<PortfolioStock> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    raiseOnRepositoryError(error, "portfolio.update");
    return requireRepositoryData(data as PortfolioStock | null, "portfolio.update");
  }

  async delete(id: string): Promise<void> {
    await this.deactivatePortfolioStock(id);
  }

  async getActivePortfolioStocks(): Promise<PortfolioStock[]> {
    const { data, error } = await this.client
      .from(TABLE_NAME)
      .select(PORTFOLIO_COLUMNS)
      .eq("is_active", true)
      .order("market", { ascending: true })
      .order("symbol", { ascending: true });

    raiseOnRepositoryError(error, "portfolio.getActivePortfolioStocks");
    return (data ?? []) as PortfolioStock[];
  }

  getPortfolioStock(id: string): Promise<PortfolioStock | null> {
    return this.findById(id);
  }

  createPortfolioStock(input: CreatePortfolioStockInput): Promise<PortfolioStock> {
    return this.create(input);
  }

  updatePortfolioStock(
    id: string,
    input: UpdatePortfolioStockInput,
  ): Promise<PortfolioStock> {
    return this.update(id, input);
  }

  async deactivatePortfolioStock(id: string): Promise<PortfolioStock> {
    return this.update(id, { is_active: false });
  }
}
