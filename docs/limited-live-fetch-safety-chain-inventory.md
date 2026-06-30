# Limited Live Fetch — Safety Chain Inventory Snapshot

## Purpose

- **freeze the current safety-chain inventory** — pin the exact composition, order, and
  manual-only exclusions of `npm run test:safety-chain` and the V73 CI guard CHAIN_SPECS,
  so any future change that adds, removes, reorders, or pulls a manual-only script into the
  chain is caught immediately.

## Current total checks: 21

The V73 Safety Chain CI Guard covers exactly **21** CHAIN_SPECS checks; `test:safety-chain`
runs those 21 validators in order, then the CI guard last.

## Chain scripts list (`test:safety-chain`, in order)

1. test:allen-war-room-operational-layout
2. test:allen-score-scoring-model
3. test:allen-score-deterministic-scoring-engine
4. test:structured-candidate-trade-plan
5. test:candidate-price-level-fixture-source
6. test:descriptor-to-real-quote-mapping
7. test:authorized-real-quote-field-catalog
8. test:real-quote-source-conflict-resolution-policy
9. test:conflict-to-trade-plan-verification
10. test:downgraded-trade-plan-ui-behavior
11. test:unified-connection-evidence-ledger
12. test:evidence-ledger-transition
13. test:ledger-integrity-rollup
14. test:phase-2-locked-implementation
15. test:phase-2b-shadow-comparison-ui-shell
16. test:staging-shadow-runtime-scaffold
17. test:limited-live-fetch-dry-run-pr-scope
18. test:limited-live-fetch-dry-run-implementation
19. test:limited-live-fetch-golden-snapshot
20. test:limited-live-fetch-mock-fetch-boundary
21. test:limited-live-fetch-default-no-fetch-boundary

…then **test:safety-chain-ci-guard** runs last (the guard, not a CHAIN_SPECS entry).

## Chain specs list (CHAIN_SPECS sourceScripts)

Identical to the 21 chain scripts above, in the same order.

## In-chain validators (limited live fetch)

- **golden snapshot** — `test:limited-live-fetch-golden-snapshot`
- **mock fetch boundary** — `test:limited-live-fetch-mock-fetch-boundary`
- **default no-fetch boundary** — `test:limited-live-fetch-default-no-fetch-boundary`

(plus `test:limited-live-fetch-dry-run-pr-scope` and `test:limited-live-fetch-dry-run-implementation`.)

## Standalone validators (NOT in safety-chain)

- **manual smoke** — `smoke:limited-live-fetch:3019`（manual only，永不納入）
- **observation round 1** — `test:limited-live-fetch-3019-observation-round-1`
- **observation round 2** — `test:limited-live-fetch-3019-observation-round-2`
- **deterministic clock** — `test:limited-live-fetch-deterministic-clock`
- **inventory snapshot itself** — `test:limited-live-fetch-safety-chain-inventory`

## Guarantees

- no real network
- no smoke（不執行、不納入 chain）
- no provider runtime modification
- no provider expansion
- no new symbol（仍只 3019）
- no Yahoo
- no API route
- no /api/portfolio switch
- no Supabase
- no process.env
- no broker API
- no trading signal
- no auto order
- not production ready
- approved channel tse_3019.tw、timeoutMs=3000、maxRetries=0、GET only、dryRunLiveFetch default=false

## Safety chain placement

- **inventory validator remains standalone initially** —
  `test:limited-live-fetch-safety-chain-inventory` is NOT added to
  `npm run test:safety-chain`. It is a meta-guard run manually / separately.
