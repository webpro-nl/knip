---
title: Configuring Project Files
sidebar:
  order: 1
---

The `entry` and `project` file patterns are the first and most important
options. Getting those right is essential to get the most value and performance
out of Knip.

TL;DR;

- Start with defaults. Only add targeted `entry` overrides when needed.
- Use `project` patterns (with negations) to define "what belongs to the
  codebase" for unused file detection.
- Use production mode to exclude tests and other non-production files.
- Use `ignore` only to suppress issues in specific files. It does not exclude
  files from analysis.

Let's dive in and expand on all of these.

## Entry files

Avoid adding too many files as `entry` files:

1. Knip does not report [unused exports][2] in entry files by default.
2. Proper `entry` and `project` patterns allow Knip to find unused files and
   exports.

## Unused files

Files are reported as unused if they are in the set of `project` files, but are
not resolved from the `entry` files:

```
unused files = project files - (entry files + resolved files)
```

See [entry files][1] to see where Knip looks for entry files. Fine-tune `entry`
and adjust `project` to fit your codebase.

:::tip

Use negated `project` patterns to precisely include/exclude files for unused
files detection.

Use `ignore` to suppress issues in matching files; it does not remove those
files from analysis.

:::

## Negated patterns

When there are too many files in the analysis, start here.

For instance, routes are entry files except those prefixed with an underscore:

```json
{
  "entry": ["src/routes/*.ts", "!src/routes/_*.ts"]
}
```

Some files are not part of your source and are reported as unused (false
positives)? Use negated `project` patterns:

```json
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts", "!src/exclude/**"]
}
```

❌   Don't use `ignore` for generated artifacts:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "ignore": ["build/**", "dist/**", "src/generated.ts"]
}
```

✅   Do define your project boundaries:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "project": ["src/**", "scripts/**"],
  "ignore": ["src/generated.ts"]
}
```

Why is this better:

- `project` defines "what belongs to the codebase" so build outputs are not part
  of the analysis and don't appear in unused file detection at all
- `ignore` is for the few files that should be analyzed but contain exceptions
- increases performance by analyzing only source files

## Ignore issues in specific files

Use `ignore` when a specific analyzed file is not handled properly by Knip or
intentionally contains unused exports (e.g. generated files exporting
"everything"):

```json
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["src/generated.ts"]
}
```

Also see [ignoreExportsUsedInFile][3] for a more targeted approach.

## Production Mode

Default mode includes tests and other non-production files in the analysis. To
focus on production code, use [production mode][4].

Don't try to exclude tests via `ignore` or negated `project` patterns. That's
inefficient and ineffective due to entries added by plugins. Use production mode
instead.

❌   Don't do this:

```json
{
  "ignore": ["**/*.test.js"]
}
```

Why not: `ignore` only hides issues from the report; it does not exclude files
from analysis.

❌   Also don't do this:

```json
{
  "entry": ["index.ts", "!**/*.test.js"]
}
```

Why not: plugins for test frameworks add test file as `entry` files, you can't
and shouldn't override that globally.

❌   Or this:

```json
{
  "project": ["**/*.ts", "!**/*.spec.ts"]
}
```

Why not: `project` is used for unused file detection. Negating test files here
is ineffective, because they're `entry` files.

✅   Do this instead:

```shell
knip --production
```

To fine-tune the resulting production file set, for instance to exclude test
helper files that still show as unused, use the exclamation mark suffix on
production patterns:

```json
{
  "entry": ["src/index.ts!"],
  "project": ["src/**/*.ts!", "!src/test-helpers/**!"]
}
```

Remember to keep adding the exclamation mark `suffix!` for production file
patterns.

:::tip

Use the exclamation mark (`!`) on both ends (`!`) to exclude files in production
mode.

:::

## Defaults & Plugins

To reiterate, the default `entry` and `project` files for each workspace:

```json
{
  "entry": [
    "{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}",
    "src/{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"
  ],
  "project": ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}!"]
}
```

Next to this, there are other places where [Knip looks for entry files][1].

Additionally, [plugins have plenty of entry files configured][5] that are
automatically added as well.

[1]: ../explanations/entry-files.md
[2]: ../typescript/unused-exports.md
[3]: ../reference/configuration#ignoreexportsusedinfile
[4]: ../features/production-mode.md
[5]: ../explanations/plugins.md#entry-files
