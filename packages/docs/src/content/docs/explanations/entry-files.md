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
    "{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}",
    "src/{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"
  ],
  "project": ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}!"]
}
```

Next to the default locations, Knip looks for `entry` files in other places. In
a monorepo, this is done for each workspace separately.

The values you set override the default values, they are not merged.

Also see [FAQ: Where does Knip look for entry files?][2]

## Plugins

Plugins often add entry files. For instance, if the Remix, Storybook and Vitest
plugins are enabled in your project, they'll add additional entry files. See
[the next page about plugins][3] for more details about this.

## Scripts in package.json

The `package.json` is scanned for entry files. The `main`, `bin`, and `exports`
fields may contain entry files. The `scripts` are also parsed to find entry
files and dependencies. See [Script Parser][4] for more details.

## Ignored files

Knip respects `.gitignore` files. By default, ignored files are not added as
entry files. This behavior can be disabled by using the [`--no-gitignore`][5]
flag on the CLI.

## Configuring project files

See [configuring project files][6] for guidance with the `entry`, `project` and
`ignore` options.

[1]: ../overview/configuration.md#defaults
[2]: ../reference/faq.md#where-does-knip-look-for-entry-files
[3]: ./plugins.md
[4]: ../features/script-parser.md
[5]: ../reference/cli.md#--no-gitignore
[6]: ../guides/configuring-project-files.md
