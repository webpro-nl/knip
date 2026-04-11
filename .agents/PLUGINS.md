# Plugins

## General

Read [Writing A Plugin][1] first to understand:

- Plugin responsibilities
- Functions like `resolveConfig` and `Input` type definition
- Consider `resolveFromAST` only for custom plugin-specific needs (core takes
  care of module resolution, imports, exports, external dependencies)

## Creating a new plugin

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from `packages/knip`. Use `--force` if
  files already exist from a partial run.
- Clean up the generated template: remove unused arrays (`config`, `entry`,
  `production`), `resolveConfig`, and `types.ts` if not needed.
- Consult similar plugins and the tool's website before implementation.
- Run tests individually first: `bun test test/plugins/[name].test.ts`

## `config` vs `entry`

- `config` — patterns for config files the plugin reads/parses.
  `resolveConfig` and `resolveFromAST` run on these files. They're also
  automatically added as entry files.
- `entry` — patterns for files that are entries but NOT parsed by the plugin
  (e.g. `src/routes/**/*.tsx`). `resolveFromAST` does NOT run on these.

If a tool has a config file that contains references to other files (like
`input`, `entry`, `plugins`), use `config` + `resolveFromAST` — not `entry`.

## `resolveFromAST` vs `resolveConfig`

Prefer `resolveFromAST` (fast, AST-only, no execution) over `resolveConfig`
(loads and executes the config). Use `resolveConfig` only when the config is
JSON or when execution is unavoidable (e.g. function configs).

See `tsdown`, `rollup`, `rolldown` for simple `resolveFromAST` examples using
`collectPropertyValues`. See `ast-helpers.ts` for available utilities.

## Fixtures

- Use non-default file names in config fields (e.g. `input: 'src/app.ts'`, not
  `'index.ts'` or `'main.ts'`) so the test actually verifies the plugin resolves
  them — default entry patterns would pick those up regardless.

[1]: ../packages/docs/src/content/docs/writing-a-plugin/index.md
