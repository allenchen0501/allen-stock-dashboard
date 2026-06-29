/**
 * Unified Connection Evidence Ledger Builder — V70
 *
 * Pure deterministic builder. Emits the 20 pending evidence items, their categories
 * (all pending, completedCount 0), and the dependency graph, then self-validates.
 * The ledger decision is NO_GO — connection is not allowed; nothing is provided,
 * accepted, or attached.
 *
 * This is NOT a runtime. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import
 *   - No env key reads (no process.env)
 *   - No clock reads (generatedAt is passed in or a fixed deterministic string)
 *   - No data writes; no API route; no /api/portfolio switch; no buy/sell command
 *   - Manual sign-off / staging / real quote / production switch flags never flipped
 */

import {
  UNIFIED_CONNECTION_EVIDENCE_KNOWN_VERSIONS,
  UNIFIED_CONNECTION_EVIDENCE_LEDGER_SAFETY_LABELS,
  UNIFIED_CONNECTION_EVIDENCE_LEDGER_SPEC_NAME,
  UNIFIED_CONNECTION_EVIDENCE_REQUIRED_IDS,
} from "./unified-connection-evidence-ledger-contract";
import type {
  EvidenceRequiredStage,
  UnifiedConnectionEvidenceCategory,
  UnifiedConnectionEvidenceDependency,
  UnifiedConnectionEvidenceItem,
  UnifiedConnectionEvidenceLedger,
  UnifiedConnectionEvidenceLedgerValidation,
} from "./unified-connection-evidence-ledger-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildUnifiedConnectionEvidenceLedgerContractInput {
  generatedAt?: string;
}

interface ItemSeed {
  evidenceId: string;
  category: string;
  title: string;
  description: string;
  requiredBeforeStage: EvidenceRequiredStage;
  requiredByVersions: string[];
  sourceContracts: string[];
  ownerRole: string;
  manualSignoffRequired: boolean;
  blocksStagingConnection: boolean;
  blocksRealQuoteConnection: boolean;
  blocksProductionSwitch: boolean;
  riskIfMissing: string;
}

const ITEM_SEEDS: ItemSeed[] = [
  {
    evidenceId: "OWNER_MANUAL_SIGNOFF",
    category: "MANUAL_SIGNOFF",
    title: "Owner manual sign-off",
    description: "Allen 本人對啟用任何連線的人工簽核（人工 evidence）。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V64", "V66", "V67"],
    sourceContracts: ["docs/manual-signoff-evidence-spec.md", "use-cases/war-room/candidate-price-level-fixture-source-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "未經人工簽核即連線，可能誤把 fixture 當真實資料操作。",
  },
  ...sourceAuth("YAHOO", "Yahoo Finance Taiwan candidate"),
  ...sourceAuth("TWSE", "TWSE official candidate"),
  ...sourceAuth("TPEX", "TPEx official candidate"),
  ...sourceAuth("GOODINFO", "Goodinfo candidate"),
  ...sourceAuth("BROKER_IMPORT", "Broker import candidate"),
  {
    evidenceId: "STAGING_SUPABASE_PROJECT_CONFIRMATION",
    category: "STAGING_READONLY",
    title: "Staging Supabase project confirmation",
    description: "確認 staging Supabase 專案身分與範圍（read-only）。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V64", "V66"],
    sourceContracts: ["docs/staging-supabase-readonly-safety-gate.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "連到錯誤或可寫入的專案。",
  },
  {
    evidenceId: "STAGING_READONLY_ROLE_CONFIRMATION",
    category: "STAGING_READONLY",
    title: "Staging read-only role confirmation",
    description: "確認 dashboard 使用 read-only role。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V66"],
    sourceContracts: ["docs/staging-supabase-readonly-safety-gate.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "以可寫入角色連線造成資料風險。",
  },
  {
    evidenceId: "RLS_SELECT_ONLY_CONFIRMATION",
    category: "STAGING_READONLY",
    title: "RLS select-only confirmation",
    description: "確認 RLS 僅允許 select（無 insert/update/delete）。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V65", "V66"],
    sourceContracts: ["docs/staging-supabase-rls-manual-matrix.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "RLS 設定不當導致寫入或越權讀取。",
  },
  {
    evidenceId: "SERVICE_ROLE_NOT_IN_APP_RUNTIME",
    category: "STAGING_READONLY",
    title: "Service role not used in app runtime",
    description: "確認 app runtime 不使用 service role。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V66"],
    sourceContracts: ["use-cases/war-room/authorized-real-quote-field-catalog-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "service role 外洩造成最高權限風險。",
  },
  {
    evidenceId: "WRITE_OPERATION_BLOCK_CONFIRMATION",
    category: "STAGING_READONLY",
    title: "Write operation block confirmation",
    description: "確認所有寫入操作被阻擋。",
    requiredBeforeStage: "STAGING_READONLY",
    requiredByVersions: ["V66"],
    sourceContracts: ["use-cases/war-room/authorized-real-quote-field-catalog-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: true,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "意外寫入資料庫。",
  },
  {
    evidenceId: "API_ROUTE_NO_SWITCH_CONFIRMATION",
    category: "STAGING_READONLY",
    title: "API route no-switch confirmation",
    description: "確認 /api/portfolio 未被切換到真實來源。",
    requiredBeforeStage: "REAL_QUOTE",
    requiredByVersions: ["V66"],
    sourceContracts: ["use-cases/war-room/authorized-real-quote-field-catalog-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "提前切換 API 來源造成誤用。",
  },
  {
    evidenceId: "REAL_QUOTE_MAPPING_REVIEW",
    category: "MAPPING_REVIEW",
    title: "Real quote mapping review",
    description: "審查 descriptor → real quote 欄位對應。",
    requiredBeforeStage: "REAL_QUOTE",
    requiredByVersions: ["V65"],
    sourceContracts: ["use-cases/war-room/descriptor-to-real-quote-mapping-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "欄位對應錯誤導致價位失真。",
  },
  {
    evidenceId: "SOURCE_CONFLICT_POLICY_REVIEW",
    category: "MAPPING_REVIEW",
    title: "Source conflict policy review",
    description: "審查多來源衝突解析策略。",
    requiredBeforeStage: "REAL_QUOTE",
    requiredByVersions: ["V67"],
    sourceContracts: ["use-cases/war-room/real-quote-source-conflict-resolution-policy-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "衝突來源未正確降級。",
  },
  {
    evidenceId: "TRADE_PLAN_DOWNGRADE_UI_REVIEW",
    category: "MAPPING_REVIEW",
    title: "Trade plan downgrade UI review",
    description: "審查 downgrade → UI 行為。",
    requiredBeforeStage: "REAL_QUOTE",
    requiredByVersions: ["V68", "V69"],
    sourceContracts: ["use-cases/war-room/downgraded-trade-plan-ui-behavior-contract.ts"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "降級時 UI 仍顯示可操作。",
  },
  {
    evidenceId: "SHADOW_COMPARISON_PLAN",
    category: "SHADOW_COMPARISON",
    title: "Shadow comparison plan",
    description: "fixture vs real shadow comparison 計畫。",
    requiredBeforeStage: "SHADOW_COMPARISON",
    requiredByVersions: ["V65", "V66"],
    sourceContracts: ["docs/fixture-vs-staging-shadow-comparison-spec.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "未先比對即切換真實資料。",
  },
  {
    evidenceId: "SHADOW_COMPARISON_RESULT_PENDING",
    category: "SHADOW_COMPARISON",
    title: "Shadow comparison result (pending)",
    description: "fixture vs real 比對結果（待提供）。",
    requiredBeforeStage: "PRODUCTION_SWITCH",
    requiredByVersions: ["V65", "V66"],
    sourceContracts: ["docs/fixture-vs-staging-shadow-comparison-spec.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: true,
    blocksProductionSwitch: true,
    riskIfMissing: "比對不一致卻已切換。",
  },
  {
    evidenceId: "ROLLBACK_RUNBOOK",
    category: "SAFETY_OPERATIONS",
    title: "Rollback runbook",
    description: "連線後快速回退到 fixture 的 runbook。",
    requiredBeforeStage: "PRODUCTION_SWITCH",
    requiredByVersions: ["V64"],
    sourceContracts: ["docs/staging-readonly-dry-run-execution-gate.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: false,
    blocksProductionSwitch: true,
    riskIfMissing: "出錯時無法快速回退。",
  },
  {
    evidenceId: "KILL_SWITCH_CONFIRMATION",
    category: "SAFETY_OPERATIONS",
    title: "Kill switch confirmation",
    description: "確認 kill switch 預設啟用。",
    requiredBeforeStage: "PRODUCTION_SWITCH",
    requiredByVersions: ["V64"],
    sourceContracts: ["docs/staging-readonly-dry-run-execution-gate.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: false,
    blocksProductionSwitch: true,
    riskIfMissing: "無法即時停止連線。",
  },
  {
    evidenceId: "PRODUCTION_SWITCH_FINAL_APPROVAL",
    category: "PRODUCTION_SWITCH",
    title: "Production switch final approval",
    description: "最終人工核准切換到真實操作（目前不可）。",
    requiredBeforeStage: "PRODUCTION_SWITCH",
    requiredByVersions: ["V64", "V69"],
    sourceContracts: ["docs/unified-connection-evidence-ledger.md"],
    ownerRole: "owner_operator",
    manualSignoffRequired: true,
    blocksStagingConnection: false,
    blocksRealQuoteConnection: false,
    blocksProductionSwitch: true,
    riskIfMissing: "未經最終核准即上線。",
  },
];

function sourceAuth(suffix: string, sourceName: string): ItemSeed[] {
  return [
    {
      evidenceId: `SOURCE_AUTHORIZATION_${suffix}`,
      category: "SOURCE_AUTHORIZATION",
      title: `Source authorization — ${sourceName}`,
      description: `確認 ${sourceName} 的授權範圍與條款（人工 evidence）。`,
      requiredBeforeStage: "REAL_QUOTE",
      requiredByVersions: ["V66"],
      sourceContracts: ["use-cases/war-room/authorized-real-quote-field-catalog-contract.ts"],
      ownerRole: "owner_operator",
      manualSignoffRequired: true,
      blocksStagingConnection: false,
      blocksRealQuoteConnection: true,
      blocksProductionSwitch: true,
      riskIfMissing: `未授權即使用 ${sourceName} 資料。`,
    },
  ];
}

function toItem(seed: ItemSeed): UnifiedConnectionEvidenceItem {
  return {
    evidenceId: seed.evidenceId,
    category: seed.category,
    title: seed.title,
    description: seed.description,
    requiredBeforeStage: seed.requiredBeforeStage,
    requiredByVersions: seed.requiredByVersions,
    sourceContracts: seed.sourceContracts,
    ownerRole: seed.ownerRole,
    evidenceStatus: "PENDING",
    evidenceProvided: false,
    evidenceAccepted: false,
    manualReviewRequired: true,
    manualSignoffRequired: seed.manualSignoffRequired,
    manualSignoffCompleted: false,
    blocksStagingConnection: seed.blocksStagingConnection,
    blocksRealQuoteConnection: seed.blocksRealQuoteConnection,
    blocksProductionSwitch: seed.blocksProductionSwitch,
    riskIfMissing: seed.riskIfMissing,
    allowedPlaceholder: true,
    actualEvidenceAttached: false,
  };
}

const CATEGORY_TITLES: Record<string, string> = {
  MANUAL_SIGNOFF: "Manual sign-off",
  SOURCE_AUTHORIZATION: "Source authorization",
  STAGING_READONLY: "Staging read-only review",
  MAPPING_REVIEW: "Mapping / policy review",
  SHADOW_COMPARISON: "Shadow comparison",
  SAFETY_OPERATIONS: "Safety operations",
  PRODUCTION_SWITCH: "Production switch approval",
};

function buildCategories(items: UnifiedConnectionEvidenceItem[]): UnifiedConnectionEvidenceCategory[] {
  const byId = new Map<string, UnifiedConnectionEvidenceItem[]>();
  for (const item of items) {
    const arr = byId.get(item.category) ?? [];
    arr.push(item);
    byId.set(item.category, arr);
  }
  const categories: UnifiedConnectionEvidenceCategory[] = [];
  for (const [categoryId, arr] of byId) {
    categories.push({
      categoryId,
      title: CATEGORY_TITLES[categoryId] ?? categoryId,
      itemCount: arr.length,
      completedCount: 0,
      pendingCount: arr.length,
      categoryStatus: "PENDING",
      blocksStagingConnection: arr.some((i) => i.blocksStagingConnection),
      blocksRealQuoteConnection: arr.some((i) => i.blocksRealQuoteConnection),
      blocksProductionSwitch: arr.some((i) => i.blocksProductionSwitch),
    });
  }
  return categories;
}

function buildDependencies(): UnifiedConnectionEvidenceDependency[] {
  const dep = (
    dependencyId: string,
    fromEvidenceId: string,
    toEvidenceId: string,
    dependencyType: UnifiedConnectionEvidenceDependency["dependencyType"],
    reason: string,
  ): UnifiedConnectionEvidenceDependency => ({ dependencyId, fromEvidenceId, toEvidenceId, dependencyType, reason });
  return [
    dep("DEP_SIGNOFF_PROD", "OWNER_MANUAL_SIGNOFF", "PRODUCTION_SWITCH_FINAL_APPROVAL", "PREREQUISITE", "需先有 owner sign-off 才談 production switch。"),
    dep("DEP_STAGING_RLS", "STAGING_READONLY_ROLE_CONFIRMATION", "RLS_SELECT_ONLY_CONFIRMATION", "PREREQUISITE", "先確認 read-only role，再確認 RLS select-only。"),
    dep("DEP_AUTH_MAPPING", "SOURCE_AUTHORIZATION_TWSE", "REAL_QUOTE_MAPPING_REVIEW", "PREREQUISITE", "來源授權後才審查 real quote mapping。"),
    dep("DEP_SHADOW_PLAN_RESULT", "SHADOW_COMPARISON_PLAN", "SHADOW_COMPARISON_RESULT_PENDING", "PREREQUISITE", "先有比對計畫，才有比對結果。"),
    dep("DEP_SHADOW_PROD", "SHADOW_COMPARISON_RESULT_PENDING", "PRODUCTION_SWITCH_FINAL_APPROVAL", "BLOCKS", "比對結果未通過即阻擋 production switch。"),
    dep("DEP_KILL_PROD", "KILL_SWITCH_CONFIRMATION", "PRODUCTION_SWITCH_FINAL_APPROVAL", "BLOCKS", "kill switch 未確認即阻擋 production switch。"),
    dep("DEP_ROLLBACK_PROD", "ROLLBACK_RUNBOOK", "PRODUCTION_SWITCH_FINAL_APPROVAL", "BLOCKS", "rollback runbook 未備即阻擋 production switch。"),
  ];
}

/**
 * Builds the unified connection evidence ledger. Reads no clock, no env, no network
 * — only the static evidence seeds. Decision is NO_GO; all evidence is pending.
 */
export function buildUnifiedConnectionEvidenceLedgerContract(
  input: BuildUnifiedConnectionEvidenceLedgerContractInput = {},
): UnifiedConnectionEvidenceLedger {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const evidenceItems = ITEM_SEEDS.map(toItem);
  const evidenceCategories = buildCategories(evidenceItems);
  const dependencies = buildDependencies();

  const itemIds = new Set(evidenceItems.map((i) => i.evidenceId));
  const knownVersions = new Set(UNIFIED_CONNECTION_EVIDENCE_KNOWN_VERSIONS as readonly string[]);

  const requiredItemsPresent = UNIFIED_CONNECTION_EVIDENCE_REQUIRED_IDS.every((id) => itemIds.has(id));
  const allStatusPending = evidenceItems.every((i) => i.evidenceStatus === "PENDING");
  const allEvidenceNotProvided = evidenceItems.every((i) => i.evidenceProvided === false);
  const allEvidenceNotAccepted = evidenceItems.every((i) => i.evidenceAccepted === false);
  const allActualEvidenceNotAttached = evidenceItems.every((i) => i.actualEvidenceAttached === false);
  const allManualSignoffNotCompleted = evidenceItems.every((i) => i.manualSignoffCompleted === false);
  const allCategoriesPending = evidenceCategories.every((c) => c.categoryStatus === "PENDING" && c.pendingCount > 0);
  const completedCountZero = evidenceCategories.every((c) => c.completedCount === 0);
  const categoryCountsAggregateCorrectly = evidenceCategories.every((c) => {
    const actual = evidenceItems.filter((i) => i.category === c.categoryId).length;
    return c.itemCount === actual && c.pendingCount === actual;
  });
  const requiredByVersionsReferenceKnown = evidenceItems.every(
    (i) => i.requiredByVersions.length > 0 && i.requiredByVersions.some((v) => knownVersions.has(v)),
  );
  const sourceContractsNonEmpty = evidenceItems.every((i) => i.sourceContracts.length > 0);
  const dependenciesReferenceExistingItems = dependencies.every(
    (d) => itemIds.has(d.fromEvidenceId) && itemIds.has(d.toEvidenceId),
  );
  // No item clears any connection while pending.
  const noItemAllowsProductionSwitch = evidenceItems.every((i) => i.evidenceAccepted === false);
  const noItemAllowsRealQuoteConnection = evidenceItems.every((i) => i.evidenceAccepted === false);
  const noItemAllowsStagingConnection = evidenceItems.every((i) => i.evidenceAccepted === false);

  const validation: UnifiedConnectionEvidenceLedgerValidation = {
    requiredItemsPresent,
    allStatusPending,
    allEvidenceNotProvided,
    allEvidenceNotAccepted,
    allActualEvidenceNotAttached,
    allManualSignoffNotCompleted,
    allCategoriesPending,
    completedCountZero,
    categoryCountsAggregateCorrectly,
    requiredByVersionsReferenceKnown,
    sourceContractsNonEmpty,
    dependenciesReferenceExistingItems,
    noItemAllowsProductionSwitch,
    noItemAllowsRealQuoteConnection,
    noItemAllowsStagingConnection,
    decisionIsNoGo: true,
    valid: false,
  };
  validation.valid = Object.entries(validation).every(([k, v]) => k === "valid" || v === true);

  return {
    contractVersion: "V70",
    specName: UNIFIED_CONNECTION_EVIDENCE_LEDGER_SPEC_NAME,
    ledgerMode: "SPEC_ONLY_PENDING_EVIDENCE",
    generatedAt,
    decision: "NO_GO",

    stagingConnectionAllowed: false,
    realQuoteConnectionAllowed: false,
    productionSwitchAllowed: false,
    manualSignoffCompleted: false,
    actualEvidenceAttached: false,
    realDataConnected: false,
    runtimeCreated: false,
    apiRouteCreated: false,
    envReadPerformed: false,
    fetchPerformed: false,
    supabaseConnected: false,
    databaseWritePerformed: false,
    portfolioApiSwitched: false,
    productionReady: false,

    evidenceItems,
    evidenceCategories,
    dependencies,
    validation,

    safetyLabels: [...UNIFIED_CONNECTION_EVIDENCE_LEDGER_SAFETY_LABELS],
  };
}
