/**
 * Core 5 Read-Only Expansion Approval Contract — FIXTURE-ONLY / SPEC-ONLY.
 *
 * A pure, deterministic governance contract that defines the owner-approval workflow and
 * the per-symbol evidence gates that EACH of the "core 5" Taiwan symbols must clear BEFORE
 * it may ever enter the runtime `approvedLiveFetchSymbols`. It expands NOTHING: only 3019
 * is approved; 4966 / 5347 / 4979 / 2455 are candidates in `pending_owner_approval` and are
 * explicitly NOT in the approved set / NOT in any runtime approved channel set.
 *
 * 定位：approval governance spec / read-only expansion preparation。不是開第二檔、不是擴股票池、
 * 不是 live-fetch expansion、不是正式行情全切、不是 /api/portfolio switch、不是 Supabase runtime、
 * 不是交易訊號、不是買賣建議、不是下單、不是自動交易。
 *
 * PURE: NO fetch, NO real network, NO Supabase, NO env read, NO DB write, NO API route, NO
 * broker API, NO buy/sell command, NO auto order, NO production data switch. The candidate
 * symbols / proposed channels below are SPEC values only and must NEVER be copied into the
 * provider, the route, the MVP contract, or approvedLiveFetchSymbols until each symbol has
 * cleared its owner-approval + manual-smoke + production-endpoint evidence gates.
 *
 * See: docs/core-5-read-only-expansion-approval-spec.md
 */

export type Core5ApprovalStatus = "approved" | "pending_owner_approval";

export interface Core5Candidate {
  symbol: string;
  nameZh: string;
  /** SPEC-ONLY proposed channel; NOT a runtime approved channel until channelVerified. */
  proposedChannel: string;
  /** true only for a symbol whose channel has been owner-verified (currently 3019 only). */
  channelVerified: boolean;
  approvalStatus: Core5ApprovalStatus;
  ownerApproved: boolean;
  manualSmokeEvidenceComplete: boolean;
  productionEndpointEvidenceComplete: boolean;
  perSymbolValidatorComplete: boolean;
  /** Whether this symbol is CURRENTLY in the runtime approvedLiveFetchSymbols set. */
  inApprovedLiveFetchSymbols: boolean;
  requiredEvidenceChecklist: string[];
  notesZh: string;
}

export interface Core5ExpansionApprovalContract {
  specVersion: "V1";
  generatedAt: string;

  currentApprovedState: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: string[];
    approvedChannels: string[];
  };

  core5Candidates: Core5Candidate[];

  summary: {
    totalCandidates: number;
    approvedCount: number;
    pendingCount: number;
    inApprovedSetCount: number;
  };

  /** Ordered owner-approval workflow gates every candidate must pass, in order. */
  approvalWorkflow: string[];
  /** Per-symbol evidence that must exist before a symbol is approved. */
  perSymbolRequiredEvidence: string[];

  ownerApprovalGate: { required: true; descriptionZh: string };
  manualSmokeGate: { required: true; descriptionZh: string };
  productionEndpointCaseGate: { required: true; requiredCasesZh: string[]; descriptionZh: string };

  // Red-line flags (all false / locked). This spec expands NOTHING at runtime.
  liveFetchSymbolAdded: false;
  approvedSetExpanded: false;
  newRuntimeChannelAdded: false;
  realNetworkUsed: false;
  liveFetchPerformed: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  apiRouteCreated: false;
  brokerApiUsed: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitched: false;
  productionTradingReady: false;

  safetyLabels: string[];
}

export interface BuildCore5ExpansionApprovalContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-02T00:00:00.000Z";

const PER_SYMBOL_REQUIRED_EVIDENCE: string[] = [
  "owner approval（Allen 明確書面核准該檔）",
  "approved channel（逐檔驗證 tse_/otc_ 前綴，channelVerified=true）",
  "per-symbol standalone validator（不納入 safety-chain）",
  "manual-refresh-only endpoint 行為（預設 page load 不 fetch）",
  "read-only（不下單、不寫 DB、不切 production）",
  "non-approved rejection case（他檔 symbol 被拒且不 fetch）",
  "missing mode / auto mode rejection case（缺 mode / mode=auto 被拒且不 fetch）",
  "manual smoke evidence（實測 LIVE_FETCH_OK 或如實記錄 fallback/timeout/source_error）",
  "production endpoint evidence（production URL 實跑並記錄 actual response）",
  "加入 approvedLiveFetchSymbols 前需全部完成（未完成不得加入）",
];

const APPROVAL_WORKFLOW: string[] = [
  "1. owner approval gate：Allen 明確核准該檔進入唯讀擴充流程。",
  "2. channel verification：逐檔確認 approved channel（tse_/otc_ 前綴）並設 channelVerified=true。",
  "3. per-symbol validator：新增該檔 standalone validator（不納入 safety-chain）。",
  "4. manual smoke gate：執行 manual smoke，記錄 LIVE_FETCH_OK 或 fallback/timeout/source_error（不假造價格）。",
  "5. production endpoint case gate：production URL 實跑 approved / non-approved / missing-mode / auto-mode 四案並記錄。",
  "6. approved set 加入：全部 gate 通過後，才可將該檔加入 approvedLiveFetchSymbols（仍 manual-refresh-only、read-only）。",
];

function candidate(
  symbol: string,
  nameZh: string,
  proposedChannel: string,
  approved: boolean,
): Core5Candidate {
  return {
    symbol,
    nameZh,
    proposedChannel,
    channelVerified: approved,
    approvalStatus: approved ? "approved" : "pending_owner_approval",
    ownerApproved: approved,
    manualSmokeEvidenceComplete: approved,
    productionEndpointEvidenceComplete: approved,
    perSymbolValidatorComplete: approved,
    inApprovedLiveFetchSymbols: approved,
    requiredEvidenceChecklist: PER_SYMBOL_REQUIRED_EVIDENCE,
    notesZh: approved
      ? "已核准並完成 manual smoke + production endpoint evidence（Case A live_verified、B/C/D rejected）。"
      : "尚未 owner approval；proposedChannel 未驗證；不得加入 approvedLiveFetchSymbols，未完成前不得 live fetch。",
  };
}

// SPEC-ONLY candidate table. 3019 approved; the rest pending owner approval.
// proposedChannel is a SPEC value only (tse_/otc_ prefix requires per-symbol verification).
const CORE5_CANDIDATES: Core5Candidate[] = [
  candidate("3019", "亞光", "tse_3019.tw", true),
  candidate("4966", "譜瑞", "tse_4966.tw", false),
  candidate("5347", "世界", "tse_5347.tw", false),
  candidate("4979", "華星光", "otc_4979.tw", false),
  candidate("2455", "全新", "tse_2455.tw", false),
];

/**
 * Builds the fixture-only core 5 expansion approval contract. Reads no clock / env /
 * network; the current runtime approved set is derived from candidates and MUST equal
 * exactly ["3019"]. This spec expands nothing.
 */
export function buildCore5ExpansionApprovalContract(
  input: BuildCore5ExpansionApprovalContractInput = {},
): Core5ExpansionApprovalContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const candidates = CORE5_CANDIDATES;

  // The runtime approved set is DERIVED from the candidates that are actually approved and
  // in the approved set — this must be exactly ["3019"].
  const approvedLiveFetchSymbols = candidates
    .filter((c) => c.inApprovedLiveFetchSymbols)
    .map((c) => c.symbol);
  const approvedChannels = candidates
    .filter((c) => c.inApprovedLiveFetchSymbols)
    .map((c) => c.proposedChannel);

  return {
    specVersion: "V1",
    generatedAt,
    currentApprovedState: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols,
      approvedChannels,
    },
    core5Candidates: candidates,
    summary: {
      totalCandidates: candidates.length,
      approvedCount: candidates.filter((c) => c.approvalStatus === "approved").length,
      pendingCount: candidates.filter((c) => c.approvalStatus === "pending_owner_approval").length,
      inApprovedSetCount: candidates.filter((c) => c.inApprovedLiveFetchSymbols).length,
    },
    approvalWorkflow: APPROVAL_WORKFLOW,
    perSymbolRequiredEvidence: PER_SYMBOL_REQUIRED_EVIDENCE,
    ownerApprovalGate: {
      required: true,
      descriptionZh: "每一檔都必須 Allen owner approval，未核准前不得進入後續 gate、不得加入 approvedLiveFetchSymbols。",
    },
    manualSmokeGate: {
      required: true,
      descriptionZh: "每一檔都必須先完成 manual smoke evidence；失敗只記錄 fallback/timeout/source_error，不假造價格。",
    },
    productionEndpointCaseGate: {
      required: true,
      requiredCasesZh: [
        "Case A：approved symbol + mode=manual → read-only fetch（live_verified 或如實 fallback）。",
        "Case B：non-approved symbol + mode=manual → rejected without fetch。",
        "Case C：approved symbol 缺 mode → rejected without fetch。",
        "Case D：approved symbol + mode=auto → rejected without fetch。",
      ],
      descriptionZh: "每一檔都必須完成 production endpoint evidence（四案實跑並記錄 actual response）。",
    },
    liveFetchSymbolAdded: false,
    approvedSetExpanded: false,
    newRuntimeChannelAdded: false,
    realNetworkUsed: false,
    liveFetchPerformed: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    apiRouteCreated: false,
    brokerApiUsed: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitched: false,
    productionTradingReady: false,
    safetyLabels: [
      "Core 5 Read-Only Expansion Approval Spec",
      "approval governance spec, not a live-fetch expansion",
      "only 3019 approved; 4966 / 5347 / 4979 / 2455 pending owner approval",
      "candidate symbols / proposed channels are spec-only, not runtime approved",
      "approvedLiveFetchSymbols remain exactly [3019] until each symbol clears all gates",
      "each symbol requires owner approval + per-symbol validator + manual smoke + production endpoint evidence",
      "manual-refresh-only, read-only, default page load no fetch",
      "no new provider / no Yahoo / no new runtime channel",
      "no Supabase / no env read / no DB write / no API route / no broker API",
      "no buy/sell command / no auto order / no production data switch / not production trading ready",
      "使用者可見 UI 一律繁體中文",
    ],
  };
}
