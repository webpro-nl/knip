# Tests

`packages/knip/test`, fixtures in `packages/knip/fixtures`. Most tests run `main()` on a
fixture directory and assert on the returned `counters`/`issues`.

## Convention

`test/<theme>/<leaf>.test.ts` ↔ `fixtures/<theme>/<leaf>`, passed as
`resolve('fixtures/<theme>/<leaf>')` — `resolve` anchors at `packages/knip`, so the path is
explicit, not relative to the test file.

- One test ↔ one fixture; a second scenario is a second file, not a second `test()`.
- A theme's base test uses the leaf `basic`.
- `cli/`, `fix/`, `e2e/` intentionally reuse other themes' fixtures by their full path
  (they test the reporter/fixer/toolchain, not the fixture).

## Structure & placement

Tests vary along four axes (mechanism · issue-type · config · scope) that a flat name can't
capture. Each test is filed by its subject, first match wins — this is also the map:

1. Mechanism — graph construction / reference-following; asserts `counters`:
   `re-exports`, `imports`, `namespaces`, `resolution` (tsconfig/subpath/module-resolution),
   `compilers`, `language` (jsx/jsdoc/commonjs/custom-elements).
2. Issue type — a reported finding (`issues.*`): `exports`, `dependencies` (incl. peer,
   catalog, binaries), `types` (incl. enum members, dts).
3. Config / mode: `entry`, `ignore`, `ignore-exports-used-in-file`, `tags-hints`,
   `plugin-config` (plugin entry & script parsing), `infra` (gitignore, zero-config).
4. Scope: `workspaces` — only when the test is _about_ monorepo orchestration; a workspace
   merely used to exercise a mechanism/issue stays with it (leaf carries `-workspace`).

So `imports` (does knip follow a syntax → `counters`) and `exports` (is an unused export
reported → `issues`) are different axes, not competing categories.

Outside the axis, by their own conventions: `plugins/` (one+ per plugin), `cli/` (flags &
reporters via `exec`), `fix/` (`--fix` via `copyFixture`), `e2e/` (tsgo round-trip),
`util/` & `graph-explorer/` (unit, no fixtures), `session/`.

## Running

`scripts/run-test.js` globs files and hands the list to `bun test` / `node --test`
(`--runtime`, default bun). CLI tests use `src/cli.ts` on bun but `dist/cli.js` on node.

- default → `test/**/*.test.ts`
- `--smoke` → `test/!(cli|e2e|fix)/**` — everything except the heavy integration groups
  (`cli` spawns the CLI, `e2e` runs tsgo, `fix` mutates copies); the negation auto-includes
  any new theme dir, so one can't silently fall out of smoke.
- `--e2e` → `test/e2e/**`

Reporter, `--fix`, or format changes need the full `pnpm build && pnpm test`.
