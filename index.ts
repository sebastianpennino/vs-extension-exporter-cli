import { exportExtensions } from "./commands/exportExtensions.ts";
import { importExtensions } from "./commands/importExtensions.ts";
import { listExtensions } from "./commands/listExtensions.ts";
import { validateFilename, loadConfig, showHelp } from "./utils/utilities.ts";

const COMMANDS = {
  EXPORT: "export",
  IMPORT: "import",
  LIST: "list"
} as const;

type Command = typeof COMMANDS[keyof typeof COMMANDS];

(async () => {
  const config = loadConfig();
  const cmd = process.argv[2] as Command;
  const filename = process.argv[3];
  const quiet = process.argv.includes("--quiet") || config.quiet;
  const dryRun = process.argv.includes("--dry-run") || config.dryRun;

  switch (cmd) {
    case COMMANDS.EXPORT: {
      const name = validateFilename(filename || `vscode-extensions-${Date.now()}.json`);
      await exportExtensions(name, quiet, dryRun);
      break;
    }
    case COMMANDS.IMPORT: {
      if (!filename) {
        console.error("❌ You must specify a file to import (e.g. vscode-ext import my.json)");
        process.exit(1);
      }
      await importExtensions(validateFilename(filename), quiet, dryRun);
      break;
    }
    case COMMANDS.LIST: {
      listExtensions(quiet);
      break;
    }
    default: {
      showHelp();
      process.exit(1);
    }
  }

})(); 