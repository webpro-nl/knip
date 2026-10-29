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
- Return specifiers as the tool reads them and name the tool's base with an
  absolute `dir`. `toDeferResolve`, `toDeferResolveEntry` and `toConfig` resolve
  from it (default: the config file's directory); `toDependency` and `toBinary`
  use it to select the workspace; `toAlias` uses it as the base of its targets.
  `toEntry` and `toProductionEntry` resolve from it as well (default: the
  workspace directory) and stay with the workspace that returned them; a
  negated entry pattern reaches only the plugin's entry patterns with the same
  base (`dir`, else the workspace directory). `toProject` is workspace-relative
  and ignores `dir`.
- Enable a plugin on the tool's package with `hasDependency`. File or manifest
  checks in `isEnabled` add I/O per workspace; reserve them for tools without a
  package, such as package managers, mise, Task or CI configs.
- Plugins add no dependencies to Knip, including a tool's own config parser. Say
  so early when a contribution needs one.
- When another plugin already loads the config file, read this tool's section
  from that loaded config instead of loading or parsing the file again (oxlint
  reads Vite+ `lint` from the loaded Vite config).
- For a drop-in replacement of a tool, re-export the original plugin's `config`
  and `resolveConfig` (see `osls`, `tsrs`), so each tool keeps its own key.
- Choose the input type from [Inputs][2] and match production relevance to the
  nearest existing plugin. A value documented as a package name is a
  dependency, not `toConfig`.
- Don't emit inputs for `#` subpath imports: core already turns
  `package.json#imports` targets into entries and dependencies.
- For a loaded shared config, such as an extended preset, set
  `isFilterTransitiveDependencies` so the preset's own dependencies don't become
  the project's (see prettier, metro, webpack).

## Creating a new plugin

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from `packages/knip`. Use `--force` if
  files already exist from a partial run.
- Clean up the generated template: remove unused arrays (`config`, `entry`,
  `production`), `resolveConfig`, and `types.ts` if not needed. When a module in
  `src/types/` already describes the tool, extend it instead of `types.ts`.
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
- Leave out patterns Knip already covers globally, such as `index.*`.
- Keep brace alternatives within one path segment. An alternative containing `/`
  (`{mise,.config/mise}/conf.d/*.toml`) disables directory pruning.

## `resolveConfig` and `resolveFromAST`

Prefer `resolveFromAST` (fast, AST-only, no execution) over `resolveConfig`
(loads and executes the config). Use `resolveConfig` when the config is JSON or
when execution is unavoidable (e.g. function configs).

Keep `resolveFromAST` to static values. Avoid too many dynamic code patterns
such as dynamic imports and spreads. When values depend on such patterns,
consider `resolveConfig` to read them from the loaded config, and keep
`resolveFromAST` for values the loaded config doesn't expose. Removing a single
false positive does not always justify the additional complexity.

Follow imported modules only where they provably form the config value; don't
follow widely and then make the extra inputs harmless. `toConfig` is for a
tool's own config files, not for modules a config imports.

Core adds the static `entry` and `production` patterns only while no config
file other than `package.json` has been found or handed over for a plugin with
`resolveConfig` or `resolveFromAST`. `resolveConfig` should include `entry` and
`production` items, either from the parsed config or the plugin defaults (so
they can be overriden). Include the default `entry` and `production` in the
plugin export for the docs generator.

See `tsdown`, `rollup`, `rolldown` for simple `resolveFromAST` examples using
`collectPropertyValues`. See `ast-helpers.ts` for available utilities.

## Path resolution

- `dir` should be absolute (`options.cwd`, `options.configFileDir` or
  `options.rootCwd`): workspace assignment prefix-matches absolute workspace
  directories, so a relative `dir` falls back to the workspace of the file the
  input came from, without a warning.
- Do not join `options.cwd` onto a specifier that may be a package name. For
  patterns from another base, `join(base, literal)` is fine for values you
  control; use `toAbsolute(value, base)` when a config value may already be
  absolute, because `join` would prefix it again, and keep a leading `!` in
  front.
- Root-relative values (Nx `{workspaceRoot}`, GitHub Actions
  `working-directory`) use `options.rootCwd` as the base. Commands passed to
  `getInputsFromScripts` are text: expand placeholders into path strings before
  parsing them (see the `nx` plugin).

## Script parsing

Don't walk and parse `manifest.scripts` manually. Use `Plugin.args` and find
what core script parser handles. See [Argument Parsing][3] and other plugins
like prisma, vitest, webpack.

Handle the CLI arguments that change what the tool loads, such as a config file,
a source directory or extra entry files: `args.config` for config files,
`args.resolveInputs` for the rest (see react-email). Check that an option means
the same thing in every command. Declare the tool's boolean flags in
`args.boolean`: an undeclared option takes the next token as its value and can
swallow a positional entry.

Pass a command from a tool's config (Playwright's `webServer.command`) with its
cwd to `options.getInputsFromScripts`, not to a plugin-specific parser or
allowlist. Wrappers such as c8 re-parse trailing commands through other plugins'
`args`, so after an `args` change also run `get-inputs-from-scripts.test.ts`.

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
first. To match calls of an imported API, use `findImportedCalls` from
`ast-helpers.ts`; matching raw identifiers in source order turns unrelated calls
into graph facts.

## Fixtures

See [TESTS.md][5] for fixture conventions, including plugin fixtures.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/index.md
[2]: ../packages/docs/src/content/docs/writing-a-plugin/inputs.md
[3]: ../packages/docs/src/content/docs/writing-a-plugin/argument-parsing.md
[4]: ./COMPILERS.md
[5]: ./TESTS.md#plugin-fixtures
