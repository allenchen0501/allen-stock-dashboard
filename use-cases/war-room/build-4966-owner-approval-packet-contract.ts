/**
 * 4966 Owner Approval Packet Contract — FIXTURE-ONLY / SPEC-ONLY.
 *
 * A pure, deterministic packet that PREPARES 4966 (譜瑞) to become the next read-only
 * manual-refresh candidate. It approves NOTHING and expands NOTHING: 4966 stays
 * `candidate_only` / `pending_owner_approval`, its approvedChannel is null (proposed
 * channel is unverified), it is NOT in approvedLiveFetchSymbols, it has NO live-fetch
 * endpoint, and NO War Room manual-refresh button. Only 3019 remains approved.
 *
 * 定位：owner approval packet / channel verification preparation / fixture-only governance
 * prep。不是正式核准 4966、不是把 4966 加入 approvedLiveFetchSymbols、不是開第二檔 live fetch、
 * 不是交易訊號、不是買賣建議、不是下單、不是自動交易。後續仍需 Allen owner 明確核准，才能進入
 * 下一版「4966 Read-Only Manual-Refresh MVP」。
 *
 * PURE: NO fetch, NO real network, NO Supabase, NO env read, NO DB write, NO API route, NO
 * broker, NO buy/sell command, NO auto order, NO production data switch, NO smoke run, NO
 * production endpoint call. The proposed channel below is a SPEC value only and must NEVER
 * be copied into the provider, the route, the MVP contract, the dashboard, or the runtime
 * approved set until 4966 clears every owner-approval + evidence gate.
 *
 * See: docs/4966-owner-approval-packet.md, docs/4966-channel-verification-prep.md
 */

export type Ohlc4966FutureCase = {
  caseId: "A" | "B" | "C" | "D";
  request: string;
  expectedBehaviorZh: string;
  executed: false;
};

export interface Owner4966ApprovalRecordSchema {
  // Schema ONLY — describes what a future owner-approval record must contain. It is NOT a
  // populated approval; recordPopulated stays false and ownerApproved stays false.
  requiredFields: string[];
  recordPopulated: false;
  ownerApproved: false;
  descriptionZh: string;
}

export interface Owner4966ApprovalPacketContract {
  packetVersion: "V1";
  generatedAt: string;

  symbol: "4966";
  nameZh: "譜瑞";

  candidateStatus: "candidate_only";
  approvalStatus: "pending_owner_approval";
  ownerApproved: false;

  // Channel is NOT approved yet. approvedChannel is null; the proposed channel is unverified.
  approvedChannel: null;
  proposedChannel: string;
  channelVerified: false;
  channelStatus: "proposed_unverified";

  inApprovedLiveFetchSymbols: false;
  hasLiveFetchEndpoint: false;
  hasWarRoomManualRefreshButton: false;
  manualSmokeExecuted: false;
  productionEndpointTested: false;

  currentApprovedState: {
    approvedProvider: "TWSE_TPEX";
    approvedLiveFetchSymbols: string[];
    approvedChannels: string[];
  };

  requiredEvidenceChecklist: string[];
  futureManualSmokePlan: { plannedOnly: true; executed: false; descriptionZh: string; steps: string[] };
  futureProductionEndpointCases: Ohlc4966FutureCase[];
  ownerApprovalRecordSchema: Owner4966ApprovalRecordSchema;
  ownerApprovalRequiredStatementZh: string;
  nextVersion: string;

  // Red-line flags (all false / locked). This packet approves and expands NOTHING.
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

export interface BuildOwner4966ApprovalPacketContractInput {
  generatedAt?: string;
}

const DEFAULT_GENERATED_AT = "2026-07-02T00:00:00.000Z";

const REQUIRED_EVIDENCE_CHECKLIST: string[] = [
  "owner approval（Allen 明確書面核准 4966 進入唯讀擴充流程）",
  "channel verification（逐檔驗證 tse_/otc_ 前綴，channelVerified=true 後才成為 approvedChannel）",
  "per-symbol standalone validator（4966 專屬，不納入 safety-chain）",
  "manual-refresh-only endpoint 行為（預設 page load 不 fetch）",
  "read-only（不下單、不寫 DB、不切 production）",
  "non-approved rejection case（他檔 symbol 被拒且不 fetch）",
  "missing mode / auto mode rejection case（缺 mode / mode=auto 被拒且不 fetch）",
  "manual smoke evidence（實測 LIVE_FETCH_OK，或如實記錄 fallback / timeout / source_error）",
  "production endpoint evidence（production URL 實跑並記錄 actual response）",
  "全部完成且 owner 核准後，才可將 4966 加入 approvedLiveFetchSymbols（未完成不得加入）",
];

const FUTURE_SMOKE_STEPS: string[] = [
  "步驟一：owner 核准後，於本機以 approved provider 對 4966 執行一次唯讀 dry-run（GET only、timeout 3000ms、maxRetries 0）。",
  "步驟二：記錄 outcome（LIVE_FETCH_OK 或 fallback / timeout / source_error），不假造價格（price 不可得則為 null）。",
  "步驟三：標示為 manual smoke，不納入 safety-chain。",
];

const FUTURE_ENDPOINT_CASES: Ohlc4966FutureCase[] = [
  { caseId: "A", request: "GET /api/war-room/approved-live-quote?symbol=4966&mode=manual", expectedBehaviorZh: "核准後：read-only fetch（live_verified 或如實 fallback）；核准前不得建立此路徑。", executed: false },
  { caseId: "B", request: "GET /api/war-room/approved-live-quote?symbol=<其他>&mode=manual", expectedBehaviorZh: "non-approved symbol → rejected without fetch。", executed: false },
  { caseId: "C", request: "GET /api/war-room/approved-live-quote?symbol=4966", expectedBehaviorZh: "缺 mode → rejected without fetch。", executed: false },
  { caseId: "D", request: "GET /api/war-room/approved-live-quote?symbol=4966&mode=auto", expectedBehaviorZh: "mode=auto → rejected without fetch。", executed: false },
];

/**
 * Builds the fixture-only 4966 owner approval packet. Reads no clock / env / network. The
 * current runtime approved set is stated as exactly ["3019"]; 4966 stays candidate-only.
 */
export function buildOwner4966ApprovalPacketContract(
  input: BuildOwner4966ApprovalPacketContractInput = {},
): Owner4966ApprovalPacketContract {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  return {
    packetVersion: "V1",
    generatedAt,
    symbol: "4966",
    nameZh: "譜瑞",
    candidateStatus: "candidate_only",
    approvalStatus: "pending_owner_approval",
    ownerApproved: false,
    approvedChannel: null,
    proposedChannel: "tse_4966.tw",
    channelVerified: false,
    channelStatus: "proposed_unverified",
    inApprovedLiveFetchSymbols: false,
    hasLiveFetchEndpoint: false,
    hasWarRoomManualRefreshButton: false,
    manualSmokeExecuted: false,
    productionEndpointTested: false,
    currentApprovedState: {
      approvedProvider: "TWSE_TPEX",
      approvedLiveFetchSymbols: ["3019"],
      approvedChannels: ["tse_3019.tw"],
    },
    requiredEvidenceChecklist: REQUIRED_EVIDENCE_CHECKLIST,
    futureManualSmokePlan: {
      plannedOnly: true,
      executed: false,
      descriptionZh: "future manual smoke plan（僅規劃，本版不執行 smoke、不打 4966 真實行情）。",
      steps: FUTURE_SMOKE_STEPS,
    },
    futureProductionEndpointCases: FUTURE_ENDPOINT_CASES,
    ownerApprovalRecordSchema: {
      requiredFields: [
        "approvedSymbol（= 4966）",
        "approvedChannel（channelVerified 後填入，例如 tse_4966.tw）",
        "approvedBy（Allen owner）",
        "approvedAtIso（核准時間）",
        "decision（approved / rejected）",
        "scope（read-only、manual-refresh-only）",
        "evidenceRefs（manual smoke + production endpoint evidence 連結）",
      ],
      recordPopulated: false,
      ownerApproved: false,
      descriptionZh: "owner approval record schema（僅定義結構，本版尚未填入、尚未核准）。",
    },
    ownerApprovalRequiredStatementZh:
      "需 Allen owner 明確書面核准：『我同意 4966 譜瑞進入 read-only manual-refresh 唯讀擴充流程，僅限 approved provider、manual-refresh-only、read-only，不切 /api/portfolio、不下單、不自動交易。』核准前 4966 一律維持 candidate_only。",
    nextVersion: "4966 Read-Only Manual-Refresh MVP",
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
      "4966 Owner Approval Packet",
      "owner approval packet + channel verification preparation, not an approval",
      "4966 stays candidate_only / pending_owner_approval / not approved",
      "approvedChannel is null; proposed channel is unverified spec-only",
      "4966 NOT in approvedLiveFetchSymbols; approvedLiveFetchSymbols remain exactly [3019]",
      "no 4966 live-fetch endpoint, no 4966 War Room manual-refresh button",
      "no smoke executed, no production endpoint called for 4966 this version",
      "no new provider, no Yahoo, no new runtime channel",
      "no Supabase, no env read, no DB write, no API route, no broker, no order",
      "no buy/sell command, no auto order, no production data switch, not production trading ready",
      "requires explicit Allen owner approval before the next version (4966 Read-Only Manual-Refresh MVP)",
      "使用者可見 UI 一律繁體中文",
    ],
  };
}
