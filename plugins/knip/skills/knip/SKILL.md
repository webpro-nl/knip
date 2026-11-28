---
name: knip
description: Find and fix unused files, dependencies, and exports in JavaScript and TypeScript projects with the Knip CLI, and configure Knip through the official @knip/mcp server.
license: ISC
compatibility: Requires Node.js v20.19.0 or later, or Bun. Use the knip package (v6+) or npx knip. Optional @knip/mcp for guided configuration.
metadata:
  author: webpro-nl
  version: "0.1.0"
---

# Knip

Use the official Knip CLI and docs at https://knip.dev. Do not invent flags, issue-type keys, or configuration options.

Knip finds unused files, dependencies, and exports in JavaScript and TypeScript projects so codebases stay smaller and easier to change.

## Install and run

The recommended setup adds Knip to the project, then runs the script:

```sh
npm init @knip/config
npm run knip
```

Other package managers: `pnpm create @knip/config` then `pnpm knip`; `bun create @knip/config` then `bun knip`; `yarn create @knip/config` then `yarn knip`.

To install manually: `npm install -D knip typescript @types/node`, then add a `"knip": "knip"` script to `package.json`. To run without adding a dependency: `npx knip`.

Knip v6 requires Node.js v20.19.0 or later, or Bun.

## Useful CLI flags

Prefer documented flags (`knip --help`). Common ones:

- `--production` / `-p` — lint production source only (excludes plugin test, config, and Storybook entries, and `devDependencies`)
- `--strict` — stricter production checks
- `--workspace <filter>` — limit the run to one workspace
- `--directory <dir>` — run from a different directory
- `--config <file>` / `-c` — path to a config file
- `--include` / `--exclude` — filter issue types (comma-separated or repeated)
- `--fix` / `-f` — auto-fix fixable issue types
- `--fix-type <types>` — fix only those issue types
- `--allow-remove-files` — allow `--fix` to delete unused files
- `--format` / `-F` — format files after `--fix`
- `--debug` — print troubleshooting output
- `--reporter`, `--output-file`, `--no-progress`

Issue type keys include `files`, `dependencies`, `unlisted`, `binaries`, `unresolved`, `exports`, `types`, `enumMembers`, `namespaceMembers`, `duplicates`, `catalog`, `catalogReferences`, and `cycles`. See the [issue types](https://knip.dev/reference/issue-types) docs before treating a key as an error: `nsExports` and `nsTypes` are off by default, and `cycles` warns by default.

Exit codes: `0` no lint issues, `1` at least one lint issue, `2` bad input or a failed run.

```sh
npx knip --production
npx knip --include files,dependencies
npx knip --fix --fix-type dependencies,exports
```

Do not pass `--allow-remove-files` unless the user wants files deleted. Review `--fix` diffs before committing.

## Configuration

Config can live in `knip.json`, `knip.jsonc`, a TypeScript config file, or a `knip` key in `package.json`.

JSON schema: `https://unpkg.com/knip@6/schema.json` (use `schema-jsonc.json` for JSONC).

Important options (see https://knip.dev/reference/configuration):

- `entry` / `project` — globs; prefix `!` to negate a pattern; suffix `!` to include it in production mode
- `paths` — import aliases (TypeScript `compilerOptions.paths` are picked up automatically)
- `workspaces` — per-workspace `entry`, `project`, and plugins; the root workspace key is `"."`
- Plugin ids such as `playwright: true` or `webpack: false` to force-enable or disable a plugin
- Filters and ignores such as `ignore`, `ignoreDependencies`, `ignoreBinaries`, `ignoreWorkspaces`, `rules`, `include`, `exclude`, and `tags`

If the report looks wrong, inspect entry files and plugins first (`--debug`) rather than adding broad ignores. Prefer fixing configuration or enabling a missing plugin over large ignore lists. See https://knip.dev/guides/handling-issues and https://knip.dev/guides/troubleshooting.

## MCP server

This plugin's `.mcp.json` starts the official server with `npx -y @knip/mcp`.

- Prompt: `knip-configure` — guided configuration
- Tools: `knip-run`, `knip-docs`
- Resources: `knip://docs/{topic}`

When the server is available, use it to configure Knip and to read docs instead of guessing options. The VS Code and Open VSX extensions also bundle this server.

## Docs

- https://knip.dev
- https://knip.dev/overview/getting-started
- https://knip.dev/reference/cli
- https://knip.dev/reference/configuration
- https://knip.dev/reference/integrations#mcp-server
