import { exportExtensions } from "../commands/exportExtensions.ts";
import fs from "fs";

async function testExportCreatesFile() {
  const testFile = "test-export.json";
  if (fs.existsSync(`output/${testFile}`)) fs.unlinkSync(`output/${testFile}`);
  await exportExtensions(testFile, true, true); // dry run, should not create file
  if (fs.existsSync(`output/${testFile}`)) throw new Error("Dry run should not create file");
  console.log("✓ testExportCreatesFile (dry run) passed");
}

export async function runExportExtensionsTests() {
  await testExportCreatesFile();
} 