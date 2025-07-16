# VS Code extension import/export
Export or import vs-code extensions using this CLI.

Cross-platform: works on macOS, Windows, and Linux.

## Pre
Make sure the `code` (VS code) CLI is available:
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

### Exporting extensions

Note: All exports go to the `output/` directory.

If the file **already exists,** you’ll be prompted before overwriting.

#### Basic (just extension IDs)

Running:

```shell
vscode-ext export my-extensions.json
```

Produces:

```json
[
  "esbenp.prettier-vscode",
  "ms-python.python",
  "dbaeumer.vscode-eslint"
]
```

#### Verbose (includes version and disabled status)

Running:

```
vscode-ext export my-extensions.json --exact
```

Produces:

```json
[
  {
    "id": "esbenp.prettier-vscode",
    "version": "10.2.0",
    "disabled": false
  },
  {
    "id": "eamodio.gitlens",
    "version": "14.3.0",
    "disabled": true
  }
]
```

### Importing extensions

```shell
vscode-ext import my-extensions.json
```

Note: file must exist in the `output/` directory