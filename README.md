# VS Code extension import/export
Export or import VS Code extensions using this CLI.

Cross-platform: works on macOS, Windows, and Linux.

## Pre
Make sure the `code` (VS Code) CLI is available:
1. Open VSCode
2. Run command palette: 
  - Shell Command: `Install 'code' command in PATH`
3. Confirm with `code --version` in your terminal

## Installation
1. `git clone https://github.com/sebastianpennino/vs-extension-exporter-cli.git`
2. `cd vscode-ext-cli`
3. `npm install -g .`

This installs the `vscode-ext` command globally.

## Usage

### Using the global command

```shell
vscode-ext <command> [options]
```

### Using npm start (without global installation)

```shell
npm start -- <command> [options]
```

Note: The `--` is required to pass arguments to the script.

Examples:
```shell
npm start -- export my-extensions.json
npm start -- import my-extensions.json
npm start -- list
```

### Available Commands

- `export [filename] [--dry-run] [--quiet]` - Export extensions to a JSON file
- `import <filename> [--dry-run] [--quiet]` - Import extensions from a JSON file
- `list [--quiet]` - List currently installed extensions

### Options

- `--dry-run` - Show what would be done without making changes
- `--quiet` - Reduce output verbosity

### Exporting extensions

Note: All exports go to the `output/` directory.

If the file **already exists,** you'll be prompted before overwriting.

#### Export format (always includes version)

Running:

```shell
vscode-ext export my-extensions.json
```

Or with npm start:

```shell
npm start -- export my-extensions.json
```

Produces:

```json
[
  "esbenp.prettier-vscode@10.2.0",
  "ms-python.python@2024.6.0",
  "dbaeumer.vscode-eslint@2.4.0"
]
```

### Importing extensions

```shell
vscode-ext import my-extensions.json
```

Or with npm start:

```shell
npm start -- import my-extensions.json
```

Note: file must exist in the `output/` directory and must be in the format above (`id@version` per line).

### Configuration

You can create a configuration file at `~/.vscode-ext-config.json` with default options:

```json
{
  "quiet": false,
  "dryRun": false
}
```