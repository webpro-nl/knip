---
title: Script Parser
description: How Knip statically parses shell scripts and CLI arguments in `package.json`, plugins and source code to find entry files and dependencies.
---

Knip parses shell commands and scripts to find additional dependencies, entry
files and configuration files in various places:

- In [`package.json`][1]
- In [CLI arguments][2]
- In [scripts][3]
- In [source code][4]

Shell scripts are parsed and statically analyzed, but they're not executed.

## package.json

The `main`, `bin`, `exports` and `scripts` fields may contain entry files. Let's
take a look at this example:

```json title="package.json"
{
  "name": "my-package",
  "main": "index.js",
  "exports": {
    "./lib": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "bin": {
    "program": "bin/cli.js"
  },
  "scripts": {
    "build": "rollup src/entry.ts",
    "start": "node --loader tsx server.ts"
  }
}
```

From this example, Knip automatically adds the following files as entry files:

- `index.js`
- `./dist/index.mjs`
- `./dist/index.cjs`
- `bin/cli.js`
- `src/entry.ts`
- `server.ts`

### Excluded files

Knip would not add the `exports` if the `dist` folder is matching a pattern in a
relevant `.gitignore` file or `ignore` option.

Knip does not add scripts without a standard extension. For instance, the
`bin/tool` file might be a valid executable for Node.js, but wouldn't be added
or parsed by Knip.

### CLI Arguments

When parsing the `scripts` of `package.json` and other files, Knip detects
various types of inputs. Some examples:

- The first positional argument is usually an entry file
- Configuration files are often in the `-c` or `--config` argument
- The `--require`, `--loader` or `--import` arguments are often dependencies

```json
{
  "name": "my-lib",
  "scripts": {
    "start": "node --import tsx/esm run.ts",
    "bundle": "tsup -c tsup.lib.config.ts",
    "type-check": "tsc -p tsconfig.app.json"
  }
}
```

The `"start"` script will have `tsx` marked as a referenced dependency, and adds
`run.ts` as an entry file.

Additionally, the following files are detected as configuration files:

- `tsup.lib.config.ts` - to be handled by the tsup plugin
- `tsconfig.app.json` - to be handled by the TypeScript plugin

Such executables and their arguments are all defined in plugins separately for
fine-grained results.

## Scripts

Plugins may also use the script parser to extract entry files and dependencies
from commands. A few examples:

- GitHub Actions: workflow files may contain `run` commands (e.g.
  `.github/workflows/ci.yml`)
- Husky & Lefthook: Git hooks such as `.git/hooks/pre-push` contain scripts;
  also `lefthook.yml` has `run` commands
- Lint Staged: configuration values are all commands
- Nx: task executors and `nx:run-commands` executors in `project.json` contains
  scripts
- Release It: `hooks` contain commands

Plugins can also return configuration files. Some examples:

- The Angular plugin detects `options.tsConfig` as a TypeScript config file
- The GitHub Actions plugin parses `run` commands which may contain
  configuration file paths

## Source Code

When Knip is walking the abstract syntax trees (ASTs) of JavaScript and
TypeScript source code files, it looks for imports and exports. But there's a
few more (rather obscure) things that Knip detects in the process. Below are
examples of additional scripts Knip parses to find entry files and dependencies.

### bun

If the `bun` dependency is imported in source code, Knip considers the contents
of `$` template tags to be scripts:

```ts
import { $ } from 'bun';
await $`bun boxen I ❤ unicorns`;
await $`boxen I ❤ unicorns`;
```

Parsing the script results in the `boxen` binary (the `boxen-cli` dependency) as
referenced (twice).

### execa

If the `execa` dependency is imported in source code, Knip considers the
contents of `$` template tags to be scripts:

```ts
await $({ stdio: 'inherit' })`c8 node hydrate.js`;
```

Parsing the script results in `hydrate.js` added as an entry file and the `c8`
binary/dependency as referenced. The `execa()`, `execaSync()`, `execaCommand()`
and `execaCommandSync()` call forms are parsed the same way.

### zx

If the `zx` dependency is imported in source code, Knip considers the contents
of `$` template tags to be scripts:

```ts
await $`node scripts/parse.js`;
```

This will add `scripts/parse.js` as an entry file.

### child_process

If `node:child_process` is imported in source code, Knip parses the command in
`exec`/`execSync` calls and the executable (with its arguments) in
`spawn`/`spawnSync`/`execFile`/`execFileSync` calls:

```ts
import { execSync, execFile } from 'node:child_process';
execSync('eslint --cache');
execFile('boxen', ['I ❤ unicorns']);
```

This marks the `eslint` and `boxen` binaries as referenced. An inline
`path.join(__dirname, …)` argument to `spawn`, `execFile` or `fork` is added as
an entry file instead.

### nano-spawn

If `nano-spawn` is imported in source code, Knip parses the executable and its
arguments:

```ts
import spawn from 'nano-spawn';
await spawn('gsutil', ['cp', './file.txt', 'gs://bucket/']);
```

This marks the `gsutil` binary as referenced.

[1]: #packagejson
[2]: #cli-arguments
[3]: #scripts
[4]: #source-code
