#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline");

const OUTPUT_DIR = path.join(__dirname, "output");

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

async function exportExtensions(filename, exact = false) {
  const filePath = path.join(OUTPUT_DIR, filename);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  if (fs.existsSync(filePath)) {
    const proceed = await promptYesNo(`⚠️ ${filename} already exists. Overwrite?`);
    if (!proceed) {
      console.log("❌ Export canceled.");
      process.exit(1);
    }
  }

  const raw = execSync("code --list-extensions --show-versions", { encoding: "utf-8" })
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [id, version] = line.split("@");
      return { id, version };
    });

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

  fs.writeFileSync(filePath, JSON.stringify(final, null, 2));
  console.log(`✅ Exported ${raw.length} extensions to ${filePath}`);
}

function installExtension(ext) {
  const id = typeof ext === "string" ? ext : ext.id;
  const version = typeof ext === "string" ? null : ext.version;
  const disabled = typeof ext === "string" ? false : ext.disabled;

  try {
    if (version) {
      console.log(`📦 Installing ${id}@${version}...`);
      execSync(`code --install-extension ${id}@${version}`, { stdio: "inherit" });
    } else {
      console.log(`📦 Installing ${id}...`);
      execSync(`code --install-extension ${id}`, { stdio: "inherit" });
    }

    if (disabled) {
      console.log(`🚫 Disabling ${id}...`);
      execSync(`code --disable-extension ${id}`, { stdio: "inherit" });
    }
  } catch (err) {
    console.warn(`⚠️ Failed to install ${id}`);
  }
}

function importExtensions(filename) {
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

  extensions.forEach(installExtension);
  console.log("✅ Import complete");
}

(async () => {
  const cmd = process.argv[2];
  const filename = process.argv[3];
  const exact = process.argv.includes("--exact");

  if (cmd === "export") {
    const name = filename || `vscode-extensions-${Date.now()}.json`;
    await exportExtensions(name, exact);
  } else if (cmd === "import") {
    if (!filename) {
      console.error("❌ You must specify a file to import (e.g. vscode-ext import my.json)");
      process.exit(1);
    }
    importExtensions(filename);
  } else {
    console.log("Usage:");
    console.log("  vscode-ext export [filename] [--exact]");
    console.log("  vscode-ext import <filename>");
    process.exit(1);
  }
})();
