# Knip

## Project Overview

- Monorepo
- Main package is core in `packages/knip` (TypeScript)
- [Documentation][1] content in `packages/docs` (Astro + MD/MDX)

## General

- Don't add comments, unless explicitly asked for.
- For features and issues concerning the module graph, make sure to consult
  [ModuleGraph type definitions][2].

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

[1]: https://knip.dev
[2]: ./packages/knip/src/types/module-graph.ts
