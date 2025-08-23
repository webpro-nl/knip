# @knip/lsp

Language Server Protocol implementation for Knip.

## Installation

```bash
npm install -g @knip/lsp
```

## Usage

### As a standalone LSP server

Run the LSP server:

```bash
knip-lsp
```

### In VSCode

The VSCode extension will automatically use this LSP server when installed.

### In other editors

Configure your editor to use `knip-lsp` as the language server for TypeScript and JavaScript files.

## Configuration

The LSP server supports the following configuration options through workspace settings:

- `knip.enableDiagnostics`: Enable/disable diagnostics (default: true)
- `knip.runOnSave`: Run analysis on file save (default: true)
- `knip.includeDevDependencies`: Include dev dependencies in analysis (default: true)
- `knip.includeExports`: Include exports analysis (default: true)
- `knip.includeFiles`: Include files analysis (default: true)

## Features

- Real-time diagnostics for unused dependencies, exports, and files
- Code actions to fix issues
- Automatic analysis on file changes
- Workspace-aware configuration

## License

ISC