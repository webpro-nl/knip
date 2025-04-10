---
title: Source Mapping
sidebar:
  order: 4
---

Knip is mostly interested in source code, and analyzing build artifacts hurts
performance and often leads to false positives. That's why Knip tries to map
such build artifacts back to their original source files and analyze those
instead. This is done based on `tsconfig.json` settings.

## Example 1

Let's look at an example case with `package.json` and `tsconfig.json` files, and
see how "dist" files are mapped to "src" files.

```jsonc title="package.json"
{
  "name": "my-workspace",
  "main": "index.js",
  "exports": {
    ".": "./src/entry.js",
    "./feat": "./lib/feat.js",
    "./public": "./dist/app.js",
    "./public/*": "./dist/*.js",
    "./public/*.js": "./dist/*.js",
    "./dist/internal/*": null,
  },
}
```

With this TypeScript configuration:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "baseUrl": "src",
    "outDir": "dist"
  }
}
```

- `./src/entry.js` is not in an `outDir` folder, so it's added as an entry file
- `./lib/feat.js` is not in an `outDir` folder, so it's added as an entry file
- `./dist/app.js` is in a `dist` folder and mapped to `./src/app.{js,ts}` (¹)
- `./dist/*.js` is in a `dist` folder and mapped to `./src/**/*.{js,ts}` (¹)
- `./dist/internal/*` is translated to `./dist/internal/**` and files in this
  directory and deeper are ignored when globbing entry files

(¹) full extensions list is actually: `js`, `mjs`, `cjs`, `jsx`, `ts`, `tsx`,
`mts`, `cts`

In `--debug` mode, look for "Source mapping" to see this in action.

:::tip

Using `./dist/*.js` means that all files matching `./src/**/*.{js,ts}` are added
as entry files. By default, unused exports of entry files are not reported. Use
[includeEntryExports][1] to include them.

:::

## Example 2

Let's say we have this module in a monorepo that imports `helper` from another
workspace in the same monorepo:

```ts title="index.js"
import { helper } from '@org/shared';
```

The target workspace `@org/shared` has this `package.json`:

```json title="package.json"
{
  "name": "@org/shared",
  "main": "dist/index.js"
}
```

The module resolver will resolve `@org/shared` to `dist/index.js`. That file is
usually compiled and git-ignored, while Knip wants the source file instead.

:::tip

Compilation to `outDir` should succeed before Knip can apply source mapping.

:::

If the target workspace has a `tsconfig.json` file with an `outDir` option, Knip
will try to map the "dist" file to the "src" file. Then if `src/index.ts`
exists, Knip will use that file instead of `dist/index.js`.

Currently this only works based on `tsconfig.json`, in the future more source
mappings may be added.

[1]: ../reference/configuration.md#includeentryexports
