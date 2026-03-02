---
name: using-knip
description: Use when asked about "knip", "unused dependencies", "unused exports", "unused files", "dead code", "clean up code", "find unused code", "remove dead code", or auditing project health for stale references.
---

# Using Knip — Find Unused Code in JavaScript and TypeScript Projects

## Overview

[Knip](https://knip.dev) detects unused code across JavaScript and TypeScript projects:

- **Unused files** — source files not reachable from any entry point
- **Unused dependencies** — packages listed in `package.json` but never imported
- **Unused devDependencies** — dev packages not referenced by any tool or config
- **Unused exports** — exported symbols that nothing imports
- **Unused types** — exported type definitions with zero consumers
- **Unlisted dependencies** — imported packages missing from `package.json`
- **Duplicate exports** — the same symbol re-exported from multiple locations

Knip understands npm, yarn, pnpm, and Bun workspaces natively and has built-in plugins for 190+ tools (TypeScript, ESLint, Vitest, Next.js, Astro, Remix, Expo, and many more).

## Quick Reference

| Task | Command |
|---|---|
| Full project scan | `npx knip` |
| Production-only scan | `npx knip --production` |
| Single workspace (monorepo) | `npx knip -w packages/my-lib` |
| Only unused dependencies | `npx knip --include dependencies` |
| Only unused exports | `npx knip --include exports` |
| Only unused files | `npx knip --include files` |
| Auto-remove unused exports/deps | `npx knip --fix` |
| Watch mode | `npx knip --watch` |
| Limit output | `npx knip --max-show-issues 10` |

Replace `npx` with `bunx`, `yarn dlx`, or `pnpm dlx` as appropriate for the project's package manager.

## Setup

### Step 1 — Install

```bash
npm install -D knip
```

Or use Bun/yarn/pnpm equivalents. Install at the root of the project (or monorepo root).

### Step 2 — Create Configuration (optional)

Knip works zero-config for many projects. For custom entry points or monorepos, create `knip.json` (or `knip.jsonc`, `knip.ts`) at the project root. See `references/config-examples.md` for templates.

Run the config generator for a guided setup:

```bash
npx @knip/create-config
```

### Step 3 — Add Script (optional)

Add to `package.json`:

```json
{
  "scripts": {
    "knip": "knip"
  }
}
```

### Step 4 — Verify

```bash
npx knip --max-show-issues 5
```

A successful run prints issue counts by category. If it errors, check that configured paths match the actual project structure.

## Running an Analysis

### First Pass

Start with a limited view to avoid information overload:

```bash
npx knip --max-show-issues 10
```

### Narrow by Workspace

In a monorepo, focus on a single workspace to reduce noise:

```bash
npx knip -w packages/utils
npx knip -w apps/web
```

### Narrow by Issue Type

Investigate one category at a time:

```bash
npx knip --include dependencies    # unused deps only
npx knip --include exports         # unused exports only
npx knip --include files           # unreachable files only
npx knip --include unlisted        # missing-from-package.json deps
```

### Production Mode

Skip test files, dev configs, and tooling to see only production issues:

```bash
npx knip --production
```

### Combine Filters

Filters compose naturally:

```bash
npx knip -w apps/api --include dependencies --production
```

## Interpreting Results

### Unused Files

Files not reachable from any configured entry point. Before deleting:
- Check for dynamic imports (`import()` with variable paths)
- Check for references in non-JS config (framework configs, CI scripts)
- Check if the file is an entry point that Knip does not know about — add it to `entry` in the config

### Unused Dependencies

Packages in `dependencies` or `devDependencies` that no source file imports. Action: remove from `package.json`. Watch for:
- Packages used only via CLI (e.g., `drizzle-kit`, `prisma`) — add to `ignoreBinaries` or `ignoreDependencies`
- Packages loaded by plugins or presets (e.g., Babel, PostCSS plugins) — Knip plugins usually detect these, but verify

### Unused Exports

Exported functions, constants, classes, or types that no other module imports. Action: remove the `export` keyword or delete the symbol entirely. Confirm first that:
- The export is not part of a public package API consumed outside the monorepo
- The export is not used dynamically via `import()` or reflection

### Unlisted Dependencies

Modules imported in source but missing from that workspace's `package.json`. Action: add with the package manager. This prevents breakage when hoisted node_modules layout changes.

## Handling False Positives

### ignoreDependencies

For packages used at runtime but not statically imported (native modules, polyfills, CSS-in-JS runtimes):

```json
{
  "ignoreDependencies": ["some-runtime-dep"]
}
```

### ignoreBinaries

For CLI tools invoked in scripts but not imported in code:

```json
{
  "ignoreBinaries": ["prisma", "drizzle-kit"]
}
```

### ignore (file patterns)

For files that are entry points Knip cannot discover:

```json
{
  "ignore": ["**/generated/**", "scripts/**"]
}
```

### entry (custom entry points)

Override the default entry detection:

```json
{
  "entry": ["src/index.ts", "src/cli.ts"]
}
```

Per-workspace in a monorepo:

```json
{
  "workspaces": {
    "apps/web": {
      "entry": ["src/pages/**/*.tsx"]
    }
  }
}
```

## Framework-Specific Notes

### Next.js

Knip has a built-in Next.js plugin. Pages in `app/` and `pages/` are detected automatically. Server actions, middleware, and `instrumentation.ts` are recognized entry points.

### Expo / React Native

Expo Router uses file-based routing in the `app/` directory — configure these as entry points. Native modules auto-linked by Expo may appear unused since they have no direct JS import. Add them to `ignoreDependencies`.

### Astro

Knip has a built-in Astro plugin. Pages and components in `src/pages/` and `src/components/` are detected automatically.

### Hono / Express / Fastify

Route handlers are typically imported by the main entry file. If routes are loaded dynamically or via glob patterns, add the route directory to `entry`.

### Monorepos

Knip resolves `workspace:*` protocol dependencies natively. Configure workspaces in `knip.json` to set per-workspace entry points, ignore patterns, and dependency overrides. See `references/config-examples.md` for a monorepo template.

## Auto-Fix

### Safe Workflow

1. **Review first** — always run `npx knip` without `--fix` to inspect what will change
2. **Commit current state** — ensure a clean git state before auto-fixing
3. **Apply fixes** — `npx knip --fix` removes unused exports and dependencies automatically
4. **Validate** — run the project's type-check and lint immediately after
5. **Test** — build or run the test suite to catch runtime breakage that type-check misses

### What --fix Does

- Removes `export` keyword from unused exports
- Removes unused dependencies from `package.json`
- Does **not** delete unused files (manual action required)

### What --fix Does NOT Do

- Delete files — review and remove manually
- Fix unlisted dependencies — add them manually
- Resolve all false positives — some findings require config tuning

## Common Mistakes

| Mistake | Consequence | Prevention |
|---|---|---|
| Running `--fix` without reviewing | Breaks public APIs or dynamic imports | Always dry-run first |
| Ignoring unlisted dependencies | Build breaks on clean install | Fix immediately |
| Not configuring framework entry points | All route/page files flagged as unused | Check plugin docs or add custom entries |
| Deleting files that are dynamically imported | Runtime crashes | Verify with grep before deleting |
| Skipping type-check after fixes | Broken imports go unnoticed | Always validate after changes |

## Red Flags

Stop and investigate before acting if:

- A shared/library package appears as an unused dependency — it may be imported only in config files or native code
- A large number of files appear unused — the entry points are likely misconfigured
- `--fix` removes an export that is part of a public API — consumers outside the monorepo are not visible to Knip
- A framework plugin package appears unused — it may be auto-loaded by the framework at runtime without a direct import
