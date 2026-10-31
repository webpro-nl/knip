# Knip

Knip is a tool to find and fix unused dependencies, exports and files in
JavaScript and TypeScript projects.

## Project overview

- Monorepo, managed with pnpm
- Main package is core in `packages/knip` (TypeScript)
- Language Server in `packages/language-server` (JS + JSDoc for types)
- VS Code Extension in `packages/vscode-knip` (JS + JSDoc for types)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)
- Tracked `.agents` guides live in the checkout; there might be shared lessons
  and tasks in the workspace's `.agents`.

## Code style

- Performance is key, both high level (design) and low level (impl).
- Avoid redundant code and abstractions; avoid unnecessary complexity and
  nesting.
- Concise one-liners are fine, but prioritize clarity over cleverness.
- Don't add comments to code, unless explicitly asked for.
- Prefer AST-based tools and codemods (jscodeshift) over manual or regex-based
  refactors — except for tiny edits.
- JavaScript
  - Prefer plain `for..in/of` loops over iterator methods like `map`/`reduce`.
- TypeScript
  - Avoid `any` and type casting (`as`).
  - Avoid runtime overhead just to get the types right.
- Lint and check formatting from root: `pnpm run ci`; format with `pnpm fmt`
- Format Markdown/MDX with `pnpm remark` from the root (auto-numbers link refs,
  validates links); for one file use `pnpm exec remark <file> --frail`

## Domain Knowledge

- Unused file → unused exports/dependencies is a chain, not a bug
- Non-JS/TS files (.css, .mdx, .vue) enter the graph via (usually
  plugin-registered) compilers (`registerCompilers`)
- Library-specific AST patterns are caught by plugin-registered visitors
  (`registerVisitors`)
- `entry` and `project` patterns (including negations) define what is analyzed;
  `ignore` only suppresses issues in analyzed files, so fix false positives in
  the scope ([configuring project files][2]).
- Gitignored files are left out of globbed entry and project files, but stay in
  the graph when imported.
- Use `--performance` or `--performance-fn [name]` to profile (→ [timerify][3])
- If creating, modifying, or reviewing a plugin, read [PLUGINS.md][4] first.
- If modifying core module graph, AST traversal, or CLI sequence, read
  [MODULE-GRAPH.md][5] first.
- For issues re. exported identifiers (following refs, shadowing,
  `ignoreExportsUsedInFile`), see [EXPORTS.md][6].
- Before any significant performance tuning, consult [PERFORMANCE.md][7].
- When modifying or reviewing built-in compilers, read [COMPILERS.md][8].
- For test/fixture structure, conventions, and where a new test goes, see
  [TESTS.md][9].

## Issues and Pull Requests

- Use `gh` for PR metadata, diffs, comments, and checks. Reuse retrieved
  evidence; browse upstream documentation separately.
- When given a bug report, first confirm the behavior is actually wrong.
  Reproduce, then check if the reported behavior is correct-by-design before
  writing any fix.
- Before fixing a case, check that it occurs in code or configuration people
  actually write. A correct fix for a contrived case is still code to maintain.
- Find repositories/CodeSandbox/StackBlitz source files and local fixtures to
  actually reproduce the issue at hand.
- To fetch a stackblitz.com reproduction: `pnpx stackblitz-zip
https://stackblitz.com/edit/{name} {filename}.zip`
- For a fix, revert the source change and confirm the new test fails for the
  reported reason.
- For a new plugin or a change in how a tool finds files, verify against the
  tool's source, not only its docs, and run Knip on the tool's examples or
  starters when available.
- Follow the [AI contribution policy][10]: before opening an issue or PR, make
  sure the person you work for understands and stands behind it. Keep
  descriptions concise.
- Breaking changes, such as dropping a Node.js version (#1853), wait for the
  next major. Check for an issue or PR that already owns them.
- Ecosystem snapshots (`.github/workflows/snapshots/`): confirm each new finding
  is real, then commit as `Update <tool> snapshot`. When an upstream repository
  breaks its job, pin its `ref` in `integration.yml` to the last passing commit.

## Run & Debug

Important: debug, don't guess.

Run the CLI directly using `node` or `bun`. This document shows `knip` in
commands for consistency. Replace it with `node (path/to/)src/cli.ts` or `bun
(path/to/)src/cli.ts` and keep using what works.

- Run `knip` directly in a fixture or temp directory (over creating test scripts
  that import the `main` function).
- Knip requires `package.json` in root dir.
- Enable [debug & helpers][11] with `--debug` (not `DEBUG=`). Warning: noisy.
- Use [trace][12] to debug
  - exported identifiers (`knip --trace-export [name] --trace-file [file]`)
  - external dependencies (`knip --trace-dependency [name] --workspace [dir]`)

## Test

Prefer TDD: add or update tests (and fixtures) before implementing.

Prefer `bun` over `node` for speed. Don't run all tests at once (slow & noisy).
Start out with running the relevant test(s) first:

```sh
cd packages/knip
bun test test/util/get-inputs-from-scripts.test.ts
node --test test/commonjs.test.ts
```

Run smoke tests with Bun:

```sh
cd packages/knip
pnpm test --runtime bun --smoke
```

Run smoke tests with Node.js:

```sh
cd packages/knip
node --test test/commonjs.test.ts
pnpm test --runtime node --smoke
```

Build core package and run all tests only if there are changes in auto-fix,
formatting and reporter related functionality:

```sh
cd packages/knip
pnpm build
pnpm test
```

Before pushing, run `pnpm qa` in `packages/knip` (lint, build, dogfood, all
tests), also for fixture-only changes: fixtures are shared across tests.

See [TESTS.md][9] for test and fixture conventions and placements.

## Build

To type-check `knip` with `tsc`:

```sh
cd packages/knip
pnpm build
```

CI also type-checks against TypeScript 5.0.4 (`ci-legacy-5.0.4.yml`), which
`pnpm build` can't catch. It doesn't narrow through an optional chain, so bind
`o?.x` to a local before guarding it; missing runtime API declarations go in
`typescript-5.0.d.ts`.

[1]: https://knip.dev
[2]: ./packages/docs/src/content/docs/guides/configuring-project-files.md
[3]: ./packages/knip/src/util/Performance.ts
[4]: ./.agents/PLUGINS.md
[5]: ./.agents/MODULE-GRAPH.md
[6]: ./.agents/EXPORTS.md
[7]: ./.agents/PERFORMANCE.md
[8]: ./.agents/COMPILERS.md
[9]: ./.agents/TESTS.md
[10]: ./AI_POLICY.md
[11]: ./packages/knip/src/util/debug.ts
[12]: ./packages/docs/src/content/docs/guides/troubleshooting.md#trace
