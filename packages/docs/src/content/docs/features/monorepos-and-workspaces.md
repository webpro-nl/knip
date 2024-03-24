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

Here's example configuration with custom `entry` and `project` patterns:

```json title="knip.json"
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

In a project with workspaces, customized `entry` and `project` options at the
root level are ignored, they must be moved to the `"."` workspace.

:::

## Workspaces

Knip reads workspaces from four possible locations:

1. The `workspaces` array in `package.json` (npm, Bun, Yarn, Lerna)
2. The `packages` array in `pnpm-workspace.yaml` (pnpm)
3. The `workspaces.packages` array in `package.json` (legacy)
4. The `workspaces` object in Knip configuration

The `workspaces` in Knip configuration (4) not already defined in the root
`package.json` or `pnpm-workspace.yaml` (1, 2, 3) are added to the analysis.

:::caution

A workspace must have a `package.json` file.

:::

For projects with only a root `package.json`, please see [integrated
monorepos][2].

## Additional options

The following options are available inside workspace configurations:

- [ignore][3]
- [ignoreBinaries][4]
- [ignoreDependencies][5]
- [ignoreMembers][6]
- [includeEntryExports][7]

[Plugins][8] can be configured separately per workspace.

Use `--debug` for verbose output and see the workspaces Knip includes, their
configurations, enabled plugins, glob options and resolved files.

## Lint a single workspace

Use the `--workspace` (or `-W`) argument to focus on a single workspace (and let
Knip run faster). Example:

```sh
knip --workspace packages/my-lib
```

This will include ancestor and dependent workspaces, for two reasons:

- Ancestor workspaces may list dependencies in `package.json` the linted
  workspace uses.
- Dependent workspaces may reference exports from the linted workspace.

To lint the workspace in isolation, you can combine this with [strict production
mode][9].

[1]: ../overview/configuration.md#defaults
[2]: ./integrated-monorepos.md
[3]: ../reference/configuration.md#ignore
[4]: ../reference/configuration.md#ignorebinaries
[5]: ../reference/configuration.md#ignoredependencies
[6]: ../reference/configuration.md#ignoremembers
[7]: ../reference/configuration.md#includeentryexports
[8]: ../reference/configuration.md#plugins
[9]: ./production-mode.md#strict-mode
