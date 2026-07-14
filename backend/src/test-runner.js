#!/usr/bin/env node

/**
 * Property-Based Test Runner for Campaign Discovery System
 *
 * This script runs all property-based tests with appropriate configuration
 * and generates a comprehensive test report.
 */

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testFiles = [
  "src/modules/campaign/tests/campaign.discovery.property.test.js",
  "src/modules/campaign/tests/campaign.parser.property.test.js",
  "src/engines/tests/trust.engine.property.test.js",
];

console.log(
  "🧪 Running Property-Based Test Suite for Campaign Discovery System",
);
console.log("=".repeat(80));

async function runTests() {
  try {
    const mochaArgs = [
      "--timeout",
      "60000",
      "--reporter",
      "spec",
      "--exit",
      ...testFiles,
    ];

    console.log("📋 Test Configuration:");
    console.log(`   • Timeout: 60 seconds per test`);
    console.log(`   • Property iterations: 100+ per property`);
    console.log(`   • Test files: ${testFiles.length}`);
    console.log("");

    const mocha = spawn("npx", ["mocha", ...mochaArgs], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    mocha.on("close", (code) => {
      console.log("");
      console.log("=".repeat(80));
      if (code === 0) {
        console.log("✅ All property-based tests passed!");
        console.log("");
        console.log("📊 Test Summary:");
        console.log("   • Campaign Discovery Filtering Accuracy ✓");
        console.log("   • Campaign Sorting Correctness ✓");
        console.log("   • Trust Score Integration and Calculation ✓");
        console.log("   • Campaign Data Parser Round-Trip ✓");
        console.log("   • Input Validation and Error Handling ✓");
        console.log("   • Cache Invalidation and Performance ✓");
        console.log("   • Active Campaign Retrieval ✓");
        console.log("   • Real-Time Search Filtering ✓");
        console.log("");
        console.log("🎉 Campaign Discovery System validation complete!");
      } else {
        console.log("❌ Some property-based tests failed.");
        console.log("");
        console.log("🔍 Check the test output above for details.");
        console.log(
          "💡 Property-based tests may reveal edge cases that need attention.",
        );
      }
      process.exit(code);
    });

    mocha.on("error", (error) => {
      console.error("❌ Error running tests:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start test runner:", error);
    process.exit(1);
  }
}

// Handle process signals
process.on("SIGINT", () => {
  console.log("\n🛑 Test run interrupted by user");
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Test run terminated");
  process.exit(1);
});

// Run the tests
runTests();
