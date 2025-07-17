import { validateFilename, log } from "../utils/utilities.ts";

function testValidateFilename() {
  let errorCaught = false;
  try {
    validateFilename("../bad.json");
  } catch {
    errorCaught = true;
  }
  if (!errorCaught) throw new Error("Should throw on invalid filename");
  console.log("✓ testValidateFilename passed");
}

function testLog() {
  log("test message", true); // Should not print
  log("test message", false); // Should print
  console.log("✓ testLog passed");
}

export function runUtilitiesTests() {
  testValidateFilename();
  testLog();
} 