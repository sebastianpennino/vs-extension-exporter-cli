import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { promptYesNo, log } from "../utils/utilities.ts";

const OUTPUT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "../output");

export async function exportExtensions(filename: string, quiet = false, dryRun = false): Promise<void> {
  const filePath = path.join(OUTPUT_DIR, filename);

  if (!fs.existsSync(OUTPUT_DIR)) {
    if (dryRun) {
      log(`[DRY RUN] Would create directory: ${OUTPUT_DIR}`, quiet);
    } else {
      fs.mkdirSync(OUTPUT_DIR);
    }
  }

  if (fs.existsSync(filePath) && !dryRun) {
    const proceed = await promptYesNo(`⚠️ ${filename} already exists. Overwrite?`);
    if (!proceed) {
      log("❌ Export canceled.", quiet);
      process.exit(1);
    }
  }

  let raw: string[];

  try {
    raw = execSync("code --list-extensions --show-versions", { encoding: "utf-8" })
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [id, version] = line.split("@");
        return `${id}@${version}`;
      });
  } catch (error: any) {
    console.error("❌ Failed to list extensions. Is VS Code installed and in your PATH?");
    console.error(error.message);
    process.exit(1);
  }

  if (dryRun) {
    log(`[DRY RUN] Would export ${raw.length} extensions to ${filePath}`, quiet);
  } else {
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2));
    log(`✅ Exported ${raw.length} extensions to ${filePath}`, quiet);
  }
} 