import { importExtensions } from "../commands/importExtensions.ts";
import fs from "fs";

async function testImportInvalidFile() {
  let errorCaught = false;
  try {
    await importExtensions("nonexistent.json", true, true);
  } catch {
    errorCaught = true;
  }
  if (!errorCaught) throw new Error("Should throw on nonexistent file");
  console.log("✓ testImportInvalidFile passed");
}

export async function runImportExtensionsTests() {
  await testImportInvalidFile();
} 