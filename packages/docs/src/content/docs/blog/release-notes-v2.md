---
title: Release Notes v2
sidebar:
  order: 7
---

_2023-03-22_

## Breaking changes

When coming from v1, there are no breaking changes in terms of configuration.

## Changes

There are some changes regarding CLI arguments and output:

- Knip now runs on every \[workspace]\[1] automatically (except for the ones in
  `ignoreWorkspaces: []`).
- The "Unlisted or unresolved dependencies" is split in "Unlisted dependencies"
  and "Unresolved imports".
- Bug fixes and increased correctness impact output (potentially causing CI to
  now succeed or fail).

## New features

Rewriting a major part of Knip's core from scratch allows for some new exciting
features:

- **Performance**. Files are read only once, and their ASTs are traversed only
  once. Projects of any size will notice the difference. Total running time for
  some projects decreases with 90%.
- **Compilers**. You can now include other file types such as `.mdx`, `.vue` and
  `.svelte` in the analysis.

Internally, the `ts-morph` dependency is replaced by `typescript` itself.

## Other improvements

- Improved support for workspaces.
- Improved module resolutions, self-referencing imports, and other things you
  don't want to worry about.
- Configure `ignoreDependencies` and `ignoreBinaries` at the workspace level.
- Simplified plugins model: plugin dependency finder may now return any type of
  dependency in a single array: npm packages, local workspace packages, local
  files, etc. (module and path resolution are handled outside the plugin).
- Many bugfixes.
