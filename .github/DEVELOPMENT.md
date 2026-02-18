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

## Contents

- [Getting started][3]
- [Agents][4]
- [Contributing a plugin?][5]
- [Running Knip][6]
- [Tests][7]
- [QA][1]
- [GitHub Action][8]

## Getting started

This guide assumes familiarity with concepts like [forking][9], [cloning a
repo][10] and working with a package manager.

- Fork the project using the [GitHub website][11] or the [`gh` CLI][12]
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

Using coding agents cq AI-powered tooling? Inform it about [AGENTS.md][13]. Take
responsibility and make sure to not cause unnecessary review and "wall of text"
overhead to maintainers. Also [consider this before opening a pull request][14].

## Contributing a plugin?

In addition to the generic guidelines in this document, there's a guide for
[writing a plugin][15].

## Running Knip

Knip is written in TypeScript, and there are a few options to run it including
your changes:

- [Compile][16] ahead of time to JavaScript to run in Node.js
- [Without compilation][17]
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

Most pull requests should probably include one or more tests.

Assuming you've created `test/feature.test.ts` and `fixtures/feature` (the
plugin create command does for you), here's a few ideas to run and debug Knip
from a test.

Creating a new plugin? The [plugin guide][18] has a command to set up a test
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

To debug Knip in an IDE (e.g. [VS Code][19] or [WebStorm][20]), open the
built-in terminal and allow the debugger to connect:

```shell
cd fixtures/feature
tsx --inspect ../../src/cli.ts
```

Make sure VS Code is set up to attach to the Node.js process ("Always" or "With
flag").

### Attach debugger from inside a test file

Run configurations for VS Code and WebStorm² are set up in the repo. This a
great way to debug almost anything in Knip.

- Using Node.js
  - From any test file, run the "Debug test with tsx/Node.js" launch config
- Using Bun
  - VS Code: ensure the [Bun extension][21] is enabled
  - WebStorm: ensure the [Bun plugin][22] is enabled
  - From any test file, run the "Debug test with Bun" launch config

From now on, just set a breakpoint and hit `F5` (Code) or `ctrl-r` (WS) from any
test file to run and debug.

² Requires at least WebStorm 2025.2 EAP

### Attach debugger to tests

In case you're wondering if or why some code is ever hit, attach the debugger to
each test. Set a breakpoint and run all tests in one of the following ways:

- From built-in terminal: `tsx --inspect --test test/**/*.test.ts`
- Use the "Debug all tests with Bun" launch config.

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

The [ci.yml][23] workflow runs the tests across Bun, recent Node.js versions,
Ubuntu, macOS and Windows. QA in CI must be all green before a pull request can
be merged. The [integration.yml][24] workflow runs Knip in multiple repositories
using Knip, against the latest version of the code.

## Previews

Thanks to [pkg.pr.new][25] pull requests can be previewed by installing it as a
regular package. Every push is published to their registry. Look for the
`pkg-pr-new` bot in your pull request.

[1]: #qa
[2]: #attach-debugger-to-bun-from-a-test
[3]: #getting-started
[4]: #agents
[5]: #contributing-a-plugin
[6]: #running-knip
[7]: #tests
[8]: #github-action
[9]: https://docs.github.com/get-started/quickstart/fork-a-repo
[10]:
  https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[11]: https://github.com/webpro-nl/knip
[12]: https://cli.github.com/
[13]: ../AGENTS.md
[14]: ./CONTRIBUTING.md#open-a-pull-request
[15]: https://knip.dev/guides/writing-a-plugin/
[16]: #compile
[17]: #without-compilation
[18]: https://knip.dev/guides/writing-a-plugin#create-a-new-plugin
[19]: https://code.visualstudio.com/docs/nodejs/nodejs-debugging
[20]: https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html
[21]: https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode
[22]: https://www.jetbrains.com/help/webstorm/bun.html#bun_before_you_start
[23]: https://github.com/webpro-nl/knip/actions/workflows/ci.yml
[24]: https://github.com/webpro-nl/knip/actions/workflows/integration.yml
[25]: https://pkg.pr.new
