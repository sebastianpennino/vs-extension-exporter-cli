import fs from "fs";
import { execSync } from "child_process";
import { log } from "../utils/utilities.ts";

function installExtension(ext: string, quiet = false, dryRun = false): void {
  const [id, version] = ext.split("@");
  try {
    if (dryRun) {
      log(`[DRY RUN] Would install ${id}@${version}`, quiet);
      return;
    }
    log(`Installing ${id}@${version}...`, quiet);
    execSync(`code --install-extension ${id}@${version}`, { stdio: "inherit" });
  } catch (err) {
    console.warn(`⚠️ Failed to install ${id}@${version}`);
  }
}

function installExtensionAsync(ext: string, quiet = false, dryRun = false): Promise<void> {
  return new Promise((resolve) => {
    installExtension(ext, quiet, dryRun);
    resolve();
  });
}

async function importExtensionsWithConcurrency(extensions: string[], concurrency = 3, quiet = false, dryRun = false): Promise<void> {
  const chunks: string[][] = [];
  for (let i = 0; i < extensions.length; i += concurrency) {
    chunks.push(extensions.slice(i, i + concurrency));
  }
  log(`[<] Importing ${extensions.length} extensions...`, quiet);
  let completed = 0;
  for (const chunk of chunks) {
    await Promise.all(chunk.map(ext => {
      completed++;
      log(`[${completed}/${extensions.length}] Processing extension...`, quiet);
      return installExtensionAsync(ext, quiet, dryRun);
    }));
  }
}

export async function importExtensions(filename: string, quiet = false, dryRun = false): Promise<void> {
  const filePath = filename;
  if (!fs.existsSync(filePath)) {
    const msg = `❌ File not found: ${filePath}`;
    console.error(msg);
    throw new Error(msg);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  let extensions: string[];
  try {
    extensions = JSON.parse(raw);
  } catch {
    const msg = "❌ Invalid JSON file.";
    console.error(msg);
    throw new Error(msg);
  }
  await importExtensionsWithConcurrency(extensions, 3, quiet, dryRun);
  log("✅ Import complete", quiet);
} 