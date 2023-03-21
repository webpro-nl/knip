# Release Notes v2

## Breaking changes

When coming from v1, there are no breaking changes in terms of configuration.

## Changes

There are some changes regarding CLI arguments and output:

- Knip now runs on every [workspace][1] automatically (except for the ones in `ignoreWorkspaces: []`).
- The "Unlisted or unresolved dependencies" is split in "Unlisted dependencies" and "Unresolved imports".
- Bug fixes and increased correctness impact output (potentially causing CI to now succeed or fail).
- The `--include-entry-exports` CLI flag has been removed.
- The `--workspace [dir]` argument no longer includes ancestor workspaces.

## New features

Rewriting a major part of Knip's core from scratch allows for some new exciting features:

- **Performance**. Files are read only once, and their ASTs are traversed only once. Projects of any size will notice
  the difference. Total running time for some projects decreases with 90%.
- **[Compilers][2]**. You can now include other file types such as `.mdx`, `.vue` and `.svelte` in the analysis.

Internally, the `ts-morph` dependency is replaced by `typescript` itself.

## Other improvements

- Improved support for [workspaces][1].
- Improved module resolutions, self-referencing imports, and other things you don't want to worry about.
- Configure `ignoreDependencies` and `ignoreBinaries` at the workspace level.
- Simplified [plugins][3] model: [plugin dependency finder][4] may now return any type of dependency in a single array:
  npm packages, local workspace packages, local files, etc. (module and path resolution are handled outside the plugin).
- Many bugfixes.

[1]: ../README.md#workspaces-monorepos
[2]: ./compilers.md
[3]: ../README.md#plugins
[4]: ./writing-a-plugin.md#finddependencies
