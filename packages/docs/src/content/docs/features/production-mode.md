---
title: Production Mode
sidebar:
  order: 1
---

The default mode for Knip is comprehensive and targets all project code,
including configuration files, test files, Storybook stories, and so on. Test
files usually import production files. This prevents production files or their
exports from being reported as unused, while sometimes both of them can be
deleted. Knip features a "production mode" to focus only on the code that you
ship.

## Configuration

To tell Knip what is production code, add an exclamation mark behind each
`pattern!` that represents production code:

```json title="knip.json"
{
  "entry": ["src/index.ts!", "build/script.js"],
  "project": ["src/**/*.ts!", "build/*.js"]
}
```

Depending on file structure and enabled plugins, you might not need to modify
your configuration at all.

Run Knip with the `--production` flag:

```sh
knip --production
```

Here's what's included in production mode:

- Only `entry` and `project` patterns suffixed with `!`
- Only production `entry` file patterns exported by plugins (such as Next.js and
  Remix)
- Only the `start` and `postinstall` scripts
- Ignore exports with the [`@internal` tag][1]

:::note

The production run does not replace the default run. Depending on your needs you
can run either of them or both separately. Usually both modes can share the same
configuration.

:::

To see the difference between default and production mode in great detail, use
the `--debug` flag and inspect what entry and project files are used, and the
plugins that are enabled. For instance, in production mode this shows that files
such as tests and Storybook files (stories) are excluded from the analysis.

In case files like mocks and test helpers are reported as unused files, use
negated patterns to exclude those files in production mode:

```json title="knip.json"
{
  "entry": ["src/index.ts!"],
  "project": ["src/**/*.ts!", "!src/test-helpers/**!"]
}
```

Also see [configuring project files][2] to align `entry` and `project` with
production mode.

## Strict Mode

In production mode, only `dependencies` (not `devDependencies`) are considered
when finding unused or unlisted dependencies.

Additionally, the `--strict` flag can be added to:

- Verify isolation: workspaces should use strictly their own `dependencies`
- Include `peerDependencies` when finding unused or unlisted dependencies
- Report type-only imports listed in `dependencies`

```sh
knip --production --strict
```

Using `--strict` implies `--production`, so the latter can be omitted.

## Types

Add `--exclude types` if you don't want to include types in the report:

```sh
knip --production --exclude types
```

[1]: ../reference/jsdoc-tsdoc-tags.md#internal
[2]: ../guides/configuring-project-files.md
