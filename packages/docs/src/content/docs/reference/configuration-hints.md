---
title: Configuration Hints
---

Knip emits configuration hints to help keep your configuration file tidy and
reduce drift.

They're warnings by default, not lint findings. But addressing the hints might
improve results significantly. The hints on this page are sorted by
impact/importance (most impactful first).

Use [`--treat-config-hints-as-errors`][1] or [`treatConfigHintsAsErrors`][2] to
make any configuration hint result in a non-zero exit code and fail CI.

## Unconfigured projects

Too many unused files in a single workspace-codebase, caused by a missing
configuration file or incomplete configuration:

```
Create knip.json configuration file, and add entry and/or refine project files (42 unused files)
```

Or if you have a config file:

```
Add entry and/or refine project files (42 unused files)
```

**Solution**: Add and refine `entry` and/or `project` patterns.

Related resources:

- [Configuration][3]
- [Monorepos & Workspaces][4]

## Unconfigured workspaces

Too many unused files in a monorepo, caused by a missing configuration file or
incomplete configuration:

```
Create knip.json configuration file with workspaces["packages/app"] object (42 unused files)
```

Or if you have a config file:

```
Add entry and/or refine project files in workspaces["packages/app"] (42 unused files)
```

**Solution**: add a `workspaces` object to configuration. Add and refine `entry`
and/or `project` patterns. For instance, the example message translates to
configuration like this:

```json
{
  "workspaces" {
    "packages/app": {
      "entry": ["src/App.tsx"],
      "project": ["src/**/*.ts"]
    }
  }
}
```

Related resources:

- [Configuring Project Files][5]
- [Monorepos & Workspaces][4]

## Top-level entry/project

In monorepos, Knip uses only `entry` and `project` under `workspaces`. The
top-level keys with the same name are ignored.

```
Remove, or move unused top-level entry to one of "workspaces"
Remove, or move unused top-level project to one of "workspaces"
```

**Solution**: Remove top-level `entry` and `project` keys, use these options in
`workspaces` instead.

```jsonc
{
  "entry": ["src/App.tsx"], // move entry/project from here... ↴
  "project": ["src/**/*.ts"],
  "workspaces": {
    ".": {
      "entry": ["src/App.tsx"], // ...to the correct workspace(s) ↲
      "project": ["src/**/*.ts"],
    },
  },
}
```

## Unused entry in ignore group

An entry of an ignore list is no longer needed, remove it.

```
Remove from ignoreWorkspaces
Remove from ignoreDependencies
Remove from ignoreBinaries
Remove from ignoreUnresolved
```

**Solution**: Remove the entry from the array.

## Useless patterns

A glob pattern in `entry` or `project` does not match any files.

```
Refine entry pattern (no matches)
Refine project pattern (no matches)
```

**Solution**: Refine or remove the `entry` or `project` entry.

## Redundant patterns

A glob/pattern is redundant, because it's already covered by defaults or added
by an enabled plugin.

```
Remove redundant entry pattern
Remove redundant project pattern
```

**Solution**: Remove the `entry` or `project` entry.

## Missing package entry file

```
Package entry file not found
```

**Solution**: Refine or remove the entry in `package.json`.

[1]: ./cli.md#--treat-config-hints-as-errors
[2]: ./configuration.md#treatconfighintsaserrors
[3]: ../overview/configuration.md
[4]: ../features/monorepos-and-workspaces.md
[5]: ../guides/configuring-project-files.md
