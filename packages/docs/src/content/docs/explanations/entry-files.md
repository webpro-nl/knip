---
title: Entry Files
sidebar:
  order: 1
---

## Introduction

Entry files are the starting point for Knip to determine what files are used in
the codebase. More entry files lead to increased coverage of the codebase. This
also leads to more dependencies to be discovered. This page explains how Knip
and its plugins try to find entry files so you don't need to configure them
yourself.

## Default Entry File Patterns

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

## Ignored Files

Knip respects `.gitignore` files and the `ignore` config option to prevent
matching files from being added as entry file.

[1]: ../overview/configuration.md#defaults
[2]: ../features/script-parser.md
