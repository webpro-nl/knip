# Tests

`packages/knip/test`, fixtures in `packages/knip/fixtures`. Most tests run
`main()` on a fixture directory and assert on the returned `counters`/`issues`.

## Convention

`test/<theme>/<leaf>.test.ts` ↔ `fixtures/<theme>/<leaf>`, passed as
`resolve('fixtures/<theme>/<leaf>')` — `resolve` anchors at `packages/knip`, so
the path is explicit, not relative to the test file.

- A theme's base test uses the leaf `basic`.
- `cli/`, `fix/`, `e2e/` intentionally reuse other themes' fixtures by their
  full path (they test the reporter/fixer/toolchain, not the fixture).

## Structure & placement

Tests vary along four axes (mechanism · issue-type · config · scope) that a flat
name can't capture. Each test is filed by its subject, first match wins — this
is also the map:

1. Mechanism — graph construction / reference-following; asserts `counters`:
   `re-exports`, `imports`, `namespaces`, `resolution`
   (tsconfig/subpath/module-resolution), `compilers`, `language`
   (jsx/jsdoc/commonjs/custom-elements).
2. Issue type — a reported finding (`issues.*`): `exports`, `dependencies`
   (incl. peer, catalog, binaries), `types` (incl. enum members, dts).
3. Config / mode: `entry`, `ignore`, `ignore-exports-used-in-file`,
   `tags-hints`, `plugin-config` (plugin entry & script parsing), `infra`
   (gitignore, zero-config).
4. Scope: `workspaces` — only when the test is _about_ monorepo orchestration; a
   workspace merely used to exercise a mechanism/issue stays with it (leaf
   carries `-workspace`).

So `imports` (does knip follow a syntax → `counters`) and `exports` (is an
unused export reported → `issues`) are different axes, not competing categories.

Outside the axis, by their own conventions: `plugins/` (one+ per plugin), `cli/`
(flags & reporters via `exec`), `fix/` (`--fix` via `copyFixture`), `e2e/` (tsgo
round-trip), `util/` & `graph-explorer/` (unit, no fixtures), `session/`.

## Fixtures

- Extend an existing fixture whenever possible; several tests may share one
  (e.g. a default and an `isProduction` run). Add a fixture only for a scenario
  that can't coexist with existing ones, like a function vs an object config
  export.
- Use descriptive names like `module.ts` and `barrel.ts`, or a theme such as
  fruits or animals to show relation/hierarchy. Avoid `foo` and other vague
  names.
- Use empty files when sufficient (e.g. to verify an import specifier or entry
  file).

### Plugin fixtures

- Plugin fixtures live in `fixtures/plugins/<plugin-name>*`.
- Use non-default file names in config fields (e.g. `input: 'src/app.ts'`, not
  `'index.ts'` or `'main.ts'`) so the test verifies the plugin resolves them;
  default entry patterns would pick those up regardless.
- Keep function config fixtures realistic: check parameters in branch conditions
  so a wrong value leaves an entry file unused. Don't `throw` to assert
  parameters (an error drops all inputs of that config); reserve it for what
  counters can't observe, like call counts.

## Running

`scripts/run-test.js` globs files and hands the list to `bun test` / `node
--test` (`--runtime`, default bun). CLI tests use `src/cli.ts` on bun but
`dist/cli.js` on node.

- default → `test/**/*.test.ts`
- `--smoke` → `test/!(cli|e2e|fix)/**` — everything except the heavy integration
  groups (`cli` spawns the CLI, `e2e` runs tsgo, `fix` mutates copies); the
  negation auto-includes any new theme dir, so one can't silently fall out of
  smoke.
- `--e2e` → `test/e2e/**`

Reporter, `--fix`, or format changes need the full `pnpm build && pnpm test`.

### Native analysis

Build the addon before testing changed Rust code: `pnpm --dir packages/knip
build` uses the toolchain pinned in `native/rust-toolchain.toml`. Rust must be
installed and available on `PATH`. A missing native addon is an error.

`test/native` compares the Rust implementation against the original TypeScript
analyzer in `test/reference`. Preserve complete ordered records, optional
fields, UTF-16 positions, fixes, and callback exceptions. Keep oracle-only
modules outside `src` and the published package. Internal layouts may change;
compare observable behavior at the appropriate boundary rather than requiring
the production path to reconstruct the oracle's full JavaScript graph.

Tag tests preserve sharing and merge behavior within a file's comment groups,
including absent versus empty tags. Independent file analyses and cache hits
must own independent mutable sets. The old cross-file empty-tag singleton and
cache object identities are implementation details, not compatibility
requirements. `test/native/tag-identity.test.ts` covers these distinctions.

From `packages/knip`, run `bun test --timeout 30000 test/native` and
`node --test test/native/*.test.ts`. Run Rust unit tests with `cargo test
--locked` from `packages/knip/native`. Existing fixture, CLI, fixer, and session
suites must continue to exercise the native production path.

### Batch and graph boundaries

- `test/native/batch.test.ts` compares complete ordered results and UTF-16 fixes
  with serial analysis, including invalid-byte replacement, unreadable inputs,
  and deferred regex validation. Rust tests in `native/src/resolver/batch.rs`
  also exercise multiple worker cores and ordered per-file failures.
- `test/native/project-walk.test.ts` covers ordered host callbacks, whole-batch
  fallback, and cached compiler barriers when earlier files change entry policy.
  Failed cold graph callbacks must discard raw cache records before persistence;
  established cache-hit callback exceptions still propagate.
  Exercise both sides of a compiler barrier; an async or side-effecting compiler
  must finish before later native reads. Cache hits, native errors, and serial
  files must preserve the walk's discovery and callback order.
- `test/native/resolver-dependencies.test.ts` and Rust resolver/workspace tests
  cover shared serial/worker source-mapping misses, backend generations,
  unsuccessful probes, config/package reads, and symlink changes. Worker-local
  lookup state must not create independent source-mapping decisions.
- `test/native/graph.test.ts` compares usage snapshots with the TypeScript
  explorer, including ordered aliases, namespaces, entry boundaries, cycles,
  and UTF-16 strings. Rust tests in `native/src/graph.rs` compare compact-prefix
  ingestion with snapshots, validate malformed prefixes, and enforce add/finalize
  boundaries. Preserve query tuples and ordered sets, not just usage counts.
- Normal CLI tests exercise the compact native graph, where host internal maps
  are empty. Session/watch, trace, and cycle tests exercise the full JavaScript
  graph. Updates to that graph require a fresh native usage snapshot on every
  analysis, even if graph identity and size are unchanged. Batching and graph
  selection are independent: debug disables batching; trace/cycles select the
  full graph.

### Analysis-cache boundaries

`test/util/graph-cache.test.ts` covers immutable compact records and cloned
full-record fallbacks, fresh restoration, context invalidation within one stable
cache file, dependency validation, incomplete observations, and failed writes.
`test/infra/cache-graph-lifecycle.test.ts` covers real graph enrichment across
cold/warm runs, policy and visitor changes, session additions/deletions, and
import placeholders that must never substitute for analyzed records.

Check source edits separately from resolution changes. Source entries use
size/mtime; context and resolution fingerprints invalidate analysis for changed
plans, configs, package contents, missing targets appearing, and symlink
redirects. Warm runs retain prior dependency observations. Incomplete tracking
or unavailable fingerprints must reject stale reuse and persistence. Mutating a
returned graph must not contaminate saved analysis or another cache hit, and
unchanged immutable cache contents must not be rewritten.

Terminal clean-close tests preserve the original envelope, prevent reopening,
and verify that a later instance rejects changed dependencies or source files.
Dirty, invalid, and failed-write paths must retain ordinary reconciliation and
retry behavior. Sessions and watch never use terminal closure.

`test/util/graph-cache-serialization.test.ts` retains byte/shared-record coverage
for the serializer boundary and Buffer restoration for generic caches. Those
checks do not freeze the v3 graph-cache representation or global tag identity.

### Rust rewrite acceptance

Start with focused tests for the changed boundary. For the architecture rewrite,
acceptance also requires the full suite and installed Rip CLI correctness on
Node and Bun, across no-cache, cache population, and warm-cache paths. Compare
ordered issues, exit status, and fixes against the reference baseline; exclude
only explicitly variable timing/diagnostic output. Native differential and smoke
tests alone are not a full-suite or Rip receipt.

For a regression fix, confirm the new test fails for the reported reason with
the source change reverted, then restore the fix. Use isolated copies when a
shared checkout has concurrent work. Performance acceptance requires separate
paired CLI measurements as described in [PERFORMANCE.md](./PERFORMANCE.md);
passing correctness tests does not establish a speedup. Record commands,
revisions, runtimes, results, and remaining failures in the delivery report.
