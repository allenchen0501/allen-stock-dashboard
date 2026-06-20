import {
  DATA_QUALITY_THRESHOLDS,
  type DataQualityRecordInput,
} from "@/lib/data-quality";

export type OfficialPriceSourceName = "twse-openapi" | "tpex-openapi";

export interface PriceValidationInput {
  official_source: OfficialPriceSourceName;
  official: DataQualityRecordInput;
  yahoo_fallback?: DataQualityRecordInput;
}

export interface PriceValidationPlan {
  status: "pending";
  primary_source: OfficialPriceSourceName;
  comparison_source: "yahoo-finance-fallback" | null;
  threshold_ratio: number;
  decision_ready: false;
  warnings: string[];
}

/**
 * Foundation-only validator. V3-4.7 may delegate the actual comparison to
 * comparePriceSources() after source adapters exist.
 */
export class PriceValidator {
  readonly threshold_ratio = DATA_QUALITY_THRESHOLDS.priceDifferenceRatio;

  validate(input: PriceValidationInput): PriceValidationPlan {
    return {
      status: "pending",
      primary_source: input.official_source,
      comparison_source: input.yahoo_fallback
        ? "yahoo-finance-fallback"
        : null,
      threshold_ratio: this.threshold_ratio,
      decision_ready: false,
      warnings: [
        "Price comparison is a V3-4.7 shadow-validation responsibility.",
      ],
    };
  }
}
