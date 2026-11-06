---
title: Configuration Hints
description: The configuration hints Knip emits to keep your config tidy, what each one means, and how to resolve it.
---

Knip emits configuration hints to help keep your configuration file tidy and
reduce drift.

They're warnings by default, not lint findings. But addressing the hints might
improve results significantly. The hints on this page are sorted by
impact/importance (most impactful first).

Each hint shows the value, followed by a message that points to the location in
the configuration file:

```
generated/**  Remove from knip.json → packages/app → ignore (gitignored)
lodash        Remove from knip.json → ignoreDependencies
```

The location reads as `file → workspace → option`. The workspace segment is the
key in `workspaces` (such as `packages/*`), or `(root)` for `workspaces["."]`.
Options at the top level have no workspace segment.

Use [`--treat-config-hints-as-errors`][1] or [`treatConfigHintsAsErrors`][2] to
make any configuration hint an error and result in a non-zero exit code to fail
CI.

## Unconfigured projects

Too many unused files in a single workspace-codebase, caused by a missing
configuration file or incomplete configuration:

```
Create knip.json configuration file, and add entry and/or refine project files (42 unused files)
```

Or if you have a config file:

```
Add entry and/or refine project files in knip.json (42 unused files)
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
Add entry and/or refine project files in knip.json → workspaces["packages/app"] (42 unused files)
```

**Solution**: add a `workspaces` object to configuration. Add and refine `entry`
and/or `project` patterns. For instance, the example message translates to
configuration like this:

```json
{
  "workspaces": {
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
Remove unused knip.json → entry, or move to "workspaces"
Remove unused knip.json → project, or move to "workspaces"
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

## Stale workspace configuration

A key in the `workspaces` configuration matches no workspace in the project, for
instance after the workspace was removed or renamed.

```
Remove from knip.json → workspaces
```

**Solution**: Remove the stale key from `workspaces`, or correct its path.

## Unused ignore patterns

A pattern in `ignore` or `ignoreFiles` did not suppress any issue.

```
Remove from knip.json → ignore (gitignored)
Remove from knip.json → ignore (no issues)
Remove from knip.json → ignore (no matches)
Remove from knip.json → ignoreFiles (files are used)
```

The reason in parentheses tells why the pattern is not needed:

- `gitignored`: the pattern is already matched in some `.gitignore` file
- `no issues`: matching files exist, but there are no issues to ignore
- `files are used`: matching files exist, and they're used
- `no matches`: the pattern matches no files

**Solution**: Remove the pattern from the array.

## Unused entry in ignore group

An entry of an ignore list is no longer needed, remove it.

```
Remove from knip.json → ignoreWorkspaces
Remove from knip.json → ignoreDependencies
Remove from knip.json → ignoreBinaries
Remove from knip.json → ignoreUnresolved
```

**Solution**: Remove the entry from the array.

## Useless patterns

A glob pattern in `entry` or `project` does not match any files.

```
Refine knip.json → entry pattern (no matches)
Refine knip.json → project pattern (no matches)
```

**Solution**: Refine or remove the `entry` or `project` entry.

## Redundant patterns

A glob/pattern is redundant, because it's already covered by defaults or added
by an enabled plugin.

```
Remove redundant pattern from knip.json → entry
Remove redundant pattern from knip.json → project
```

**Solution**: Remove the `entry` or `project` entry.

## Missing package entry file

```
Package entry file not found in packages/app/package.json
```

**Solution**: Refine or remove the entry in `package.json`.

[1]: ./cli.md#--treat-config-hints-as-errors
[2]: ./configuration.md#treatconfighintsaserrors
[3]: ../overview/configuration.md
[4]: ../features/monorepos-and-workspaces.md
[5]: ../guides/configuring-project-files.md
