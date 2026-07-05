# Plugins

## General

Read the writing-a-plugin docs first:

- [Writing A Plugin][1] — plugin responsibilities, lifecycle, `resolveConfig`
- [Inputs][2] — the `Input` type and helpers like `toEntry` and `toDependency`
- [Argument Parsing][3] — `Plugin.args` for binaries and arguments in scripts

Consider implementing `resolve*` functions only for custom plugin-specific needs
(core takes care of module resolution, imports, exports, external dependencies).

## Creating a new plugin

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from `packages/knip`. Use `--force` if
  files already exist from a partial run.
- Clean up the generated template: remove unused arrays (`config`, `entry`,
  `production`), `resolveConfig`, and `types.ts` if not needed.
- Consult similar plugins and the tool's website before implementation.
- Run tests individually first: `bun test test/plugins/[name].test.ts`

## `entry` and `config`

- `entry` — files to mark as entries but not parse (e.g. `src/routes/**/*.tsx`).
  Core handles module graph; `resolveConfig` / `resolveFromAST` does not run.
- `config` — files the plugin parses to extract references (inputs, entries,
  plugins, etc.). `resolveConfig` / `resolveFromAST` run on these; they're
  auto-added as entries.

## `resolveConfig` and `resolveFromAST`

Prefer `resolveFromAST` (fast, AST-only, no execution) over `resolveConfig`
(loads and executes the config). Use `resolveConfig` only when the config is
JSON or when execution is unavoidable (e.g. function configs).

`resolveConfig` should include `entry` and `production` items, either from the
parsed config or the plugin defaults (so they can be overriden). Include the
default `entry` and `production` in the plugin export for the docs generator.

See `tsdown`, `rollup`, `rolldown` for simple `resolveFromAST` examples using
`collectPropertyValues`. See `ast-helpers.ts` for available utilities.

## Script parsing

Don't walk and parse `manifest.scripts` manually. Use `Plugin.args` and find
what core script parser handles. See [Argument Parsing][3] and other plugins
like prisma, vitest, webpack.

## Compilers (`registerCompilers`)

Non-JS/TS files (`.css`, `.mdx`, `.vue`) are invisible until a compiler
registers their extension: it makes `**/*.<ext>` project files (unreferenced →
unused) and extracts imports so refs are followed. Built-ins (`src/compilers/`:
mdx/scss/less/ stylus) auto-enable on a known dependency; plugins gate on
`hasDependency`. Regex extractors, not parsers.

## Visitors (`registerVisitors`)

Library-specific AST patterns that generic traversal misses are caught by
visitors in core's single walk. A `create*Visitor(ctx)` feeds the graph via
`ctx`: `addImport` (knex, pino), `addImportGlob` (vite `import.meta.glob`,
webpack/rspack `require.context`), `addScript` (execa, nano-spawn),
`markExportRegistered` (custom elements: lit/fast/stencil/catalyst).
Enabled-only, zero cost when off. Factories in `plugins/[name]/visitors/`,
shared in `_custom-elements/`.

## Fixtures

- Use non-default file names in config fields (e.g. `input: 'src/app.ts'`, not
  `'index.ts'` or `'main.ts'`) so the test actually verifies the plugin resolves
  them — default entry patterns would pick those up regardless.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/index.md
[2]: ../packages/docs/src/content/docs/writing-a-plugin/inputs.md
[3]: ../packages/docs/src/content/docs/writing-a-plugin/argument-parsing.md
