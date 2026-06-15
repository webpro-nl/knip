# Knip

Knip is a tool to find and fix unused dependencies, exports and files in
JavaScript and TypeScript projects.

## Project overview

- Monorepo, managed with pnpm
- Main package is core in `packages/knip` (TypeScript)
- Language Server in `packages/language-server` (JS + JSDoc for types)
- VS Code Extension in `packages/vscode-knip` (JS + JSDoc for types)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)

## Code style

- Performance is key, both high level (design) and low level (impl).
- Avoid redundant code and abstractions; avoid unnecessary complexity and nesting.
- Concise one-liners are fine, but prioritize clarity over cleverness.
- Don't add comments to code, unless explicitly asked for.
- Prefer AST-based tools and codemods (jscodeshift) over manual or regex-based refactors — except for tiny edits.
- JavaScript
  - Prefer plain `for..in/of` loops over iterator methods like `map`/`reduce`.
- TypeScript
  - Avoid `any` and type casting (`as`).
  - Avoid runtime overhead just to get the types right.
- Format Markdown/MDX with `pnpm remark` in `packages/docs` (auto-numbers link refs, validates links)

## Domain Knowledge

- Unused file → unused exports/dependencies is a chain, not a bug
- Use `--performance` or `--performance-fn [name]` to profile (→ [timerify][2])
- If creating or modifying a plugin, read [PLUGINS.md][3] first.
- If modifying core module graph, AST traversal, or CLI sequence, read [MODULE-GRAPH.md][4] first.
- For issues re. exported identifiers (following refs, shadowing, `ignoreExportsUsedInFile`), see [EXPORTS.md][5].
- Before any significant performance tuning, consult [PERFORMANCE.md][6].
- For test/fixture structure, conventions, and where a new test goes, see [TESTS.md][7].

## Issues and Pull Requests

- When given a bug report, first confirm the behavior is actually wrong. Reproduce, then check if the reported behavior is correct-by-design before writing any fix.
- Find repositories/CodeSandbox/StackBlitz source files and local fixtures to actually reproduce the issue at hand.
- To fetch a stackblitz.com reproduction: `pnpx stackblitz-zip https://stackblitz.com/edit/{name} {filename}.zip`

## Run & Debug

Important: debug, don't guess.

Run the CLI directly using `node` or `bun`. This document shows `knip` in
commands for consistency. Replace it with `node (path/to/)src/cli.ts` or
`bun (path/to/)src/cli.ts` and keep using what works.

- Run `knip` directly in a fixture or temp directory (over creating test scripts that import the `main` function).
- Knip requires `package.json` in root dir.
- Enable [debug & helpers][8] with `--debug` (not `DEBUG=`). Warning: noisy.
- Use [trace][9] to debug
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

See [TESTS.md][7] for conventions and placements.

## Fixtures

There are plenty of directories with fixtures in `packages/knip/fixtures`.

- In general, tests have their own fixture directory.
- Plugin fixture directories at `packages/knip/fixtures/plugins/[plugin-name]*`.
- For trivial changes or fixes, extend an existing fixture.
- Don't use "foo" or vague names. One fixture should consist of descriptive file
  and variable names like `module.ts` and `barrel.ts`, or build upon a "theme"
  such as fruits or animals to indicate relation/hierarchy.
- Use empty files if sufficient (e.g. to verify import specifier or entry file).
- For debugging, it might be useful to run Knip from the fixture directory and
  see output in terminal. Example:

```sh
cd packages/knip/fixtures/commonjs
knip
```

## Build

To type-check `knip` with `tsc`:

```sh
cd packages/knip
pnpm build
```

[1]: https://knip.dev
[2]: ./packages/knip/src/util/Performance.ts
[3]: ./.agents/PLUGINS.md
[4]: ./.agents/MODULE-GRAPH.md
[5]: ./.agents/EXPORTS.md
[6]: ./.agents/PERFORMANCE.md
[7]: ./.agents/TESTS.md
[8]: ./packages/knip/src/util/debug.ts
[9]: ./packages/docs/src/content/docs/guides/troubleshooting.md#trace
