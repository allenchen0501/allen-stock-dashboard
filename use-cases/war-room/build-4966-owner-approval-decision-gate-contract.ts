/**
 * 4966 Owner Approval Decision Gate Contract — FIXTURE-ONLY / SPEC-ONLY.
 *
 * A pure, deterministic decision gate that defines HOW Allen owner must explicitly approve
 * 4966 (譜瑞) to enter the next version (4966 Read-Only Manual-Refresh MVP). It approves
 * NOTHING: 4966 stays `pending_owner_approval`, approvalDate is null, approvedChannel is
 * null, 4966 is NOT in approvedLiveFetchSymbols, and the approval text is a TEMPLATE only
 * (templateIsApproval=false). Only 3019 remains approved.
 *
 * 定位：owner approval decision gate / governance evidence gate / fixture-only。不是正式核准
 * 4966、不是把 4966 加入 approvedLiveFetchSymbols、不是開第二檔 live fetch、不是交易訊號、
 * 不是買賣建議、不是下單、不是自動交易。只有在 Allen 明確提供書面核准句、且核准後仍完成 channel
 * verification / per-symbol validator / manual smoke / production endpoint evidence 後，才可進入下一版。
 *
 * PURE: NO fetch, NO real network, NO Supabase, NO env read, NO DB write, NO API route, NO
 * broker, NO buy/sell command, NO auto order, NO production data switch, NO smoke run, NO
 * production endpoint call. This version does not flip approvalStatus, does not fill
 * approvalDate, and does not fill approvedChannel.
 *
 * See: docs/4966-owner-approval-decision-gate.md
 */

export type Owner4966DecisionState = "pending_owner_approval" | "approved" | "rejected";

export interface Owner4966StateTransition {
  from: Owner4966DecisionState;
  to: Owner4966DecisionState;
  requiresZh: string;
}

export interface Owner4966DecisionGateContract {
  gateVersion: "V1";
  generatedAt: string;

  symbol: "4966";
  nameZh: "譜瑞";

  currentApprovalStatus: "pending_owner_approval";
  ownerApprovalReceived: false;
  approvalDate: null;
  approvedChannel: null;
  inApprovedLiveFetchSymbols: false;

  currentApprovedState: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: string[];
    approvedChannels: string[];
  };

  decisionStates: Owner4966DecisionState[];
  stateTransitions: Owner4966StateTransition[];

  ownerApprovalRequiredPhrase: string;
  approvalPhraseRequiredElements: string[];
  approvalTextTemplate: string;
  templateIsApproval: false;

  /** Live evaluation of the gate given the current (no-approval) state. */
  gateEvaluation: {
    ownerApprovalReceived: false;
    allSafetyElementsPresent: false;
    resultingStatus: "pending_owner_approval";
    nextVersionUnlocked: false;
    reasonZh: string;
  };

  preconditionsForNextVersion: string[];
  postApprovalRemainingRequirements: string[];
  nextVersion: string;
  nextVersionUnlocked: false;

  // Red-line flags (all false / locked). This gate approves and expands NOTHING.
  approvalStatusChangedToApproved: false;
  approvalDateFilled: false;
  approvedChannelFilled: false;
  liveFetchSymbolAdded: false;
  approvedSetExpanded: false;
  newRuntimeChannelAdded: false;
  endpointCreatedFor4966: false;
  warRoomButtonCreatedFor4966: false;
  smokeExecutedFor4966: false;
  productionEndpointCalledFor4966: false;
  realNetworkUsed: false;
  supabaseConnected: false;
  envReadPerformed: false;
  databaseWritePerformed: false;
  brokerConnected: false;
  buySellCommandGenerated: false;
  autoOrderRequested: false;
  productionDataSwitched: false;
  productionTradingReady: false;

  safetyLabels: string[];
}

export interface BuildOwner4966DecisionGateContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-02T00:00:00.000Z";

const APPROVAL_PHRASE_REQUIRED_ELEMENTS: string[] = [
  "read-only 唯讀（不下單、不寫 DB）",
  "manual-refresh-only（僅手動刷新，預設 page load 不 fetch）",
  "approved provider only（僅 TWSE_TPEX、approved channel）",
  "不切正式持倉 portfolio API、不接 Supabase、不接 broker",
  "不自動交易、不自動下單、不切 production data switch",
];

// The exact phrase the owner must provide (kept free of runtime path/token literals).
const OWNER_APPROVAL_REQUIRED_PHRASE =
  "我同意 4966 譜瑞進入 read-only manual-refresh MVP，僅限 approved provider TWSE_TPEX、" +
  "manual-refresh-only、read-only、預設不 fetch，不切正式持倉 portfolio API、不接 Supabase、" +
  "不接 broker、不下單、不自動交易。";

// Template ONLY — providing this text here is NOT an approval (templateIsApproval=false).
const APPROVAL_TEXT_TEMPLATE =
  "[APPROVAL TEMPLATE — NOT YET APPROVED]\n" +
  "approvedBy: Allen owner\n" +
  "approvedAtIso: <填入核准時間>\n" +
  "decision: approved\n" +
  "statement: " + OWNER_APPROVAL_REQUIRED_PHRASE + "\n" +
  "（此為模板，尚未核准；填入並由 owner 明確提供後才生效。）";

const STATE_TRANSITIONS: Owner4966StateTransition[] = [
  {
    from: "pending_owner_approval",
    to: "approved",
    requiresZh:
      "owner 明確提供核准句（含全部 approvalPhraseRequiredElements 安全邊界元素）；ownerApprovalReceived=true。",
  },
  {
    from: "pending_owner_approval",
    to: "rejected",
    requiresZh: "owner 明確拒絕，或安全邊界元素不齊；維持不擴充、4966 不進 approvedLiveFetchSymbols。",
  },
  {
    from: "approved",
    to: "approved",
    requiresZh:
      "核准後仍需完成 channel verification + per-symbol validator + manual smoke + production endpoint evidence，才可將 4966 加入 approvedLiveFetchSymbols（仍 read-only、manual-refresh-only）。",
  },
];

const PRECONDITIONS_FOR_NEXT_VERSION: string[] = [
  "owner approval received（Allen 明確書面核准句，含全部安全邊界元素）",
  "channel verification（逐檔驗證 tse_/otc_ 前綴，channelVerified=true 後才成為 approvedChannel）",
  "per-symbol standalone validator（4966 專屬，不納入 safety-chain）",
  "manual smoke evidence（實測 LIVE_FETCH_OK，或如實記錄 fallback / timeout / source_error）",
  "production endpoint evidence（production URL 實跑並記錄 actual response）",
];

const POST_APPROVAL_REMAINING_REQUIREMENTS: string[] = [
  "核准 ≠ 立即 live fetch：仍需 channel verification 才能填 approvedChannel。",
  "核准 ≠ 立即加入 approvedLiveFetchSymbols：仍需 per-symbol validator + smoke + production evidence。",
  "核准後仍維持 read-only、manual-refresh-only、預設 page load 不 fetch。",
  "核准後仍不切正式持倉 portfolio API、不接 Supabase、不接 broker、不下單、不自動交易。",
];

/**
 * Builds the fixture-only 4966 owner approval decision gate. Reads no clock / env / network.
 * The gate evaluation reflects the CURRENT no-approval state: still pending, next version
 * locked. It never flips approvalStatus, approvalDate, or approvedChannel.
 */
export function buildOwner4966DecisionGateContract(
  input: BuildOwner4966DecisionGateContractInput = {},
): Owner4966DecisionGateContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  return {
    gateVersion: "V1",
    generatedAt,
    symbol: "4966",
    nameZh: "譜瑞",
    currentApprovalStatus: "pending_owner_approval",
    ownerApprovalReceived: false,
    approvalDate: null,
    approvedChannel: null,
    inApprovedLiveFetchSymbols: false,
    currentApprovedState: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols: ["3019"],
      approvedChannels: ["tse_3019.tw"],
    },
    decisionStates: ["pending_owner_approval", "approved", "rejected"],
    stateTransitions: STATE_TRANSITIONS,
    ownerApprovalRequiredPhrase: OWNER_APPROVAL_REQUIRED_PHRASE,
    approvalPhraseRequiredElements: APPROVAL_PHRASE_REQUIRED_ELEMENTS,
    approvalTextTemplate: APPROVAL_TEXT_TEMPLATE,
    templateIsApproval: false,
    gateEvaluation: {
      ownerApprovalReceived: false,
      allSafetyElementsPresent: false,
      resultingStatus: "pending_owner_approval",
      nextVersionUnlocked: false,
      reasonZh:
        "尚未收到 Allen owner 書面核准句；approvalStatus 維持 pending_owner_approval，approvalDate/approvedChannel 未填，nextVersion 未解鎖。",
    },
    preconditionsForNextVersion: PRECONDITIONS_FOR_NEXT_VERSION,
    postApprovalRemainingRequirements: POST_APPROVAL_REMAINING_REQUIREMENTS,
    nextVersion: "4966 Read-Only Manual-Refresh MVP",
    nextVersionUnlocked: false,
    approvalStatusChangedToApproved: false,
    approvalDateFilled: false,
    approvedChannelFilled: false,
    liveFetchSymbolAdded: false,
    approvedSetExpanded: false,
    newRuntimeChannelAdded: false,
    endpointCreatedFor4966: false,
    warRoomButtonCreatedFor4966: false,
    smokeExecutedFor4966: false,
    productionEndpointCalledFor4966: false,
    realNetworkUsed: false,
    supabaseConnected: false,
    envReadPerformed: false,
    databaseWritePerformed: false,
    brokerConnected: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,
    productionDataSwitched: false,
    productionTradingReady: false,
    safetyLabels: [
      "4966 Owner Approval Decision Gate",
      "owner approval decision gate, not an approval",
      "approval text is a TEMPLATE only (templateIsApproval=false)",
      "4966 stays pending_owner_approval; approvalDate null; approvedChannel null",
      "4966 NOT in approvedLiveFetchSymbols; approvedLiveFetchSymbols remain exactly [3019]",
      "no 4966 endpoint, no War Room button, no smoke, no production endpoint call",
      "approval requires an explicit owner phrase containing all safety-boundary elements",
      "even after approval: channel verification + per-symbol validator + smoke + production evidence still required",
      "no new provider, no Yahoo, no new runtime channel",
      "no Supabase, no env read, no DB write, no API route, no broker, no order",
      "no buy/sell command, no auto order, no production data switch, not production trading ready",
      "使用者可見 UI 一律繁體中文",
    ],
  };
}
