# Knip Language Server Protocol (LSP) Mode

Knip now supports running as a Language Server Protocol (LSP) server, enabling real-time integration with any LSP-compatible editor (VS Code, Neovim, Emacs, etc.).

## Features

- **Real-time diagnostics**: See Knip issues directly in your editor as you code
- **Code actions**: Quick fixes for common issues (remove unused exports, add missing dependencies)
- **File watching**: Automatic re-analysis when configuration files change
- **Workspace support**: Handle multiple workspace folders
- **Configurable settings**: Control what types of issues are reported

## Usage

### As a standalone LSP server

```bash
# Run Knip in LSP mode
knip --lsp

# Or use the dedicated binary
knip-lsp
```

### As a reporter

```bash
# Output LSP-formatted diagnostics
knip --reporter lsp
```

## Editor Integration

### VS Code

Create or update `.vscode/settings.json`:

```json
{
  "knip.enable": true,
  "knip.enableDiagnostics": true,
  "knip.runOnSave": true,
  "knip.includeDevDependencies": true,
  "knip.includeExports": true,
  "knip.includeFiles": true
}
```

### Neovim (with nvim-lspconfig)

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define Knip LSP configuration
configs.knip = {
  default_config = {
    cmd = { 'knip-lsp' },
    filetypes = { 'javascript', 'javascriptreact', 'typescript', 'typescriptreact' },
    root_dir = lspconfig.util.root_pattern('package.json', 'knip.json', 'knip.ts'),
    settings = {
      knip = {
        enableDiagnostics = true,
        runOnSave = true,
        includeDevDependencies = true,
        includeExports = true,
        includeFiles = true
      }
    }
  }
}

-- Enable Knip LSP
lspconfig.knip.setup{}
```

### Generic LSP Client Configuration

The Knip LSP server implements the standard Language Server Protocol with:

- **Initialize**: Accepts standard LSP initialization parameters
- **Text Document Sync**: Incremental synchronization
- **Diagnostics**: Published via `textDocument/publishDiagnostics`
- **Code Actions**: Available for quick fixes
- **Commands**: 
  - `knip.analyze`: Run full analysis
  - `knip.fix`: Fix issues in current file
  - `knip.fixAll`: Fix all issues in current file

## Configuration

The LSP server respects the following settings (provided via workspace/configuration):

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `knip.enableDiagnostics` | boolean | true | Enable/disable diagnostics |
| `knip.runOnSave` | boolean | true | Run analysis when files are saved |
| `knip.includeDevDependencies` | boolean | true | Include dev dependencies in analysis |
| `knip.includeExports` | boolean | true | Check for unused exports |
| `knip.includeFiles` | boolean | true | Check for unused files |

## Diagnostic Severity Mapping

Knip issues are mapped to LSP diagnostic severities as follows:

| Issue Type | Severity |
|------------|----------|
| `unresolved` | Error |
| `unlisted`, `binaries`, `dependencies`, `devDependencies` | Warning |
| `exports`, `types`, `duplicates` | Information |
| `enumMembers`, `classMembers` | Hint |

## Watched Files

The LSP server automatically watches and re-analyzes when these files change:

- `package.json`
- `tsconfig.json`
- `knip.json`, `.knip.json`
- `knip.ts`, `.knip.ts`

## Architecture

The LSP implementation consists of:

1. **KnipLanguageServer class** (`src/reporters/lsp.ts`): Main server implementation
2. **Direct API integration**: Uses Knip's `main()` function directly for analysis
3. **Dual mode support**: Can run as standalone server or as a reporter

## Development

### Running Tests

```bash
# Run unit tests
npm test test/reporters/lsp.test.ts

# Run integration tests
npm test test/integration/lsp-client.test.ts
```

### Debugging

Set environment variable for verbose output:

```bash
KNIP_LSP_DEBUG=true knip --lsp
```

## Troubleshooting

### Server doesn't start

- Ensure Knip is installed: `npm install -g knip` or use local installation
- Check that the `knip-lsp` binary is in your PATH
- Verify Node.js version compatibility (requires Node.js 18+)

### No diagnostics appearing

- Verify the workspace root contains a `package.json`
- Check LSP client logs for initialization errors
- Ensure file types are supported (`.js`, `.jsx`, `.ts`, `.tsx`)

### Performance issues

- Disable real-time analysis: set `runOnSave` to `false`
- Exclude large directories in your Knip configuration
- Use production mode to skip dev dependencies

## Contributing

The LSP implementation is in `packages/knip/src/reporters/lsp.ts`. Key areas for contribution:

- Additional code actions for automatic fixes
- Performance optimizations for large projects
- Enhanced file watching capabilities
- Support for additional LSP features (hover, completion, etc.)