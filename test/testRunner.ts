import { runExportExtensionsTests } from "./exportExtensions.test.ts";
import { runImportExtensionsTests } from "./importExtensions.test.ts";
import { runListExtensionsTests } from "./listExtensions.test.ts";
import { runUtilitiesTests } from "./utilities.test.ts";

async function runAllTests() {
  try {
    await runExportExtensionsTests();
    await runImportExtensionsTests();
    runListExtensionsTests();
    runUtilitiesTests();
    console.log("\nAll tests passed!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runAllTests(); 