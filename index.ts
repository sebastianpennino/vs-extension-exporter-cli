// Converted to TypeScript
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import readline from "readline";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "output");

const COMMANDS = {
  EXPORT: "export",
  IMPORT: "import",
  LIST: "list"
} as const;

type Command = typeof COMMANDS[keyof typeof COMMANDS];

/** Utility - Yes/No */
function promptYesNo(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} (y/n): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

/** Utility - Filename validation */
function validateFilename(filename: string): string {
  if (filename.includes("..") || filename.includes("\\")) {
    console.error(`❌ Invalid filename or path "${filename}"`);
    process.exit(1);
  }
  return filename;
}

/** Utility - Basic logger */
function log(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.log(message);
  }
}

async function exportExtensions(filename: string, quiet = false, dryRun = false): Promise<void> {
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

function installExtension(ext: string, quiet = false, dryRun = false): void {
  // ext is always in the form id@version
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

async function importExtensions(filename: string, quiet = false, dryRun = false): Promise<void> {
  const filePath = filename;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let extensions: string[];

  try {
    extensions = JSON.parse(raw);
  } catch {
    console.error("❌ Invalid JSON file.");
    process.exit(1);
  }

  await importExtensionsWithConcurrency(extensions, 3, quiet, dryRun);
  log("✅ Import complete", quiet);
}

function listExtensions(quiet = false): void {
  try {
    // Get extensions with versions
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

function loadConfig(): Record<string, any> {
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE || '', '.vscode-ext-config.json');

  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn("❌ Invalid config file, using defaults");
    }
  }
  return {};
}

function showHelp(): void {
  console.log("VS Code Extension Manager");
  console.log("=======================\n");
  console.log("Commands:");
  console.log("  export [filename]         Export extensions to a JSON file (id@version format)");
  console.log("  import <filename>         Import extensions from a JSON file (id@version format)");
  console.log("  list                      List currently installed extensions with versions");
  console.log("\nOptions:");
  console.log("  --dry-run  Show what would be done without making changes");
  console.log("  --quiet    Reduce output verbosity");
}

(async () => {
  const config = loadConfig();
  const cmd = process.argv[2] as Command;
  const filename = process.argv[3];
  const quiet = process.argv.includes("--quiet") || config.quiet;
  const dryRun = process.argv.includes("--dry-run") || config.dryRun;

  if (cmd === COMMANDS.EXPORT) {
    const name = validateFilename(filename || `vscode-extensions-${Date.now()}.json`);
    await exportExtensions(name, quiet, dryRun);
  } else if (cmd === COMMANDS.IMPORT) {
    if (!filename) {
      console.error("❌ You must specify a file to import (e.g. vscode-ext import my.json)");
      process.exit(1);
    }
    await importExtensions(validateFilename(filename), quiet, dryRun);
  } else if (cmd === COMMANDS.LIST) {
    listExtensions(quiet);
  } else {
    showHelp();
    process.exit(1);
  }
})(); 