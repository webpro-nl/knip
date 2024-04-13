---
title: Entry Files
sidebar:
  order: 1
---

Entry files are the starting point for Knip to determine what files are used in
the codebase. More entry files lead to increased coverage of the codebase. This
also leads to more dependencies to be discovered. This page explains how Knip
and its plugins try to find entry files so you don't need to configure them
yourself.

## Default entry file patterns

For brevity, the [default configuration][1] on the previous page mentions only
`index.js` and `index.ts`, but the default set of file names and extensions is
actually a bit larger:

- `index`, `main` and `cli`
- `js`, `mjs`, `cjs`, `jsx`, `ts`, `mts`, `cts` and `tsx`

This means files like `main.cjs` and `src/cli.ts` are automatically added as
entry files. Here's the default configuration in full:

```json
{
  "entry": [
    "{index,main,cli}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}",
    "src/{index,main,cli}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"
  ],
  "project": ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"]
}
```

Next to the default locations, or the entry file patterns configured by you,
Knip also looks for `entry` files in other places. All of this is done for each
workspace separately.

The values you set override the default values, they are not merged.

## Scripts in package.json

The `main`, `bin`, and `exports` fields may contain entry files. The `scripts`
are also parsed to find entry files and dependencies. See [Script Parser][2] for
more details.

## Ignored files

Knip respects `.gitignore` files. By default, ignored files are not added as
entry files. This behavior can be disabled by using the [`--no-gitignore`][3]
flag on the CLI.

Glob patterns can also be negated, for example:

```json
{
  "entry": ["lib/entry-*.js", "!lib/entry-excluded.js"]
}
```

## Configuring project files

See [configuring project files][4] for guidance with the `entry`, `project` and
`ignore` options.

[1]: ../overview/configuration.md#defaults
[2]: ../features/script-parser.md
[3]: ../reference/cli.md#--no-gitignore
[4]: ../guides/configuring-project-files.md
