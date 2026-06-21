const { runPortfolioShadowValidationSuite } = require(
  "../use-cases/portfolio/shadow-runner",
) as typeof import("../use-cases/portfolio/shadow-runner");

const suite = runPortfolioShadowValidationSuite();
const decisionContractPassed = suite.results.every(
  (result) =>
    result.decision_allowed ===
    (result.status === "PASS" && result.summary.expectation_met),
);
const testPassed = suite.suite_passed && decisionContractPassed;

console.log("Portfolio Shadow Test");
console.table(
  suite.results.map((result) => ({
    scenario: result.summary.scenario,
    expected: result.summary.expected_status,
    actual: result.status,
    decision_allowed: result.decision_allowed,
    issues: result.issues.length,
    matched: result.summary.expectation_met,
  })),
);
console.log(
  `Scenarios: ${suite.matched_expectations}/${suite.total_scenarios} matched`,
);
console.log(`Decision contract: ${decisionContractPassed ? "PASS" : "FAIL"}`);
console.log(`Suite: ${testPassed ? "PASS" : "FAIL"}`);

if (!testPassed) {
  console.error("Portfolio Shadow Test failed. V3-5 switch is blocked.");
  process.exit(1);
}

console.log("Portfolio Shadow Test passed. V3-5 rollout review may continue.");
process.exit(0);
