# Development

Development in this repository is using:

- Bun
- TypeScript
- Biome

You should have Bun installed, the rest comes with `bun install`.

## Getting started

This guide assumes familiarity with concepts like [forking][1] and [cloning a
repo][2] and working with npm.

- Fork the project (e.g. using the [GitHub website][3] or the [gh CLI][4])
- Clone the repository
- Install dependencies

Example terminal commands:

```shell
gh repo fork webpro-nl/knip --clone
cd knip
bun install
cd packages/knip
bun run build
bun run test
```

Depending on the goals and the way you like to work, below are a few things that
might help during development:

## Plugins

There's a separate guide for [writing a plugin][5].

## Watcher

```shell
bun watch
```

Changes in the source code are now automatically picked up, and `knip` is
available globally to run from any directory.

## Debugging

### IDE

- Open the Knip source repository
- Set a breakpoint in Knip source code
- In the built-in terminal, cd to your project
- Enable e.g. "auto-attach" to Node.js process or "only attach with flag"
- Run:

```shell
tsx --inspect path/to/knip/packages/knip/src/cli.ts
```

## Fixtures & Tests

Pull requests should include one or more tests. See the `tests` and `fixtures`
directories to find relevant files that you may want to borrow or copy from.

Assuming you've created `fixtures/feature` and `test/feature.test.ts`, from the
`packages/knip` location, here's 4 ways to run it:

### 1. Run the test

```shell
bun test ./test/feature.test.ts
```

### 2. Run Knip in the directory

```shell
knip --directory fixtures/feature
```

### 3. Attach debugger to Node.js

Attach to Node.js process launched in terminal in IDE, and then:

```shell
cd fixtures/feature
tsx --inspect ../../src/cli.ts
```

### 4. VS Code: Attach to Bun

- Install the
  [VS Code Bun extension](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
  if you haven't already
- Set a breakpoint and start Knip with Bun while waiting for the debugger to be
  attached:

```shell
cd fixtures/feature
bun --inspect-wait=127.0.0.1:6499/knip run ../../src/cli.ts
```

Then run the "Attach to Bun" launch configuration.

### 5. VS Code: Attach debugger to Bun from a test

- Install the
  [VS Code Bun extension](https://marketplace.visualstudio.com/items?itemName=oven.bun-vscode)
  if you haven't already
- Set a breakpoint and run the "Debug Bun test" launch configuration while in
  any test file.

### Attach debugger to tests

In case you're wondering if/why some code is ever hit, it's possible to attach
the debugger to each test. Set a breakpoint and run all tests (warning: slow):

```shell
tsx --inspect --test --import ./transform-test.js test/**/*.test.ts
```

## QA

Knip has a few tools set up to verify code quality and to format code and
documentation:

```shell
bun format
bun lint
bun knip
bun knip:production
bun run test
```

## GitHub Action

The [ci.yml][7] workflow runs the tests in Ubuntu, macOS and Windows. Tests must
pass before pull requests can be merged. The [integration.yml][8] workflow runs
Knip in multiple repositories using Knip.

## Previews

Thanks to [pkg.pr.new](https://pkg.pr.new) pull requests can be previewed by
installing it as a regular package. Every push is published to their registry.
Look for the `pkg-pr-new` bot in your pull request.

[1]: https://docs.github.com/get-started/quickstart/fork-a-repo
[2]:
  https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[3]: https://github.com/webpro-nl/knip
[4]: https://cli.github.com/
[5]: https://knip.dev/guides/writing-a-plugin/
[6]: ../.vscode/launch.json
[7]: https://github.com/webpro-nl/knip/actions/workflows/ci.yml
[8]: https://github.com/webpro-nl/knip/actions/workflows/integration.yml
