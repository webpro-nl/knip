# Knip

Knip is a tool to find and fix unused dependencies, exports and files in
JavaScript and TypeScript projects.

## Context: project overview

- Monorepo
- Main package is core in `packages/knip` (TypeScript)
- Language Server in `packages/language-server` (JS + JSDoc for types)
- VS Code Extension in `packages/vscode-knip` (JS + JSDoc for types)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)

## Core behavior and constraints

- If something goes sideways, stop and re-plan immediately - don't keep pushing
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?" — maintain high standards
- Run tests, check logs, demonstrate correctness
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant
  solution" — skip this for simple, obvious fixes; don't over-engineer
- Challenge your own work before presenting it
- Point at logs, errors, failing tests - then resolve them

## Output formatting: communication with user

- Don't add comments to code, unless explicitly asked for.
- Zero context switching required from the user
- When reporting information to the user, be extremely concise and sacrifice
  grammar for the sake of concision

## Planning: task management

1. Plan: write plan to `.agents/tasks/todo-(name).md` with checkable items
2. Verify: check in before starting implementation
3. Track progress: mark items complete as you go
4. Explain changes: high-level summary at each step
5. Document results: add review section to `.agents/tasks/todo-(name).md`
6. Capture lessons: Update `.agents/lessons.md` after corrections

## Implementation

- Performance is key, both high level (design) and low level (impl).
- Use `--performance` or `--performance-fn [name]` to profile (→ [timerify][2])
- Avoid redundant code and abstractions.
- Avoid unnecessary complexity and nesting.
- Concise one-liners are fine, but prioritize clarity over cleverness.
- JavaScript
  - Prefer plain `for..in/of` loops over iterator methods like `map`/`reduce`.
- TypeScript
  - Avoid `any` and type casting (`as`)
  - Avoid runtime overhead just to get the types right
- For features and issues concerning the module graph, make sure to consult
  [ModuleGraph type definitions][3].

## Issues and Pull Requests

- When given a bug report: just fix it and don't ask for hand-holding
- Find repositories/CodeSandbox/StackBlitz source files and [local fixtures][4]
  to actually reproduce the issue at hand.
- To fetch stackblitz.com reproduction url:
  `pnpx stackblitz-zip https://stackblitz.com/edit/{name} {filename}.zip`

## Run & Debug

Important: debug, don't guess.

Run the CLI directly using `node` or `bun`. The rest of this document shows
`knip` in commands for consistency. Replace it with `node (path/to/)src/cli.ts`
or `bun (path/to/)src/cli.ts` and keep using what works.

- Run `knip` directly in a fixture or temp directory (over creating test scripts
  that import the `main` function).
- Knip requires `package.json` in root dir.
- Enable [debug & helpers][5] with `--debug` (not `DEBUG=`). Warning: noisy.
- Use [trace][6] to debug
  - exported identifiers (`knip --trace-export [name] --trace-file [file]`)
  - external dependencies (`knip --trace-dependency [name] --workspace [dir]`)

## Test

Prefer `bun` over `node` for speed. Don't run all tests at once (slow & noisy).
Start out with running the relevant test(s) first:

```sh
cd packages/knip
bun test test/util/get-inputs-from-scripts.test.ts
node --test test/commonjs.test.ts
```

To run all relevant tests without having to build `knip`:

```sh
cd packages/knip
pnpm run test:bun:smoke
```

Use `node` if Bun is not available:

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

## Domain Knowledge

- If creating or modifying a plugin, read [PLUGINS.md][7] first.
- If modifying core module graph, AST traversal, or CLI sequence, read
  [MODULE_GRAPH.md][8] first.

[1]: https://knip.dev
[2]: ./packages/knip/src/util/Performance.ts
[3]: ./packages/knip/src/types/module-graph.ts
[4]: ./packages/knip/fixtures
[5]: ./packages/knip/src/util/debug.ts
[6]: ./packages/docs/src/content/docs/guides/troubleshooting.md#trace
[7]: ./.agents/PLUGINS.md
[8]: ./.agents/MODULE_GRAPH.md
