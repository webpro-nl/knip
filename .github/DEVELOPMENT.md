# Development

Development in this repository is using:

- pnpm
- TypeScript
- oxc
- Rust, using the toolchain pinned in `packages/knip/native/rust-toolchain.toml`

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
- [Test Preview Packages][9]
- [Test VS Code Extension][10]

## Getting started

This guide assumes familiarity with concepts like [forking][11], [cloning a
repo][12] and working with a package manager.

- Fork the project using the [GitHub website][13] or the [`gh` CLI][14]
- Clone the repository
- Install dependencies
- Install Rust with rustup and put its Cargo bin directory on `PATH`

Example terminal commands on your machine to get started:

```shell
git clone git@github.com:[username]/knip.git
# Or using the GitHub CLI: gh repo fork webpro-nl/knip --clone
cd knip
pnpm install
cd packages/knip
pnpm build
pnpm test
```

To skip slower tests related to CLI and `--fix`, while still covering all the
essentials and plugins:

```shell
pnpm test --smoke
```

Note that Git `core.symlinks=true` is required for some tests.

## Agents

Using coding agents cq AI-powered tooling? Inform it about [AGENTS.md][15] and
read the [AI contribution policy][16]. Also [consider this before opening a pull
request][17].

## Contributing a plugin?

In addition to the generic guidelines in this document, there's a guide for
[writing a plugin][18].

## Running Knip

Knip uses Rust for core analysis and TypeScript for its host. Run the TypeScript
sources including your changes directly using Node.js v24+ or Bun.

Build the native addon once with `pnpm --dir packages/knip build:native`, and
rebuild it after changing Rust sources. Then run Knip without TypeScript
compilation:

```shell
node path/to/knip/packages/knip/src/cli.ts
```

### Alias

Set up an alias like so:

```shell
alias k="node --inspect ~/p/knip/packages/knip/src/cli.ts"
```

Invoke `k` to run Knip including any local changes. And if it's in the built-in
terminal, it will stop at breakpoints. For the rest of this document, `knip` or
`node --inspect` can be replaced with `k`.

## Tests

Most pull requests should probably include one or more tests.

Assuming you've created `test/feature.test.ts` and `fixtures/feature` (the
plugin create command does for you), here's a few ideas to run and debug Knip
from a test.

Creating a new plugin? The [plugin guide][19] has a command to set up a test
with fixtures for you.

### Run single test file

```shell
node --test test/my-feature.test.ts
bun test test/plugins/my-plugin.test.ts
```

### Run Knip in the directory

```shell
knip --directory fixtures/feature
```

### Attach debugger to Node.js

To debug Knip in an IDE (e.g. [VS Code][20] or [WebStorm][21]), open the
built-in terminal and allow the debugger to connect:

```shell
cd fixtures/feature
node --inspect ../../src/cli.ts
```

Make sure VS Code is set up to attach to the Node.js process ("Always" or "With
flag").

### Attach debugger from inside a test file

Run configurations for VS Code and WebStorm² are set up in the repo. This a
great way to debug almost anything in Knip.

- Using Node.js
  - From any test file, run the "Debug test with tsx/Node.js" launch config
- Using Bun
  - VS Code: ensure the [Bun extension][22] is enabled
  - WebStorm: ensure the [Bun plugin][23] is enabled
  - From any test file, run the "Debug test with Bun" launch config

From now on, just set a breakpoint and hit `F5` (Code) or `ctrl-r` (WS) from any
test file to run and debug.

² Requires at least WebStorm 2025.2 EAP

### Attach debugger to tests

In case you're wondering if or why some code is ever hit, attach the debugger to
each test. Set a breakpoint and run all tests in one of the following ways:

- From built-in terminal: `node --inspect --test test/**/*.test.ts`
- Use the "Debug all tests with Bun" launch config.

## QA

Knip has a few tools set up to verify code quality and to format code and
documentation:

```shell
pnpm fmt
pnpm lint
pnpm knip
pnpm knip --strict
pnpm test
```

## GitHub Action

The [ci.yml][24] workflow runs the tests across Bun, recent Node.js versions,
Ubuntu, macOS and Windows. QA in CI must be all green before a pull request can
be merged. The [integration.yml][25] workflow runs Knip in multiple repositories
using Knip, against the latest version of the code.

## Test Preview Packages

For pull requests and on each push, the [pkg.pr.new][26] bot posts preview URLs
for Knip, the language server, and MCP. Replace `PR_NUMBER` below with the pull
request number, or a published commit hash to test a specific revision.

Install the preview in the affected project with your package manager, for
example:

```shell
npm i -D https://pkg.pr.new/knip@PR_NUMBER
```

For a standalone language server, configure the LSP client to launch:

```shell
npm exec --yes --allow-remote=all --package=https://pkg.pr.new/@knip/language-server@PR_NUMBER -- knip-language-server --stdio
```

Use the client's usual transport. The server prefers project-local Knip; to test
its bundled fallback, use a project without a locally resolvable Knip.

## Native packages and releases

Published packages contain prebuilt addons; installing or running Knip does not
require Rust. Source builds use the pinned Rust toolchain and `Cargo.lock`.

Each native build writes a target-named addon and provenance manifest. The
manifest records the source fingerprint, Git revision, toolchain, build backend,
and checksums for every artifact file. Local `pnpm pack` accepts a fresh
host-only build for verification. Publication requires all 19 native targets
declared by the loader, including Windows ia32, and the WASI fallback. It
rejects incomplete, stale, mixed-revision, or dirty-source artifacts. The
ia32 target extends the 18 native targets shared by the parser and resolver;
the resolver can use its WASI fallback there.

The loader prefers the host addon and falls back to WASI when native addons
cannot load, including WebContainers and `node --no-addons`. The WASI artifact
contains the WebAssembly binary, generated loader and worker, bundled runtime,
and runtime license notices. It needs no Rust toolchain or runtime download.
The bundled runtime preserves UTF-16 code units across the N-API boundary.
Its build dependencies are pinned separately from Knip's unchanged Node range.

To build the fallback locally, install its Rust target and build after the
ordinary host build:

```shell
cd packages/knip/native
rustup target add wasm32-wasip1-threads
cd ..
pnpm build:wasi
```

The `Native release artifacts` workflow builds and aggregates the target
binaries from one revision, then tests the packed package on supported hosted
runners and Linux musl containers. The no-addons checks include Windows x64
and arm64, macOS, Linux, and Node 22.12 and 23.0. They provision the existing
OXC WASI packages for the OXC dependencies and simulate the WebContainer
process marker; they do not constitute an actual WebContainer test.
Other cross-compiled targets still need runtime acceptance on their respective
platforms. Workflow success does not
establish full runtime coverage for every target.

Before an existing release command, select a successful artifact workflow run
whose artifacts were built from the exact commit being released. The workflow's
selected ref can differ when its `revision` input is set:

```shell
export KNIP_NATIVE_RUN_ID=123456789
pnpm release
```

Alternatively, set `KNIP_NATIVE_ARTIFACTS` to an absolute path containing the
extracted `knip-native-<commit>` artifact. Keep this staging directory separate
from `packages/knip/native`: release preparation restores its validated binaries
after the ordinary local build. The existing version bumps, staged npm
publishing, extension publication, and tagging order are unchanged. One-package
core releases use the same collection and validation hooks.

For a local package check without publication:

```shell
pnpm --dir packages/knip build
pnpm --dir packages/knip pack --out /tmp/knip.tgz
npm install --prefix /tmp/knip-package-check --ignore-scripts /tmp/knip.tgz
node packages/knip/scripts/test-native-package.js /tmp/knip-package-check
```

Extension packaging validates the selected native target and includes a
validated WASI fallback when it has been built locally. Extension publication
requires the selected publication targets and WASI before changing package files.

## Test VS Code Extension

With Node.js v24+, pnpm, and [vsce][27] installed, check out the branch or pull
request to test, then run from the repository root:

```shell
pnpm install
pnpm --dir packages/mcp-server run prepack
pnpm --dir packages/vscode-knip package
```

Install the generated platform-specific `.vsix` from `packages/vscode-knip/`
using VS Code's "Extensions: Install from VSIX..." command, then reload the
window. This replaces the Marketplace version. To return to it, uninstall the
preview and reinstall Knip from the Marketplace.

[1]: #qa
[2]: #attach-debugger-from-inside-a-test-file
[3]: #getting-started
[4]: #agents
[5]: #contributing-a-plugin
[6]: #running-knip
[7]: #tests
[8]: #github-action
[9]: #test-preview-packages
[10]: #test-vs-code-extension
[11]: https://docs.github.com/get-started/quickstart/fork-a-repo
[12]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[13]: https://github.com/webpro-nl/knip
[14]: https://cli.github.com/
[15]: ../AGENTS.md
[16]: ../AI_POLICY.md
[17]: ./CONTRIBUTING.md#open-a-pull-request
[18]: https://knip.dev/guides/writing-a-plugin/
[19]: https://knip.dev/guides/writing-a-plugin#create-a-new-plugin
[20]: https://code.visualstudio.com/docs/nodejs/nodejs-debugging
[21]: https://www.jetbrains.com/help/webstorm/running-and-debugging-node-js.html
[22]: https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode
[23]: https://www.jetbrains.com/help/webstorm/bun.html#bun_before_you_start
[24]: https://github.com/webpro-nl/knip/actions/workflows/ci.yml
[25]: https://github.com/webpro-nl/knip/actions/workflows/integration.yml
[26]: https://pkg.pr.new
[27]: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#vsce
