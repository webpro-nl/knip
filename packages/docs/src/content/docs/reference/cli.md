---
title: CLI Arguments
---

## General

### `--help`

Shortcut: `-h`

Prints a summary of this page.

### `--version`

Shortcut: `-V`

Print the version number.

### `--debug`

Shortcut: `-d`

Show debug output.

### `--performance`

Use this flag to get the count and execution time of potentially expensive
functions in a table. Example:

```txt frame=terminal
Name                           size  min       max       median    sum
-----------------------------  ----  --------  --------  --------  --------
findReferences                  648     84.98   7698.61     96.41  70941.70
createProgram                     2   6295.84   7064.68   6680.26  13360.52
glob                              6      0.05    995.78    513.82   3150.87
findESLintDependencies            2      0.01     74.41     37.21     74.41
findGithubActionsDependencies     6      0.16     12.71      0.65     23.45
findBabelDependencies             2      0.00     38.75     19.37     38.75
...

Total running time: 5s
```

- `name`: the internal Knip function name
- `size`: number of function invocations
- `min`: the fastest invocation
- `max`: the slowest invocation
- `median`: the median invocation
- `sum` the accumulated time of all invocations

## Configuration

### `--config [file]`

Use an alternative path for the configuration file. Default locations:

- `knip.json`
- `knip.jsonc`
- `.knip.json`
- `.knip.jsonc`
- `knip.js`
- `knip.ts`
- `package.json#knip`

Shortcut: `-c`

### `--tsConfig [file]`

Use an alternative path for the TypeScript configuration file.

Default location: `tsconfig.json`

### `--workspace [dir]`

Lint a single workspace including its ancestor and dependent workspaces. The
default behavior is to lint all configured workspaces.

Shortcut: `-W`

### `--directory [dir]`

Default: `cwd` (current directory)

Run the process from a different directory.

## Modes

### `--production`

Lint only production source files. This excludes:

- entry files defined by plugins:
  - test files
  - configuration files
  - Storybook stories
- `devDependencies` from `package.json`

Read more at [Production Mode][1].

### `--strict`

Isolate workspaces and consider only direct dependencies.

Read more at [Production Mode][1].

## Flags

### `--include-entry-exports`

When a repository is self-contained or private, you may want to include entry
files when reporting unused exports:

```sh
knip --include-entry-exports
```

Knip will also report unused exports in entry source files and scripts such as
those referenced in `package.json`. But not in entry and configuration files
from plugins, such as `next.config.js` or `src/routes/+page.svelte`.

### `--no-gitignore`

Ignore `.gitignore` files.

### `--no-progress`

Shortcut: `-n`

Don't show dynamic progress updates. Progress is automatically disabled in CI
environments.

### `--no-config-hints`

Suppress configuration hints.

## Issue Types

Available issue types when using `--inlude` or `--exclude`:

- `files`
- `dependencies`
- `unlisted`
- `unresolved`
- `exports`
- `nsExports`
- `classMembers`
- `types`
- `nsTypes`
- `enumMembers`
- `duplicates`

### `--include`

Report only provided issue type(s). Can be comma-separated or repeated.

Example:

```sh
knip --include files,dependencies
```

```sh
knip --include files --include dependencies
```

### `--exclude`

Exclude provided issue type(s) from report. Can be comma-separated or repeated.

Example:

```sh
knip --exclude classMembers,enumMembers
```

### `--dependencies`

Shortcut to include all types of dependency issues:

```sh
--include dependencies,unlisted,unresolved
```

### `--exports`

Shortcut to include all types of export issues:

```sh
--include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
```

## Reporters & Preprocessors

### `--reporter [reporter]`

Available reporters:

- `symbols` (default)
- `compact`
- `codeowners`
- `json`
- `jsonExt`

Can be repeated. Example:

```sh
knip --reporter compact
```

Also see [Reporters & Preprocessors][2] for custom reporters.

### `--reporter-options [json]`

Pass extra options to the preprocessor (as JSON string, see --reporter-options
example)

Example:

```sh
knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
```

### `--preprocessor [preprocesser]`

Preprocess the results before providing it to the reporter(s).

Can be repeated. Examples:

```sh
knip --preprocessor ./my-preprocessor.ts
```

```sh
knip --preprocessor preprocessor-package
```

### `--preprocessor-options [json]`

Pass extra options to the preprocessor as JSON string.

```sh
knip --preprocessor ./preproc.ts --preprocessor-options '{"key":"value"}'
```

## Exit code

### `--no-exit-code`

Always exit with code zero (`0`), even when there are lint errors. The default
behavior:

| Code | Description                                                      |
| :--: | :--------------------------------------------------------------- |
| `0`  | Knip ran successfully, no lint errors                            |
| `1`  | Knip ran successfully, but there is at least one lint error      |
| `2`  | Knip did not run successfully due to bad input or internal error |

### `--max-issues`

Maximum number of issues before non-zero exit code. Default: `0`

[1]: ../features/production-mode.md
[2]: ../features/reporters.md
