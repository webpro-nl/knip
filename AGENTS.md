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

- Don't add comments, unless explicitly asked for.
- For features and issues concerning the module graph, make sure to consult
  [ModuleGraph type definitions][2].

## Implementation walk-through

The sequence from [CLI][3]:

1. [Create options][4]
2. [Run][5]
   1. Normalize user config
   2. Get workspaces
   3. [Build module graph][6]
      1. [Run enabled plugins][7] in each workspace
      2. Store entry points and referenced dependencies
      3. [Create TS programs][8]
      4. [Get imports and exports][9] using TS AST traversal/visitors
      5. [Get dependencies/binaries from scripts][10]
   4. [Analyze module graph][11]
      1. Find [unused exports][12] (respecting [namespaces & members][13])
      2. Settle unused files
      3. [Settle unused/unlisted dependencies][14]
      4. Settle unused catalog entries
3. [Run default reporter][15]

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
bun test test/commonjs.test.ts
bun test test/util/get-inputs-from-scripts.test.ts
```

To run all relevant tests without having to build `knip`:

```sh
cd packages/knip
pnpm run test:bun:smoke
```

If Bun is not available, use `tsx` instead:

```sh
cd packages/knip
tsx --test test/commonjs.test.ts
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

There are plenty of directories with fixtures in `packages/knip/fixtures`. In
general, a test has its own fixture dir. For debugging, it might be useful to
run Knip from the fixture directory and see output in terminal.

```sh
cd packages/knip/fixtures/commonjs
k
```

On the system, `k` is a global alias for
`tsx --inspect ~/p/knip/knip/packages/knip/src/cli.ts` to run Knip without
having to build/compile it first. If that's not available, run e.g.
`bun ../../src/cli.ts`.

## Plugins

If requested to create a new plugin for a certain package/tool/framework:

- Come up with a kebab-cased `name`.
- Run `pnpm create-plugin --name [name]` from the `packages/knip` directory.
- Must read [Writing A Plugin][16] first to understand plugin responsibilities
  and `Input[]` plugin functions like `resolveConfig` return.
- Update the plugin's `types.ts`: add only relevant types, remove if unused.
- Consult similar plugins and the tool's website to implement the plugin.
- Update and fill out the blanks in the new files.
- Don't forget: [run tests][17] individually first

[1]: https://knip.dev
[2]: ./packages/knip/src/types/module-graph.ts
[3]: ./packages/knip/src/cli.ts
[4]: ./packages/knip/src/util/create-options.ts
[5]: ./packages/knip/src/run.ts
[6]: ./packages/knip/src/graph/build.ts
[7]: ./packages/knip/src/WorkspaceWorker.ts
[8]: ./packages/knip/src/ProjectPrincipal.ts
[9]: ./packages/knip/src/typescript/get-imports-and-exports.ts
[10]: ./packages/knip/src/binaries/bash-parser.ts
[11]: ./packages/knip/src/graph/analyze.ts
[12]: ./packages/knip/src/graph-explorer/operations/is-referenced.ts
[13]:
  ./packages/knip/src/graph-explorer/operations/has-strictly-ns-references.ts
[14]: ./packages/knip/src/DependencyDeputy.ts
[15]: ./packages/knip/src/reporters/symbols.ts
[16]: ./packages/docs/src/content/docs/writing-a-plugin/index.md
[17]: #test
