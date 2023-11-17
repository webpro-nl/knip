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

For brevity, the [configuration on the previous page][1] mentions only
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

## Scripts in package.json

The `main`, `bin`, `exports` and `scripts` fields may contain entry files. Let's
take a look at this example:

```json title="package.json"
{
  "name": "knip-example",
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
    "build": "bundle src/entry.ts",
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

Knip respects `.gitignore` files and `ignore` config options. It would not add
the `exports` if the `dist` folder is matching a pattern in a relevant
`.gitignore` file or `ignore` option.

## Scripts in source code

When Knip is walking the abstract syntax trees (ASTs) of JavaScript and
TypeScript source code files, it looks for imports and exports. But there's a
few more (rather obscure) things that Knip detects in the process. Below are
examples of additional scripts Knip parses to find entry files and dependencies.

### execa

If the `execa` dependency is imported in source code, Knip considers the
contents of `$` template tags to be scripts:

```ts
await $({ stdio: 'inherit' })`c8 node hydrate.js`;
```

Parsing the script results in `hydrate.js` added as an entry file and the `c8`
dependency as referenced.

### zx

If the `zx` dependency is imported in source code, Knip considers the contents
of `$` template tags to be scripts:

```ts
await $`node scripts/parse.js`;
```

This will add `scripts/parse.js` as an entry file.

[1]: ../overview/configuration.md
