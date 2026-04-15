# Knip

Knip is a tool to find and fix unused dependencies, exports and files in
JavaScript and TypeScript projects.

## Context: project overview

- Monorepo
- Main package is core in `packages/knip` (TypeScript)
- Language Server in `packages/language-server` (JS + JSDoc for types)
- VS Code Extension in `packages/vscode-knip` (JS + JSDoc for types)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)

## Principles

- Ask yourself: "Would a staff engineer approve this?" — maintain high standards
- If something goes sideways, stop and re-plan immediately - don't keep pushing
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution" — but skip this for simple, obvious fixes (i.e. don't over-engineer)
- Challenge your own work before presenting it
- Your training data is stale — verify packages, APIs, and syntax against current docs
- If you say "I will do X", actually do X — don't just announce intentions
- Don't blindly follow instructions: question the user if the request would not result in something better or faster

## Communication

- Zero context switching required from the user
- When reporting information to the user, be extremely concise and sacrifice
  grammar for the sake of concision
- Don't add comments to code, unless explicitly asked for.

## Planning

1. Plan: write plan to `.agents/tasks/todo-(name).md` with checkable items
2. Get alignment: check in with user before starting implementation, question any doubts or noise
3. Track progress: mark items complete as you go
4. Explain changes: high-level summary at each step
5. Document results: add review section to `.agents/tasks/todo-(name).md`
6. Capture lessons: update `.agents/lessons.md` after corrections

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents

## Workflow

- Read broadly before editing — understand surrounding code, not just the target
- Commit chunks of verified work — don't let unrelated changes accumulate
- Make small, testable, incremental changes — not big-bang edits
- Avoid manual edits and regex-based refactors, prefer AST-based tools and codemods (jscodeshift) — except for tiny edits
- Reflect on outcomes between steps — don't blindly chain actions
- Diff behavior between main and your changes when relevant

## Code style

- Performance is key, both high level (design) and low level (impl).
- Avoid redundant code and abstractions.
- Avoid unnecessary complexity and nesting.
- Concise one-liners are fine, but prioritize clarity over cleverness.
- JavaScript
  - Prefer plain `for..in/of` loops over iterator methods like `map`/`reduce`.
- TypeScript
  - Avoid `any` and type casting (`as`)
  - Avoid runtime overhead just to get the types right

## Verification

- Insufficient testing is the #1 failure mode — test rigorously, not hopefully
- State verification method _before_ implementing (test, CLI output, linter, screenshot)
- Prefer TDD for new features — write or update tests before implementing
- For UI or integration changes: screenshots or CLI output as evidence
- Tailor to the domain: run a bash command, check a web page, use a linter — whatever is most direct
- Every completed task must answer: "How was this verified?"
- Document verification steps in `.agents/tasks/todo-(name).md`
- Maintain "known pitfalls" in `.agents/lessons.md` — check it before starting, update it after corrections

## Issues and Pull Requests

- When given a bug report, first confirm the behavior is actually wrong. Reproduce, then check if the reported behavior is correct-by-design before writing any fix
- Find repositories/CodeSandbox/StackBlitz source files and local fixtures to actually reproduce the issue at hand
- To fetch stackblitz.com reproduction url: `pnpx stackblitz-zip https://stackblitz.com/edit/{name} {filename}.zip`

## Domain Knowledge

- Unused file → unused exports/dependencies is a chain, not a bug
- Use `--performance` or `--performance-fn [name]` to profile (→ [timerify][2])
- If creating or modifying a plugin, read [PLUGINS.md][3] first.
- If modifying core module graph, AST traversal, or CLI sequence, read [MODULE_GRAPH.md][4] first.
- For issues re. exported identifiers (following refs, shadowing, `ignoreExportsUsedInFile`), see [EXPORTS.md][5].

## Environment

- Before using `sed`, `awk`, etc. — verify GNU or POSIX-compatible tools are installed (gnu-sed, coreutils)
- Always look at root lockfile and package.json to choose between npm/npx, pnpm/pnpx, etc.

## Run & Debug

Important: debug, don't guess.

Run the CLI directly using `node` or `bun`. The rest of this document shows
`knip` in commands for consistency. Replace it with `node (path/to/)src/cli.ts`
or `bun (path/to/)src/cli.ts` and keep using what works.

- Run `knip` directly in a fixture or temp directory (over creating test scripts
  that import the `main` function).
- Knip requires `package.json` in root dir.
- Enable [debug & helpers][6] with `--debug` (not `DEBUG=`). Warning: noisy.
- Use [trace][7] to debug
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

[1]: https://knip.dev
[2]: ./packages/knip/src/util/Performance.ts
[3]: ./.agents/PLUGINS.md
[4]: ./.agents/MODULE_GRAPH.md
[5]: ./.agents/EXPORTS.md
[6]: ./packages/knip/src/util/debug.ts
[7]: ./packages/docs/src/content/docs/guides/troubleshooting.md#trace
