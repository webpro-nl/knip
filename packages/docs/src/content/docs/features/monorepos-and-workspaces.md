---
title: Monorepos & Workspaces
sidebar:
  order: 2
---

Workspaces are handled out-of-the-box by Knip.

Workspaces are sometimes also referred to as package-based monorepos, or as
packages in a monorepo. Knip uses the term workspace exclusively to indicate a
directory that has a `package.json`.

## Configuration

Here's an example `knip.json` configuration with some custom `entry` and
`project` patterns:

```json
{
  "workspaces": {
    ".": {
      "entry": "scripts/*.js",
      "project": "scripts/**/*.js"
    },
    "packages/*": {
      "entry": "{index,cli}.ts",
      "project": "**/*.ts"
    },
    "packages/cli": {
      "entry": "bin/cli.js"
    }
  }
}
```

:::tip

Run Knip without any configuration to see if and where custom `entry` and/or
`project` files are necessary per workspace.

:::

Each workspace has the same [default configuration][1].

The root workspace is named `"."` under `workspaces` (like in the example
above).

:::caution

In a project with workspaces, the `entry` and `project` options at the root
level are not functional, they must be moved to the `"."` workspace.

:::

## Workspaces

Knip reads workspaces from four possible locations:

- The `workspaces` array in `package.json` (npm, Yarn, Lerna)
- The `packages` array in `pnpm-workspace.yaml` (pnpm)
- The `workspaces.packages` array in `package.json` (legacy)
- The `workspaces` object in Knip configuration

The `workspaces` in Knip configuration not already defined in the root
`package.json` or `pnpm-workspace.yaml` are added.

:::caution

Any workspace must have a `package.json` file. Projects with only a root
`package.json`, please see [integrated monorepos][2].

:::

## Debug and more options

Use `--debug` for verbose output and see the workspaces Knip includes, their
configurations, enabled plugins, glob options and resolved files.

The [ignore][3], [ignoreBinaries][4] and [ignoreDependencies][5] options are
available inside workspace configurations.

[Plugins][6] can be configured separately per workspace.

## Lint a single workspace

Use the `--workspace` (or `-W`) argument to focus on a single workspace (and let
Knip run faster). Example:

```sh
knip --workspace packages/my-lib
```

This mode includes ancestor and dependent workspaces, for two reasons:

- Ancestor workspaces may contain dependencies the linted workpace uses.
- Dependent workspaces may reference exports from the linted workspace.

To lint the workspace in isolation, you can combine this with [strict production
mode][7].

[1]: ../overview/configuration.md#defaults
[2]: ./integrated-monorepos.md
[3]: ../reference/configuration.md#ignore-files
[4]: ../reference/configuration.md#ignore-binaries
[5]: ../reference/configuration.md#ignore-dependencies
[6]: ../reference/configuration.md#plugins
[7]: ./production-mode.md#strict-mode
