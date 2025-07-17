import readline from "readline";
import fs from "fs";
import path from "path";

export function promptYesNo(question: string): Promise<boolean> {
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

export function validateFilename(filename: string): string {
  if (filename.includes("..") || filename.includes("\\")) {
    const msg = `❌ Invalid filename or path "${filename}"`;
    console.error(msg);
    throw new Error(msg);
  }
  return filename;
}

export function log(message: string, quiet?: boolean): void {
  if (!quiet) {
    console.log(message);
  }
}

export function loadConfig(): Record<string, any> {
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

export function showHelp(): void {
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