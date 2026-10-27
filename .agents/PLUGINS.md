# Plugins

## General

Read the writing-a-plugin docs first:

- [Writing A Plugin][1] — plugin responsibilities, lifecycle, `resolveConfig`
- [Inputs][2] — the `Input` type and helpers like `toEntry` and `toDependency`
- [Argument Parsing][3] — `Plugin.args` for binaries and arguments in scripts

## Implementation

- Consider implementing `resolve*` functions for custom plugin-specific needs.
  Leave regular module resolution and tracking imports, exports and external
  dependencies to the core routine.
- Keep fixes local to the plugin and its tests. Discuss changes to core modules,
  inputs, import flags, caches before implementing them.
- Use the existing plugin lifecycle. Do not add core machinery solely to carry
  one plugin's state.
- Resolve relative paths from a tool's config against the base the tool uses.
  Entry patterns are relative to the workspace, `toDeferResolve` specifiers to
  the config file. When the tool uses another base, prefix the path with
  `join`, such as `join(options.cwd, path)`.

## Creating a new plugin

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from `packages/knip`. Use `--force` if
  files already exist from a partial run.
- Clean up the generated template: remove unused arrays (`config`, `entry`,
  `production`), `resolveConfig`, and `types.ts` if not needed.
- Consult similar plugins and the tool's website before implementation.
- Below the imports, link the tool's docs in a comment (see template). It's the
  single source of truth for upstream references; link the tool's source (pinned
  to a tag or commit) for behavior the docs don't cover.
- Run tests individually first: `bun test test/plugins/[name].test.ts`

## `entry` and `config`

- `entry` — files to mark as entries but not parse (e.g. `src/routes/**/*.tsx`).
  Core handles module graph; `resolveConfig` / `resolveFromAST` does not run.
- `config` — files the plugin parses to extract references (inputs, entries,
  plugins, etc.). `resolveConfig` / `resolveFromAST` run on these; they're
  auto-added as entries.
- List every config file location the tool searches, taken from its discovery
  code (e.g. cosmiconfig `searchPlaces`), and link that code in the top comment.
- Without `resolveConfig` or `resolveFromAST`, use `entry`, not `config`. Core
  only adds `config` files as entries anyway, after a wasted parse, and the docs
  would claim the plugin reads them. `args.config` works without `config`. Only
  files Knip can parse need an entry; JSON, YAML and extensionless rc files add
  nothing.

## `resolveConfig` and `resolveFromAST`

Prefer `resolveFromAST` (fast, AST-only, no execution) over `resolveConfig`
(loads and executes the config). Use `resolveConfig` when the config is JSON or
when execution is unavoidable (e.g. function configs).

Keep `resolveFromAST` to static values. Avoid too many dynamic code patterns
such as dynamic imports and spreads. When values depend on such patterns,
consider `resolveConfig` to read them from the loaded config, and keep
`resolveFromAST` for values the loaded config doesn't expose. Removing a single
false positive does not always justify the additional complexity.

`resolveConfig` should include `entry` and `production` items, either from the
parsed config or the plugin defaults (so they can be overriden). Include the
default `entry` and `production` in the plugin export for the docs generator.

See `tsdown`, `rollup`, `rolldown` for simple `resolveFromAST` examples using
`collectPropertyValues`. See `ast-helpers.ts` for available utilities.

## Script parsing

Don't walk and parse `manifest.scripts` manually. Use `Plugin.args` and find
what core script parser handles. See [Argument Parsing][3] and other plugins
like prisma, vitest, webpack.

Handle the CLI arguments that change what the tool loads, such as a config file,
a source directory or extra entry files: `args.config` for config files,
`args.resolveInputs` for the rest (see react-email). Check that an option means
the same thing in every command.

## Compilers (`registerCompilers`)

Non-JS/TS files (`.css`, `.mdx`, `.vue`) are invisible until a compiler
registers their extension: it makes `**/*.<ext>` project files (unreferenced →
unused) and extracts imports so refs are followed. Built-ins (`src/compilers/`:
mdx/scss/less/ stylus) auto-enable on a known dependency; plugins gate on
`hasDependency`. Regex extractors, not parsers. The same scope and tradeoffs
apply when adding new compilers; read [COMPILERS.md][4] first.

## Visitors (`registerVisitors`)

Library-specific AST patterns that generic traversal misses are caught by
visitors in core's single walk. A `create*Visitor(ctx)` feeds the graph via
`ctx`: `addImport` (knex, pino), `addImportGlob` (vite `import.meta.glob`,
webpack/rspack `require.context`), `addScript` (execa, nano-spawn),
`markExportRegistered` (custom elements: lit/fast/stencil/catalyst).
Enabled-only, zero cost when off. Factories in `plugins/[name]/visitors/`,
shared in `_custom-elements/`.

Visitors collect syntax facts through `ctx`. Keep filesystem access, discovery,
and module resolution outside AST traversal; discuss unavoidable exceptions
first.

## Fixtures

See [TESTS.md][5] for fixture conventions, including plugin fixtures.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/index.md
[2]: ../packages/docs/src/content/docs/writing-a-plugin/inputs.md
[3]: ../packages/docs/src/content/docs/writing-a-plugin/argument-parsing.md
[4]: ./COMPILERS.md
[5]: ./TESTS.md#plugin-fixtures
