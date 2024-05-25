# Development

Development in this repository is using:

- Bun
- TypeScript
- Biome

You should have Bun installed, the rest comes with `bun install`.

## Getting started

This guide assumes familiarity with concepts like [forking][1] and [cloning a repo][2] and working with npm.

- Fork the project (e.g. using the [GitHub website][3] or the [gh CLI][4])
- Clone the repository
- Install dependencies

Example terminal commands:

```shell
gh repo fork webpro-nl/knip --clone
cd knip
bun install
cd packages/knip
```

Depending on the goals and the way you like to work, below are a few things that might help during development:

## Plugins

There's a separate guide for [writing a plugin][5].

## Watcher

```shell
cd packages/knip
bun link && bun run build --watch
```

Changes in the source code are now automatically picked up, and `knip` is available globally to run from any directory.
You can then also run `npm link knip` from another repository to use the linked version of `knip`.

## Fixtures & Tests

Pull requests should include one or more tests. See the `tests` and `fixtures` directories to find relevant files that
you may want to borrow or copy from.

Let's assume you created `fixtures/feature` and `test/feature.test.ts`. Here's 4 ways to run it:

### Run the test

```shell
bun test ./test/feature.test.ts
```

### Run Knip in the directory

```shell
cd fixtures/feature
knip
```

### Attach debugger to Node.js

Auto or smart-attach to every Node.js process launched in terminal in IDE, and then:

```shell
cd fixtures/feature
tsx ../../src/cli.ts
```

### Attach debugger to Bun

Set a breakpoint and start Knip with Bun while waiting for the debugger to be attached:

```shell
cd fixtures/feature
bun --inspect-wait=127.0.0.1:6499/knip run ../../src/cli.ts
```

Attach the debugger using the "Attach to Bun" launch configuration.

### Attach debugger to Bun from a test

Run the "Debug Bun test" launch configuration from any test file.

## QA

Knip has a few tools set up to verify code quality and to format code and documentation:

```shell
bun run format
bun run lint
bun run knip
bun run knip:production
bun run test
```

To run all commands in sequence: `bun run qa`

## GitHub Action

The [Cross-OS Tests][7] GitHub Action runs the tests in Ubuntu, macOS and Windows. Tests must pass before pull requests
can be merged. Another workflow acts as [integration test][8] against repositories using Knip.

[1]: https://docs.github.com/get-started/quickstart/fork-a-repo
[2]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[3]: https://github.com/webpro-nl/knip
[4]: https://cli.github.com/
[5]: https://knip.dev/guides/writing-a-plugin/
[6]: ../.vscode/launch.json
[7]: https://github.com/webpro-nl/knip/actions/workflows/test.yml
[8]: https://github.com/webpro-nl/knip/actions/workflows/integration.yml
