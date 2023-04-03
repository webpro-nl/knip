# Development

Development in this repository is based on:

- Node.js
- npm
- TypeScript
- ESLint

## Getting started

This guide assumes familiarity with concepts like [forking][1] and [cloning a repo][2] and working with npm.

- Fork the project (e.g. using the [GitHub website][3] or the [gh CLI][4])
- Clone the repository
- Install dependencies

Example terminal commands:

```shell
gh repo fork webpro/knip --clone
cd knip
npm install
```

Depending on the goals and the way you like to work, below are a few things that might help during development:

## Plugins

There's a separate guide for [writing a plugin][5].

## Watcher

```shell
npm link
npm run watch
```

Changes in the source code are now automatically picked up, and `knip` is available globally to run from any directory.
You can then also run `npm link knip` from another repository to use the linked version of `knip`.

## Fixtures & Tests

Pull requests should include one or more tests. See the `tests` and `tests/fixtures` directories to find relevant files
that you may want to borrow or copy from.

Let's assume you created `tests/fixtures/feature` and `tests/feature.test.ts`. There are a few ways to run it:

- `node loader --tsx tests/feature.test.ts`
- `npx tsx tests/feature.test.ts`
- Use [launch configurations][6] in VS Code and start debugging from `tests/feature.test.ts`.
- Go to `cd tests/fixtures/feature` and run `knip` (or `knip --debug`)

## QA

Knip has a few tools set up to verify code quality and to format code and documentation:

```shell
npm run build
npm run format
npm run knip
npm run lint
npm test
```

To run all commands in sequence: `npm run qa`

## Documentation

When making changes to documentation or plugins, the Markdown files should be generated and formatted:

```shell
npm run docs
```

Note that all `README.md` files inside the plugin directories are 100% generated, manual changes will be overwritten.

## GitHub Action

The [Cross-OS Tests][7] GitHub Action runs the tests in Ubuntu, macOS and Windows. Tests must pass before pull requests
can be merged.

[1]: https://docs.github.com/get-started/quickstart/fork-a-repo
[2]: https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository
[3]: https://github.com/webpro/knip
[4]: https://cli.github.com/
[5]: ../docs/writing-a-plugin.md
[6]: ../.vscode/launch.json
[7]: https://github.com/webpro/knip/actions/workflows/test.yml
