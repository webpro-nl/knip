# Development

Development in this repository is using:

- pnpm
- TypeScript
- Biome

This document describes commands and tasks that might help during development.
Use what fits your workflow best, but make sure [QA][1] passes.

> [!TIP]
>
> tl;dr The quickest way to get started: `git clone`, `pnpm install`, find a
> relevant test file in `packages/knip/test`, and [hit F5 in VS Code or
> WebStorm][2].

## Getting started

This guide assumes familiarity with concepts like [forking][3] and [cloning a
repo][4], and working with a package manager.

- Fork the project using the [GitHub website][5] or the [`gh` CLI][6]
- Clone the repository
- Install dependencies

Example terminal commands on your machine to get started:

```shell
git clone git@github.com:[username]/knip.git
# Or using gh CLI: gh repo fork webpro-nl/knip --clone
cd knip
pnpm install
cd packages/knip
pnpm build
pnpm test
```

To skip slower tests related to CLI and `--fix`, while still covering all the
essentials and plugins:

```shell
pnpm test:smoke
bun test:bun:smoke
```

## Agents

Using coding agents cq AI-powered tooling? Inform it about [AGENTS.md][7]. Take
responsibility and make sure to not cause unnecessary review and "wall of text"
overhead to maintainers. Also [consider this before opening a pull request][8].

## Contributing a plugin?

In addition to the generic guidelines in this document, there's a guide for
[writing a plugin][9].

## Running Knip

Knip is written in TypeScript, and there are a few options to run it including
your changes:

- [Compile][10] ahead of time to JavaScript to run in Node.js
- [Without compilation][11]
  - Transpile on the fly using e.g `tsx` to run in Node.js
  - Use a runtime that supports TypeScript (i.e. Bun)

### Compile

Use `pnpm build` to compile using `tsc` once. To recompile on changes:

```shell
pnpm watch
```

On source code changes, `tsc` will compile to JavaScript, and the `knip`
executable is available globally to run from any directory.

### Without compilation

To run Knip without compilation, use e.g. `bun` or `tsx`:

```shell
npx tsx path/to/knip/packages/knip/src/cli.ts
```

#### Alias

Expanding on this idea, install `tsx` globally and set up an alias like so:

```shell
alias k="tsx --inspect ~/p/knip/packages/knip/src/cli.ts"
```

Invoke `k` to run Knip including any local changes. And if it's in the built-in
terminal, it will stop at breakpoints. For the rest of this document, `knip` or
`tsx --inspect` can be replaced with `k`.

## Tests

Pull requests should include one or more tests.

Assuming you've created `test/feature.test.ts` and `fixtures/feature` (the
plugin create command does for you), here's a few ideas to run and debug Knip
from a test.

Creating a new plugin? The [plugin guide][12] has a command to set up a test
with fixtures for you.

### Run single test file

```shell
tsx --test test/my-feature.test.ts
bun test test/plugins/my-plugin.test.ts
```

### Run Knip in the directory

```shell
knip --directory fixtures/feature
```

### Attach debugger to Node.js

To debug Knip in an IDE (e.g. [VS Code][13] or [WebStorm][14]), open the
built-in terminal and allow the debugger to connect:

```shell
cd fixtures/feature
tsx --inspect ../../src/cli.ts
```

Make sure VS Code is set up to attach to the Node.js process ("Always" or "With
flag").

### Attach debugger to Bun from a test

Run configurations for VS Code and WebStorm² are set up in the repo. This a
great way to debug almost anything in Knip:

- VS Code: ensure the [Bun extension][15] is enabled
- WebStorm: ensure the [Bun plugin][16] is enabled
- Optionally set a breakpoint anywhere in source or test code
- From any test file, run the "Debug Bun test" run configuration

From now on, just hit `F5` (Code) or `ctrl-r` (WS) from any test file to run and
debug.

² Requires at least WebStorm 2025.2 EAP

### Attach debugger to Node.js from a test

Run configurations for VS Code and WebStorm are set up in the repo.

- Optionally set a breakpoint anywhere in source or test code
- From any test file, run the "Debug Node test" run configuration

From now on, just hit `F5` (Code) or `ctrl-r` (WS) from any test file to run and
debug.

### Attach debugger to tests

In case you're wondering if or why some code is ever hit, attach the debugger to
each test. Set a breakpoint and run all tests (warning: slow):

```shell
tsx --inspect --test test/**/*.test.ts
```

## QA

Knip has a few tools set up to verify code quality and to format code and
documentation:

```shell
pnpm format
pnpm lint
pnpm knip
pnpm knip --strict
pnpm test
```

## GitHub Action

The [ci.yml][17] workflow runs the tests across Bun, recent Node.js versions,
Ubuntu, macOS and Windows. QA in CI must be all green before a pull request can
be merged. The [integration.yml][18] workflow runs Knip in multiple repositories
using Knip, against the latest version of the code.

## Previews

Thanks to [pkg.pr.new][19] pull requests can be previewed by installing it as a
regular package. Every push is published to their registry. Look for the
`pkg-pr-new` bot in your pull request.

[1]: #qa
[2]: #attach-debugger-to-bun-from-a-test
[3]: https://docs.github.com/get-started/quickstart/fork-a-repo
[4]:
  https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[5]: https://github.com/webpro-nl/knip
[6]: https://cli.github.com/
[7]: ../AGENTS.md
[8]: ./CONTRIBUTING.md#open-a-pull-request
[9]: https://knip.dev/guides/writing-a-plugin/
[10]: #compile
[11]: #without-compilation
[12]: https://knip.dev/guides/writing-a-plugin#create-a-new-plugin
[13]: https://code.visualstudio.com/docs/nodejs/nodejs-debugging
[14]: https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html
[15]: https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode
[16]: https://www.jetbrains.com/help/webstorm/bun.html#bun_before_you_start
[17]: https://github.com/webpro-nl/knip/actions/workflows/ci.yml
[18]: https://github.com/webpro-nl/knip/actions/workflows/integration.yml
[19]: https://pkg.pr.new
