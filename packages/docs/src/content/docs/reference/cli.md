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

### `--no-progress`

Shortcut: `-n`

Don't show dynamic progress updates. Progress is automatically disabled in CI
environments.

### `knip-bun`

Run Knip using the Bun runtime (instead of Node.js + jiti).

```shell
knip-bun
```

This is equal to `bunx --bun knip`

Requires [Bun][1] to be installed. Also see [known issues][2] for the type of
issues this might help with.

### NO_COLOR

The default reporters use the [NO_COLOR][3] friendly [picocolors][4]:

```sh
NO_COLOR=1 knip
```

## Troubleshooting

### `--debug`

Shortcut: `-d`

Show debug output.

### `--memory`

```txt frame=terminal
knip --memory

(results)

heapUsed  heapTotal  freemem
--------  ---------  -------
   42.09      70.91  2251.00
  927.04    1042.58  1166.47
  973.29    1047.33  1160.92
  971.54    1079.83  1121.66
  997.80    1080.33  1120.34
 1001.88    1098.08  1100.72
 1038.69    1116.58  1100.72
 1082.12    1166.33  1100.72
 1145.46    1224.50  1100.72
 1115.82    1240.25  1100.72
 1182.35    1249.75   973.05
  637.32    1029.17   943.63
  674.30    1029.33   943.39
  682.24    1029.33   941.63
  707.70    1029.33   937.48

Total running time: 4.3s
```

Can be used with [--isolate-workspaces][5] to see the difference in garbage
collection during the process.

### `--memory-realtime`

Use this if Knip crashes to still see memory usage info over time:

```txt frame=terminal
knip --memory-realtime

heapUsed  heapTotal  freemem
--------  ---------  -------
   42.09      70.91  2251.00
  927.04    1042.58  1166.47
...mem info keeps being logged...

(results)
```

### `--performance`

Use this flag to get the count and execution time of potentially expensive
functions in a table. Example:

```txt frame=terminal
$ knip --performance

(results)

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

This is not yet available in Bun, since it does not support
`performance.timerify` ([GitHub issue][6]).

### `--performance-fn`

Limit the output of `--performance` to a single function to minimize the
overhead of the `timerify` Node.js built-in and focus on that function alone:

```txt frame=terminal
$ knip --performance-fn resolveSync

(results)

Name         size   min   max   median   sum
-----------  -----  ----  ----  ------  ------
resolveSync  66176  0.00  5.69    0.00  204.85

Total running time: 12.9s
```

### `--trace`

Trace exports to see where they are imported.

Also see [Trace][7].

### `--trace-export [name]`

Trace export name to see where it's imported. Implies [--trace][8].

### `--trace-file [path]`

Trace file to see where its exports are imported. Implies [--trace][8].

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

Shortcut: `-t`

Use an alternative path for the TypeScript configuration file.

Using `-t jsconfig.json` is also supported.

Default location: `tsconfig.json`

### `--workspace [dir]`

[Lint a single workspace][9] including its ancestor and dependent workspaces.
The default behavior is to lint all configured workspaces.

Shortcut: `-W`

### `--directory [dir]`

Default: `cwd` (current directory)

Run the process from a different directory.

### `--no-gitignore`

Ignore `.gitignore` files.

### `--include-entry-exports`

When a repository is self-contained or private, you may want to include entry
files when reporting unused exports:

```sh
knip --include-entry-exports
```

Also see [includeEntryExports][10].

### `--include-libs`

Getting false positives for exports consumed by external libraries? Try the
`--include-libs` flag:

```sh
knip --include-libs
```

Also see [external libs][11].

### `--isolate-workspaces`

By default, Knip optimizes performance using [workspace sharing][12] to existing
TypeScript programs, based on the compatibility of their `compilerOptions`. This
flag disables this behavior and creates one program per workspace, which is
slower but memory usage is spread more evenly over time.

## Modes

### `--production`

Lint only production source files. This excludes:

- entry files defined by plugins:
  - test files
  - configuration files
  - Storybook stories
- `devDependencies` from `package.json`

Read more at [Production Mode][13].

### `--strict`

Isolate workspaces and consider only direct dependencies. Implies [production
mode][14].

Read more at [Production Mode][13].

### `--fix`

Read more at [auto-fix][15].

### `--cache`

Enable caching.

Consecutive runs are 10-40% faster as the results of file analysis (AST
traversal) are cached. Conservative. Cache strategy based on file meta data
(modification time + file size).

### `--cache-location`

Provide alternative cache location.

Default location: `./node_modules/.cache/knip`

### `--watch`

Watch current directory, and update reported issues when a file is modified,
added or deleted.

Watch mode focuses on imports and exports in source files. During watch mode,
changes in `package.json` or `node_modules` may not cause an updated report.

## Filters

Available [issue types][16] when filtering output using `--include` or
`--exclude`:

- `files`
- `dependencies`
- `optionalPeerDependencies`
- `unlisted`
- `unresolved`
- `exports`
- `nsExports`
- `classMembers`
- `types`
- `nsTypes`
- `enumMembers`
- `duplicates`

### `--exclude`

Exclude provided issue types from report. Can be comma-separated or repeated.

Example:

```sh
knip --exclude classMembers,enumMembers
knip --exclude classMembers --exclude enumMembers
```

### `--include`

Report only provided issue types. Can be comma-separated or repeated.

Example:

```sh
knip --include files,dependencies
knip --include files --include dependencies
```

### `--dependencies`

Shortcut to include all types of dependency issues:

```sh
--include dependencies,optionalPeerDependencies,unlisted,binaries,unresolved
```

### `--exports`

Shortcut to include all types of export issues:

```sh
--include exports,nsExports,classMembers,types,nsTypes,enumMembers,duplicates
```

### `--experimental-tags`

Deprecated. Use [--tags][17] instead.

### `--tags`

Exports can be tagged with known or arbitrary JSDoc/TSDoc tags:

```ts
/**
 * Description of my exported value
 *
 * @type number
 * @internal Important matters
 * @lintignore
 */
export const myExport = 1;
```

And then include (`+`) or exclude (`-`) these tagged exports from the report
like so:

```shell
knip --tags=-lintignore,-internal
knip --tags=+custom
```

This way, you can either focus on or ignore specific tagged exports with tags
you define yourself. This also works for individual class or enum members.

The default directive is `+` (include) and the `@` prefix is ignored, so the
notation below is valid and will report only exports tagged `@lintignore` or
`@internal`:

```shell
knip --tags @lintignore --tags @internal
```

## Reporters & Preprocessors

### `--reporter [reporter]`

Available reporters:

- `symbols` (default)
- `compact`
- `codeowners`
- `json`
- `markdown`

Can be repeated. Example:

```sh
knip --reporter compact
```

Also see [Reporters & Preprocessors][18].

### `--reporter-options [json]`

Pass extra options to the preprocessor (as JSON string, see --reporter-options
example)

Example:

```sh
knip --reporter codeowners --reporter-options '{"path":".github/CODEOWNERS"}'
```

### `--preprocessor [preprocessor]`

Preprocess the results before providing it to the reporters.

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

Also see [Reporters & Preprocessors][18].

## Exit code

The default exit codes:

| Code | Description                                                      |
| :--: | :--------------------------------------------------------------- |
| `0`  | Knip ran successfully, no lint issues                            |
| `1`  | Knip ran successfully, but there is at least one lint issues     |
| `2`  | Knip did not run successfully due to bad input or internal error |

### `--no-exit-code`

Always exit with code zero (`0`), even when there are lint issues.

### `--max-issues`

Maximum number of issues before non-zero exit code. Default: `0`

### `--no-config-hints`

Suppress configuration hints.

### `--treat-config-hints-as-errors`

Exit with non-zero code (`1`) if there are any configuration hints.

[1]: https://bun.sh
[2]: ../reference/known-issues.md
[3]: https://no-color.org/
[4]: https://www.npmjs.com/package/picocolors
[5]: #--isolate-workspaces
[6]: https://github.com/oven-sh/bun/issues/9271
[7]: ../guides/troubleshooting.md#trace
[8]: #--trace
[9]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
[10]: ./configuration.md#includeentryexports
[11]: ../guides/handling-issues.mdx#external-libraries
[12]: ../guides/performance.md#workspace-sharing
[13]: ../features/production-mode.md
[14]: #--production
[15]: ../features/auto-fix.mdx
[16]: ./issue-types.md
[17]: #--tags
[18]: ../features/reporters.md
