# Knip

Knip is a tool to find and fix unused dependencies, exports and files in
JavaScript and TypeScript projects.

## Project Overview

- Monorepo
- Main package is core in `packages/knip` (TypeScript)
- Language Server in `packages/language-server` (JS + JSDoc for types)
- VS Code Extension in `packages/vscode-knip` (JS + JSDoc for types)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)

## General guidelines

- Verify your claims, do not make assumptions after failed actions (like a file
  read or fetched resource/URL). Inform the user.
- Don't add comments, unless explicitly asked for.
- Performance is key, both high level (design) and low level (impl).
- Use `--performance` or `--performance-fn [name]` to profile (→ [timerify][2])
- For features and issues concerning the module graph, make sure to consult
  [ModuleGraph type definitions][3].

## Implementation

- Avoid redundant code and abstractions.
- Avoid unnecessary complexity and nesting.
- Concise one-liners are fine, but prioritize clarity over cleverness.
- JavaScript
  - Prefer plain `for..in/of` loops over iterator methods like `map`/`reduce`.
- TypeScript
  - Avoid `any` and type casting (`as`)
  - Avoid runtime overhead just to get the types right

## Debug

- Important: debug, don't guess.
- [Run Knip without compilation][4]
- Run `knip` directly in a fixture or temp directory (over creating test scripts
  that import the `main` function). Knip requires `package.json` in root dir.
- Enable [debug & helpers][5] with `--debug` (not `DEBUG=`). Warning: noisy.
- Use [trace][6] to debug
  - Exported identifiers (`knip --trace-export [name] --trace-file [file]`)
  - External dependencies (`knip --trace-dependency [name] --workspace [dir]`)

## Run without compilation

On the system, `k` should be a global alias for
`node --inspect ~/p/knip/knip/packages/knip/src/cli.ts` to run Knip without
having to compile it first. If that's not available, run the CLI directly using
`node` or `bun`. The rest of this document shows `knip` in commands for
consistency, replace it with `k` or `node ../../src/cli.ts` or
`bun ../../src/cli.ts`.

## Build

To type-check `knip` with `tsc`:

```sh
cd packages/knip
pnpm build
```

## Test

Don't run all tests at once (slow & noisy). Start out with running the relevant
test(s) first, e.g.:

```sh
cd packages/knip
node --test test/commonjs.test.ts
bun test test/util/get-inputs-from-scripts.test.ts
```

To run all relevant tests without having to build `knip`:

```sh
cd packages/knip
pnpm run test:bun:smoke
```

If Bun is not available, use `node` instead:

```sh
cd packages/knip
node --test test/commonjs.test.ts
pnpm test:smoke
```

Build core package and run all tests only if there are changes in auto-fix,
formatting and reporter related functionality:

```sh
cd packages/knip
pnpm build
pnpm test
```

## Fixtures

There are plenty of directories with fixtures in `packages/knip/fixtures`.

- In general, a test has its own fixture directory.
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
knip # or k
```

## Issues and Pull Requests

- Find repositories/CodeSandbox/StackBlitz source files and local fixtures to
  actually reproduce the issue at hand.
- To fetch stackblitz.com reproduction url:
  `pnpx stackblitz-zip https://stackblitz.com/edit/{name} {filename}.zip`

## Implementation walk-through

The sequence from [CLI][7]:

1. [Create options][8]
2. [Run][9]
   1. Normalize user config
   2. Get workspaces
   3. [Build module graph][10]
      1. [Run enabled plugins][11] in each workspace
      2. Store entry points and referenced dependencies
      3. [Create TS programs][12]
      4. [Get imports and exports][13] using TS AST traversal/visitors
      5. [Get dependencies/binaries from scripts][14]
   4. [Analyze module graph][15]
      1. Find [unused exports][16] (respecting [namespaces & members][17])
      2. Settle unused files
      3. [Settle unused/unlisted dependencies][18]
      4. Settle unused catalog entries
3. [Run default reporter][19]

## Plugins

If requested to create a new plugin for a certain package/tool/framework:

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from the `packages/knip` directory.
- Must read [Writing A Plugin][20] first to understand:
  - Plugin responsibilities
  - Functions like `resolveConfig` and `Input` type definition
  - Consider `resolveFromAST` only for custom plugin-specific needs (core takes
    care of module resolution, imports, exports, external dependencies)
- Update the plugin's `types.ts`: add only relevant types, remove if unused.
- Consult similar plugins and the tool's website before implementation
- Update and fill out the blanks in the generated files.
- Remove unused variables and empty arrays from the template
- Don't forget: [run tests][21] individually first.

[1]: https://knip.dev
[2]: ./packages/knip/src/util/Performance.ts
[3]: ./packages/knip/src/types/module-graph.ts
[4]: #run-without-compilation
[5]: ./packages/knip/src/util/debug.ts
[6]: ./packages/docs/src/content/docs/guides/troubleshooting.md#trace
[7]: ./packages/knip/src/cli.ts
[8]: ./packages/knip/src/util/create-options.ts
[9]: ./packages/knip/src/run.ts
[10]: ./packages/knip/src/graph/build.ts
[11]: ./packages/knip/src/WorkspaceWorker.ts
[12]: ./packages/knip/src/ProjectPrincipal.ts
[13]: ./packages/knip/src/typescript/get-imports-and-exports.ts
[14]: ./packages/knip/src/binaries/bash-parser.ts
[15]: ./packages/knip/src/graph/analyze.ts
[16]: ./packages/knip/src/graph-explorer/operations/is-referenced.ts
[17]:
  ./packages/knip/src/graph-explorer/operations/has-strictly-ns-references.ts
[18]: ./packages/knip/src/DependencyDeputy.ts
[19]: ./packages/knip/src/reporters/symbols.ts
[20]: ./packages/docs/src/content/docs/writing-a-plugin/index.md
[21]: #test
