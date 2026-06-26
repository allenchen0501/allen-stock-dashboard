/**
 * Staging Supabase RLS Manual Matrix Contract Builder — V45
 *
 * Pure builder. Returns a deterministic staging Supabase RLS manual verification
 * matrix bundle (5 tables x 4 roles x 4 operations = 80 items). Default decision
 * is READY_FOR_REVIEW: the matrix is defined but not yet manually verified, and
 * every write access expectation is DENY.
 *
 * This is NOT a runtime and connects to NOTHING. Constraints:
 *   - No HTTP request (no fetch / axios)
 *   - No Supabase connection / no @supabase import / no client creation
 *   - No env key reads (no process.env)
 *   - No clock reads (no Date.now / no new Date — generatedAt is passed in or a
 *     fixed deterministic string)
 *   - No data writes (no staging write, no production write)
 *   - No buy/sell commands; no auto orders
 */

import {
  STAGING_SUPABASE_RLS_MANUAL_MATRIX_OPERATIONS,
  STAGING_SUPABASE_RLS_MANUAL_MATRIX_ROLES,
  STAGING_SUPABASE_RLS_MANUAL_MATRIX_SAFETY_LABELS,
  STAGING_SUPABASE_RLS_MANUAL_MATRIX_TABLES,
} from "./staging-supabase-rls-manual-matrix-contract";
import type {
  StagingSupabaseRlsDecision,
  StagingSupabaseRlsExpectedAccess,
  StagingSupabaseRlsManualCheck,
  StagingSupabaseRlsManualMatrixBundle,
  StagingSupabaseRlsMatrixItem,
  StagingSupabaseRlsOperation,
  StagingSupabaseRlsPolicyRule,
  StagingSupabaseRlsRole,
} from "./staging-supabase-rls-manual-matrix-contract";

const DEFAULT_GENERATED_AT = "2026-06-23T00:00:00.000Z";

export interface BuildStagingSupabaseRlsManualMatrixContractInput {
  generatedAt?: string;
}

const WRITE_OPERATIONS: readonly StagingSupabaseRlsOperation[] = ["insert", "update", "delete"];

function isWrite(operation: StagingSupabaseRlsOperation): boolean {
  return WRITE_OPERATIONS.includes(operation);
}

/**
 * Deterministic expected access for a (role, operation) pair.
 *
 * - anon: everything DENY.
 * - authenticated / dashboard_readonly_app: select = ALLOW_READ_ONLY, writes DENY.
 * - service_role: never used by the app runtime — NOT_ALLOWED_IN_APP_RUNTIME.
 */
function expectedAccessFor(
  role: StagingSupabaseRlsRole,
  operation: StagingSupabaseRlsOperation,
): StagingSupabaseRlsExpectedAccess {
  if (role === "service_role") return "NOT_ALLOWED_IN_APP_RUNTIME";
  if (role === "anon") return "DENY";
  // authenticated + dashboard_readonly_app
  if (operation === "select") return "ALLOW_READ_ONLY";
  return "DENY";
}

function notesFor(
  role: StagingSupabaseRlsRole,
  operation: StagingSupabaseRlsOperation,
  expectedAccess: StagingSupabaseRlsExpectedAccess,
): string {
  if (role === "service_role") {
    return "service_role 不得被 app runtime 使用；僅限受控的後台作業。";
  }
  if (expectedAccess === "ALLOW_READ_ONLY") {
    return "僅允許 read-only select；using (true) 與 public read/write 一律 NO_GO / BLOCKED。";
  }
  return `${role} 對 ${operation} 必須 DENY；using (true) 與 public read/write 一律 NO_GO / BLOCKED。`;
}

/**
 * Builds a deterministic staging Supabase RLS manual matrix bundle. All
 * timestamps come from `input.generatedAt` (or a fixed fallback string); no
 * clock is read.
 */
export function buildStagingSupabaseRlsManualMatrixContract(
  input: BuildStagingSupabaseRlsManualMatrixContractInput = {},
): StagingSupabaseRlsManualMatrixBundle {
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;

  const tables = [...STAGING_SUPABASE_RLS_MANUAL_MATRIX_TABLES];
  const roles = [...STAGING_SUPABASE_RLS_MANUAL_MATRIX_ROLES];
  const operations = [...STAGING_SUPABASE_RLS_MANUAL_MATRIX_OPERATIONS];

  const matrixItems: StagingSupabaseRlsMatrixItem[] = [];
  for (const tableName of tables) {
    for (const role of roles) {
      for (const operation of operations) {
        const expectedAccess = expectedAccessFor(role, operation);
        matrixItems.push({
          tableName,
          role,
          operation,
          expectedAccess,
          actualAccess: "NOT_TESTED",
          verificationStatus: "NOT_REVIEWED",
          // Every RLS expectation is release-blocking if violated.
          blocksRelease: true,
          notes: notesFor(role, operation, expectedAccess),
        });
      }
    }
  }

  // Deterministic decision: any write that is not DENY → NO_GO. Manual
  // verification not yet done → never GO / PRODUCTION_READY (READY_FOR_REVIEW).
  const anyWriteNotDenied = matrixItems.some(
    (item) => isWrite(item.operation) && item.role !== "service_role" && item.expectedAccess !== "DENY",
  );
  const stagingRlsManuallyVerified = false as const;
  const decision: StagingSupabaseRlsDecision = anyWriteNotDenied ? "NO_GO" : "READY_FOR_REVIEW";

  const policyRules: StagingSupabaseRlsPolicyRule[] = [
    { ruleId: "anon-deny-all", description: "anon 對所有 table 的 select / insert / update / delete 都必須 DENY。", blocksReleaseOnViolation: true },
    { ruleId: "authenticated-read-only", description: "authenticated 最多只能 select = ALLOW_READ_ONLY；insert / update / delete 必須 DENY。", blocksReleaseOnViolation: true },
    { ruleId: "dashboard-readonly-app-read-only", description: "dashboard_readonly_app 最多只能 select = ALLOW_READ_ONLY；insert / update / delete 必須 DENY。", blocksReleaseOnViolation: true },
    { ruleId: "service-role-restricted", description: "service_role 必須 SERVICE_ROLE_ONLY 或 NOT_ALLOWED_IN_APP_RUNTIME；不得被 app runtime 使用。", blocksReleaseOnViolation: true },
    { ruleId: "no-using-true", description: "using (true) 這類寬鬆 policy 必須標示 NO_GO / BLOCKED。", blocksReleaseOnViolation: true },
    { ruleId: "no-public-read-write", description: "public read/write 必須標示 NO_GO / BLOCKED。", blocksReleaseOnViolation: true },
    { ruleId: "write-must-deny", description: "若任何 write access 不是 DENY，decision 必須 NO_GO。", blocksReleaseOnViolation: true },
    { ruleId: "manual-verify-required", description: "若 stagingRlsManuallyVerified = false，decision 不得是 GO 或 PRODUCTION_READY。", blocksReleaseOnViolation: true },
  ];

  const manualChecks: StagingSupabaseRlsManualCheck[] = [
    { checkId: "review-anon-deny", description: "人工確認 anon 全部 operation 皆 DENY。", required: true },
    { checkId: "review-authenticated-read-only", description: "人工確認 authenticated 僅 select read-only、其餘 DENY。", required: true },
    { checkId: "review-readonly-app", description: "人工確認 dashboard_readonly_app 僅 select read-only、其餘 DENY。", required: true },
    { checkId: "review-service-role", description: "人工確認 service_role 不被 app runtime 使用。", required: true },
    { checkId: "review-no-loose-policy", description: "人工確認沒有 using (true) / public read/write 寬鬆 policy。", required: true },
  ];

  return {
    contractVersion: "V45",
    matrixName: "Staging Supabase RLS Manual Matrix",
    deploymentTarget: "staging",
    generatedAt,
    decision,

    tables,
    roles,
    operations,
    matrixItems,
    policyRules,
    manualChecks,

    stagingSupabasePlanned: true,
    stagingSupabaseConnected: false,
    stagingRlsMatrixDefined: true,
    stagingRlsManuallyVerified,
    stagingReadPerformed: false,
    stagingWritePerformed: false,
    productionSupabaseConnected: false,
    productionWritePerformed: false,
    databaseWritePerformed: false,
    requestPerformed: false,
    envReadPerformed: false,
    apiRouteCreated: false,
    uiCreated: false,
    runtimeCreated: false,
    sqlMigrationCreated: false,
    portfolioApiSwitched: false,
    realMarketDataEnabled: false,
    buySellCommandGenerated: false,
    autoOrderRequested: false,

    futureGate: "V46 Staging Supabase Read-only Connection Review / V46 Staging Supabase Schema Mapping Spec",
    safetyLabels: [...STAGING_SUPABASE_RLS_MANUAL_MATRIX_SAFETY_LABELS],
  };
}
