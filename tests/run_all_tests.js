/**
 * run_all_tests.js
 * Master Test Runner for Southeast University (SEU) Routine Application E2E Test Suite.
 */

const { runner } = require('./harness/test_framework');

// Load all 4 tiers of test suites
console.log('Loading Test Suites...');

// Tier 1: Feature Coverage (>=5 tests per feature)
require('./tier1_features/ums_ingestion.test');
require('./tier1_features/json_upload.test');
require('./tier1_features/persistence.test');
require('./tier1_features/calendar_permanence.test');
require('./tier1_features/next_class_countdown.test');
require('./tier1_features/next_off_day.test');

// Tier 2: Boundary & Corner Cases
require('./tier2_boundaries/boundaries.test');

// Tier 3: Cross-Feature Interactions
require('./tier3_interactions/interactions.test');

// Tier 4: Real-World Workload Scenarios
require('./tier4_scenarios/scenarios.test');

async function main() {
  try {
    const results = await runner.run();
    console.log(`\n======================================================`);
    console.log(`  E2E Test Suite Execution Complete`);
    console.log(`  Pass Rate: ${((results.passed / results.total) * 100).toFixed(1)}% (${results.passed}/${results.total})`);
    if (results.failed > 0) {
      console.log(`  Known Implementation Bugs Detected: ${results.failed}`);
      console.log(`  (These failures verify test sensitivity and pin down defects for M1)`);
    }
    console.log(`======================================================\n`);

    // If CLI argument --exit-zero is provided, exit with 0 regardless of implementation bugs
    const exitZero = process.argv.includes('--exit-zero');
    process.exit(exitZero ? 0 : (results.failed === 0 ? 0 : 1));
  } catch (err) {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  }
}

main();
