---
title: Source Mapping
description: How Knip maps build artifacts in `dist`/`outDir` back to their original source files using `tsconfig.json` to avoid false positives.
---

Knip is mostly interested in source code. Analyzing build artifacts hurts
performance and often leads to false positives, as they potentially contain
bundled code and unresolvable imports.

That's why Knip tries to map such build artifacts back to their original source
files and analyze those instead. This is done based on `tsconfig.json` settings.

## Example 1: package.json

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

## Example 2: monorepo

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

You may need to compile build artifacts to `outDir` first before Knip can
successfully apply source mapping for internal references in a monorepo.

:::

If the target workspace has a `tsconfig.json` file with an `outDir` option, Knip
will try to map the "dist" file to the "src" file. Then if `src/index.ts`
exists, Knip will use that file instead of `dist/index.js`.

Currently this only works based on `tsconfig.json`, in the future more source
mappings may be added.

## Example 3: source conditions

Source-first monorepos may expose source files directly through a custom
condition in `package.json#exports` or `#imports` maps:

```json title="package.json"
{
  "name": "@org/shared",
  "exports": {
    ".": {
      "@org/source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

When module resolution fails because the targets aren't built, Knip falls back
to the first conditional target of the workspace package that exists on disk,
regardless of the condition's name. No build step or configuration required.

[1]: ../reference/configuration.md#includeentryexports
