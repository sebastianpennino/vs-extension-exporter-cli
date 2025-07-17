import { execSync } from "child_process";
import { log } from "../utils/utilities.ts";

export function listExtensions(quiet = false): void {
  try {
    const extensionsWithVersions = execSync("code --list-extensions --show-versions", { encoding: "utf-8" })
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [id, version] = line.split("@");
        return { id, version };
      });
    log("📋 List installed extensions:", quiet);
    extensionsWithVersions.forEach(ext => {
      log(`- ${ext.id}@${ext.version}`, quiet);
    });
    log(`Total: ${extensionsWithVersions.length} extensions`, quiet);
  } catch (error) {
    console.error("❌ Failed to list extensions");
    process.exit(1);
  }
} 