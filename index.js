#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const OUTPUT_DIR = path.join(__dirname, "output");

const COMMANDS = {
  EXPORT: "export",
  IMPORT: "import",
  LIST: "list"
};

/** Utility - Yes/No */
function promptYesNo(question) {
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
function validateFilename(filename) {
  // Basic validation to prevent directory traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    console.error("❌ Invalid filename");
    process.exit(1);
  }
  return filename;
}

/** Utility - Basic logger */
function log(message, quiet) {
  if (!quiet) {
    console.log(message);
  }
}

async function exportExtensions(filename, exact = false, quiet = false, dryRun = false) {
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

  let raw;

  try {
    raw = execSync("code --list-extensions --show-versions", { encoding: "utf-8" })
      .split("\n")
      .filter(Boolean)
      .map(line => {
        const [id, version] = line.split("@");
        return { id, version };
      });
  } catch (error) {
    console.error("❌ Failed to list extensions. Is VS Code installed and in your PATH?");
    console.error(error.message);
    process.exit(1);
  }

  const disabledRaw = execSync("code --list-extensions --disabled", { encoding: "utf-8" })
    .split("\n")
    .filter(Boolean);
  const disabledSet = new Set(disabledRaw);

  const final = exact
    ? raw.map(ext => ({
      id: ext.id,
      version: ext.version,
      disabled: disabledSet.has(ext.id)
    }))
    : raw.map(ext => ext.id);

  if (dryRun) {
    log(`[DRY RUN] Would export ${raw.length} extensions to ${filePath}`, quiet);
  } else {
    fs.writeFileSync(filePath, JSON.stringify(final, null, 2));
    log(`✅ Exported ${raw.length} extensions to ${filePath}`, quiet);
  }
}

function installExtension(ext, quiet = false, dryRun = false) {
  const id = typeof ext === "string" ? ext : ext.id;
  const version = typeof ext === "string" ? null : ext.version;
  const disabled = typeof ext === "string" ? false : ext.disabled;

  try {
    if (dryRun) {
      log(`[DRY RUN] Would install ${id}${version ? `@${version}` : ''}`, quiet);
      if (disabled) {
        log(`[DRY RUN] Would disable ${id}`, quiet);
      }
      return;
    }

    if (version) {
      log(`Installing ${id}@${version}...`, quiet);
      execSync(`code --install-extension ${id}@${version}`, { stdio: "inherit" });
    } else {
      log(`Installing ${id}...`, quiet);
      execSync(`code --install-extension ${id}`, { stdio: "inherit" });
    }

    if (disabled) {
      log(`🚫 Disabling ${id}...`, quiet);
      execSync(`code --disable-extension ${id}`, { stdio: "inherit" });
    }
  } catch (err) {
    console.warn(`⚠️ Failed to install ${id}`);
  }
}

function installExtensionAsync(ext, quiet = false, dryRun = false) {
  return new Promise((resolve) => {
    installExtension(ext, quiet, dryRun);
    resolve();
  });
}

async function importExtensionsWithConcurrency(extensions, concurrency = 3, quiet = false, dryRun = false) {
  const chunks = [];
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

async function importExtensions(filename, quiet = false, dryRun = false) {
  const filePath = path.join(OUTPUT_DIR, filename);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let extensions;

  try {
    extensions = JSON.parse(raw);
  } catch {
    console.error("❌ Invalid JSON file.");
    process.exit(1);
  }

  await importExtensionsWithConcurrency(extensions, 3, quiet, dryRun);
  log("✅ Import complete", quiet);
}

function listExtensions(quiet = false) {
  try {
    const extensions = execSync("code --list-extensions", { encoding: "utf-8" })
      .split("\n")
      .filter(Boolean);
    
    log("📋 List installed extensions:", quiet);
    extensions.forEach(ext => log(`- ${ext}`, quiet));
    log(`Total: ${extensions.length} extensions`, quiet);
  } catch (error) {
    console.error("❌ Failed to list extensions");
    process.exit(1);
  }
}

function loadConfig() {
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.vscode-ext-config.json');

  if (fs.existsSync(configPath)) {
    try {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.warn("❌ Invalid config file, using defaults");
    }
  }
  return {};
}

function showHelp() {
  console.log("VS Code Extension Manager");
  console.log("=======================\n");
  console.log("Commands:");
  console.log("  export [filename] [--exact]  Export extensions to a JSON file");
  console.log("  import <filename>            Import extensions from a JSON file");
  console.log("  list                         List currently installed extensions");
  console.log("\nOptions:");
  console.log("  --exact    Include version numbers and disabled status");
  console.log("  --dry-run  Show what would be done without making changes");
  console.log("  --quiet    Reduce output verbosity");
}

(async () => {
  const config = loadConfig();
  const cmd = process.argv[2];
  const filename = process.argv[3];
  const exact = process.argv.includes("--exact") || config.exact;
  const quiet = process.argv.includes("--quiet") || config.quiet;
  const dryRun = process.argv.includes("--dry-run") || config.dryRun;

  if (cmd === COMMANDS.EXPORT) {
    const name = validateFilename(filename || `vscode-extensions-${Date.now()}.json`);
    await exportExtensions(name, exact, quiet, dryRun);
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
