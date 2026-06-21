import type {
  PortfolioMode,
  PortfolioModePolicy,
  PortfolioModeResolution,
} from "./types";

export const PORTFOLIO_MODES = [
  "hardcoded",
  "shadow",
  "supabase",
] as const satisfies readonly PortfolioMode[];

export const V3_4_7_MODE_POLICY: PortfolioModePolicy = {
  allow_shadow: true,
  allow_supabase: false,
};

export const V3_5_MODE_POLICY: PortfolioModePolicy = {
  allow_shadow: true,
  allow_supabase: true,
};

export const PORTFOLIO_SOURCE_MODE_ENV = "PORTFOLIO_SOURCE_MODE";

export type PortfolioModeEnvironment = Readonly<
  Record<string, string | undefined>
>;

function isPortfolioMode(value: string): value is PortfolioMode {
  return (PORTFOLIO_MODES as readonly string[]).includes(value);
}

/** Pure resolver; callers may pass a future server-side flag value explicitly. */
export function resolvePortfolioMode(
  requestedMode?: string,
  policy: PortfolioModePolicy = V3_4_7_MODE_POLICY,
): PortfolioModeResolution {
  const normalized = requestedMode?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return {
      requested_mode: null,
      effective_mode: "hardcoded",
      fallback_applied: true,
      warnings: [
        "PORTFOLIO_SOURCE_MODE is not set; using hardcoded fallback.",
      ],
    };
  }

  if (!isPortfolioMode(normalized)) {
    return {
      requested_mode: requestedMode ?? null,
      effective_mode: "hardcoded",
      fallback_applied: true,
      warnings: ["Unknown Portfolio mode; using hardcoded fallback."],
    };
  }

  if (normalized === "shadow" && !policy.allow_shadow) {
    return {
      requested_mode: normalized,
      effective_mode: "hardcoded",
      fallback_applied: true,
      warnings: ["Shadow mode is not enabled by the current rollout policy."],
    };
  }

  if (normalized === "supabase" && !policy.allow_supabase) {
    return {
      requested_mode: normalized,
      effective_mode: "hardcoded",
      fallback_applied: true,
      warnings: ["Supabase mode is blocked until the V3-5 switch gates pass."],
    };
  }

  return {
    requested_mode: normalized,
    effective_mode: normalized,
    fallback_applied: false,
    warnings: [],
  };
}

/** Resolves the server-only feature flag. Never use a NEXT_PUBLIC variable. */
export function resolvePortfolioModeFromEnvironment(
  environment: PortfolioModeEnvironment = process.env,
  policy: PortfolioModePolicy = V3_5_MODE_POLICY,
): PortfolioModeResolution {
  return resolvePortfolioMode(environment.PORTFOLIO_SOURCE_MODE, policy);
}
