import type { PortfolioModeResolution } from "./types";

export interface PortfolioSwitchGuardMetadata {
  source_mode: string;
  response_source: "hardcoded";
  decision_source: "hardcoded";
  fallback_used: boolean;
  fallback_reason?: string;
  warnings: string[];
  shadow_enabled?: boolean;
  shadow_status?: string;
  shadow_reason?: string;
  request_performed: false;
  supabase_connected: false;
  production_write_performed: false;
}

/**
 * Pure function: maps a resolved portfolio mode into the V14 switch guard
 * metadata contract. No Supabase client, no env reads, no HTTP.
 *
 * Supabase mode is guarded in V14: the caller never creates a Supabase client
 * and never reads secret env keys. The guard falls back to hardcoded and sets
 * fallback_used=true with an explicit reason so the caller can detect it.
 */
export function buildSwitchGuardMetadata(
  mode: PortfolioModeResolution,
): PortfolioSwitchGuardMetadata {
  const warnings = [...mode.warnings];

  if (mode.effective_mode === "shadow") {
    return {
      source_mode: "shadow",
      response_source: "hardcoded",
      decision_source: "hardcoded",
      fallback_used: false,
      warnings,
      shadow_enabled: true,
      shadow_status: "SKIPPED",
      shadow_reason: "Supabase connection disabled in V14 guard",
      request_performed: false,
      supabase_connected: false,
      production_write_performed: false,
    };
  }

  if (mode.effective_mode === "supabase") {
    warnings.push(
      "Supabase mode is guarded in V14 and remains disabled until staging gates pass.",
    );
    return {
      source_mode: "supabase",
      response_source: "hardcoded",
      decision_source: "hardcoded",
      fallback_used: true,
      fallback_reason:
        "Supabase mode is guarded in V14 and remains disabled until staging gates pass",
      warnings,
      request_performed: false,
      supabase_connected: false,
      production_write_performed: false,
    };
  }

  return {
    source_mode: mode.effective_mode,
    response_source: "hardcoded",
    decision_source: "hardcoded",
    fallback_used: mode.fallback_applied,
    warnings,
    request_performed: false,
    supabase_connected: false,
    production_write_performed: false,
  };
}
