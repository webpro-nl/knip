---
title: Language Server Protocol (LSP)
---

The Knip Language Server Protocol (LSP) implementation is available as a separate
package `@knip/lsp`, providing real-time analysis and diagnostics directly in your
editor. This enables a seamless development experience with instant feedback on
unused code, missing dependencies, and other issues.

## Package Information

- **Package**: `@knip/lsp`
- **Binary**: `knip-lsp`
- **Repository**: [webpro-nl/knip](https://github.com/webpro-nl/knip/tree/main/packages/knip-lsp)

## Features

- **Real-time diagnostics**: See Knip issues as you type
- **Code actions**: Quick fixes for common issues
- **Automatic re-analysis**: Updates when configuration files change
- **Multi-workspace support**: Handle complex project structures
- **Editor agnostic**: Works with any LSP-compatible editor

## Installation

Install the LSP server globally:

```sh
npm install -g @knip/lsp
```

Or add it to your project:

```sh
npm install --save-dev @knip/lsp
```

## Starting the LSP Server

Run the Knip LSP server:

```sh
knip-lsp
```

## Editor Setup

### Neovim

Add this to your Neovim configuration:

```lua
local lspconfig = require('lspconfig')
local configs = require('lspconfig.configs')

-- Define Knip LSP configuration
configs.knip = {
  default_config = {
    cmd = { 'knip-lsp' },
    filetypes = {
      'javascript',
      'javascriptreact',
      'typescript',
      'typescriptreact'
    },
    root_dir = lspconfig.util.root_pattern(
      'package.json',
      'knip.json',
      '.knip.json',
      'knip.ts',
      '.knip.ts'
    ),
    settings = {}
  }
}

-- Enable Knip LSP
lspconfig.knip.setup{}
```

#### Minimal Neovim Configuration

For a quick test or minimal setup without lspconfig, save this as `init.lua` and run `nvim -u init.lua yourfile.ts`:

```lua
-- Minimal Neovim config for testing Knip LSP
-- Make sure @knip/lsp is installed globally: npm install -g @knip/lsp

-- Auto-start Knip LSP for JS/TS files
vim.api.nvim_create_autocmd('FileType', {
  pattern = {'javascript', 'javascriptreact', 'typescript', 'typescriptreact'},
  callback = function()
    vim.lsp.start({
      name = 'knip-lsp',
      cmd = {'knip-lsp'},
      root_dir = vim.fn.getcwd(),
      settings = {
        knip = {
          enableDiagnostics = true,
          runOnSave = true,
        }
      },
      -- Optional: suppress info messages to avoid prompts
      handlers = {
        ["window/showMessage"] = function(err, result, ctx, config)
          if result and result.type == 1 then -- Only show errors
            vim.notify(result.message, vim.log.levels.ERROR)
          end
        end,
      },
    })
  end
})

-- Configure diagnostic display
vim.diagnostic.config({
  virtual_text = true,
  signs = true,
  update_in_insert = false,
  underline = true,
})

-- Commands
vim.api.nvim_create_user_command('KnipAnalyze', function()
  vim.lsp.buf.execute_command({ command = 'knip.analyze' })
end, {})

-- Keybindings (optional)
vim.keymap.set('n', '<leader>e', vim.diagnostic.open_float)
vim.keymap.set('n', '[d', vim.diagnostic.goto_prev)
vim.keymap.set('n', ']d', vim.diagnostic.goto_next)
```

### Emacs (with lsp-mode)

Add to your Emacs configuration:

```elisp
(defcustom lsp-knip-server-command '("knip-lsp")
  "Command to start Knip LSP server."
  :type '(repeat string)
  :group 'lsp-knip)

(lsp-register-client
 (make-lsp-client
  :new-connection (lsp-stdio-connection lsp-knip-server-command)
  :activation-fn (lsp-activate-on "javascript" "typescript" "javascriptreact" "typescriptreact")
  :server-id 'knip-lsp))
```
### Helix

Add to your `~/.config/helix/languages.toml`:

```toml
[[language]]
name = "typescript"
language-servers = ["typescript-language-server", "knip-lsp"]

[[language]]
name = "javascript"
language-servers = ["typescript-language-server", "knip-lsp"]

[language-server.knip-lsp]
command = "knip-lsp"
args = []
```

## Configuration

The LSP server respects your project's Knip configuration file (`knip.json`,
`knip.ts`, etc.). Changes to configuration files trigger automatic re-analysis.

### LSP-Specific Settings

Some editors allow passing configuration to the language server. Knip's LSP
server supports these settings:

```json
{
  "knip": {
    "enableDiagnostics": true,
    "runOnSave": true,
    "includeDevDependencies": true,
    "includeExports": true,
    "includeFiles": true
  }
}
```

### Visual Studio Code

For VSCode, you can either:
1. Use a generic LSP client extension configured to launch `knip-lsp`
2. Wait for a dedicated Knip extension that will automatically use `@knip/lsp`

### Zed

For Zed, you can either:
1. Use a generic LSP client extension configured to launch `knip-lsp`
2. Wait for a dedicated Knip extension that will automatically use `@knip/lsp`

## Commands

The LSP server provides these commands that can be executed from your editor:

- `knip.analyze`: Run full analysis
- `knip.fix`: Fix issues in current file
- `knip.fixAll`: Fix all issues in current file

## File Watching

The server automatically watches and re-analyzes when these files change:

- `package.json`
- `tsconfig.json`
- Knip configuration files (`knip.json`, `.knip.json`, `knip.ts`, `.knip.ts`)

## Performance Considerations

The LSP server runs Knip analysis in the background. For large projects:

- Initial analysis may take a few seconds
- Subsequent analyses are incremental and faster
- File saves trigger re-analysis by default (configurable)

## Troubleshooting

### Server doesn't start

- Ensure the LSP server is installed: `npm install -g @knip/lsp`
- Ensure Knip itself is installed: `npm install -g knip` (or in your project)
- Verify Node.js version compatibility (>=18.18.0)
- Check editor's LSP client logs for errors

### No diagnostics appearing

- Verify the workspace contains a `package.json`
- Check that file types are supported (`.js`, `.jsx`, `.ts`, `.tsx`)
- Ensure Knip configuration is valid

### Performance issues

- Disable `runOnSave` in settings
- Use [production mode](../features/production-mode.md) configuration
- Exclude large directories in Knip configuration

## Limitations

- The LSP server currently provides diagnostics only (no completions, hover, etc.)
- Fixes are applied by running `knip --fix` internally
- Some complex monorepo setups may require additional configuration

## Future Enhancements

Planned improvements for the LSP implementation:

- Incremental analysis for better performance
- More granular code actions
- Hover information for issues
- Code lens for unused exports
- Integration with editor-specific features
