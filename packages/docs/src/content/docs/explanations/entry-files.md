---
title: Entry Files
description: What entry files are and how Knip and its plugins find them automatically from defaults, `package.json`, plugins and dynamic imports.
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

## Plugins

Plugins often add entry files. For instance, the Remix, Storybook and Vitest
plugins add additional entry files. See [the next page about plugins][2] for
more details about this.

## Scripts in package.json

The `package.json` is scanned for entry files. The `main`, `bin`, and `exports`
fields may contain entry files. The `scripts` are also parsed to find entry
files and dependencies. See [Script Parser][3] for more details.

## Ignored files

Knip respects `.gitignore` files. By default, ignored files are not added as
entry files. This behavior can be disabled by using the [`--no-gitignore`][4]
flag on the CLI.

## Configuring project files

See [configuring project files][5] for guidance on tuning `entry` and `project`
and when to use `ignore`.

## Where Knip looks for entry files

Putting it together, Knip discovers entry files from:

- Default locations such as `index.js` and `src/index.ts`
- The `main`, `bin` and `exports` fields in `package.json`
- Entry and config files added by enabled plugins (the config files are entry
  files too)
- Dynamic imports: `require()` and `import()`
- `require.resolve()` and `import.meta.resolve()`
- `new URL('./file.js', import.meta.url)`
- `new Worker(…)` and `child_process` `fork`/`spawn`/`execFile` when the target
  is `path.join(__dirname, …)`
- `module.register('./loader.js')` loader registration
- Scripts the [script parser][3] extracts: `package.json` scripts, CI workflow
  `run` commands, and source-code calls (tagged `$` templates,
  `node:child_process`, `execa`, `nano-spawn`)

Entry files are added to the module graph, and module resolution may pull in
further entry files recursively until none remain.

[1]: ../overview/configuration.md#defaults
[2]: ./plugins.md
[3]: ../features/script-parser.md
[4]: ../reference/cli.md#--no-gitignore
[5]: ../guides/configuring-project-files.md
