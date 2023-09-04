# Handling Issues

How to handle reported issues? A long list of reported issues with many false positives may be caused by several things.
This document aims to help out with handling all of that.

## Contents

- [Unused files][1]
- [Unused dependencies][2]
- [Unlisted dependencies][3]
- [Unlisted binaries][4]
- [npx][5]
- [Unused exports][6]
- [Start using Knip in CI with lots of reported issues][7]

## Unused files

Here are a few things to consider when Knip reports unused files:

- Files may be reported as unused because they are not part of the dependency graph calculated from the (default)
  `entry` file patterns. When added to the `entry` file patterns, they will no longer be reported as unused.

- Files may be reported as unused because existing plugins do not include that type of entry file yet. This usually
  happens when a tool or framework has its own locations regarding entry files. For example, Next.js has `pages/**/*.js`
  and Remix has `app/routes/**/*.ts`. Potential solutions:

  - [Override plugin configuration][8] to customize default patterns for existing plugins.
  - [Create a new plugin][9] for tools or frameworks that are not [in the list][10] yet (or open an issue to request
    it).
  - In the meantime, such file patterns can be added manually to the `entry` patterns of any workspace

- When working in a repository that is not a package-based monorepo and contains many configuration files across the
  repository, see [multi-project repositories][11] to also match those files.

- Files and/or directories should be ignored when they are not used by other source code and configuration files. Or
  when they are magically imported by other tooling, such as fixtures, mocks or templates. Here are a few examples of
  common ignore patterns:

  ```json
  {
    "ignore": ["**/*.d.ts", "**/__mocks__", "**/__fixtures__"]
  }
  ```

- Source files are reported as unused, when only their build artifact is imported. For instance, a `src/module.ts` file
  is compiled to `dist/core.js`. When another source file (or package) imports `dist/core.js`, then `src/module.ts` is
  not referenced from anywhere. The solution is to add `src/module.ts` to the entry file patterns.

- When a file in the dependency graph is ignored (caused by `.gitignore`) and that is the only one that imports a source
  file, then the latter is reported as unused. For instance, for a dependency graph like `src/index.ts` →
  `ignored/file.ts` → `src/module.ts`, the ignored file is not part of the dependency graph and causes `src/module.ts`
  to be reported as unused. In this case, potential solutions include:

  - Add `src/module.ts` to the `entry` file patterns.
  - Add `ignored/file.ts` to the `entry` file patterns.
  - Add `src/module.ts` to the `ignore` file patterns.
  - Make sure `ignored/file.ts` is not ignored by `.gitignore` anymore.
  - Use `--no-gitignore` to ignore `.gitignore` files (so `ignored/file.ts` is added to the dependency graph).

## Unused dependencies

Dependencies imported in unused files are reported as unused dependencies. So it's good to remedy too many unused files
first.

- If unused dependencies are related to dependencies having a Knip [plugin][10], the `config` and/or `entry` files for
  that dependency may be at custom locations. The default values are in the plugin's documentation and can be overridden
  to match the custom path(s).

- If a dependency doesn't have a Knip plugin yet, this might result in false positives. For instance, when
  `tool.config.js` refers to `@tool/package` then this dependency will be reported as an unused. Please file an issue or
  [create a new plugin][9].

- Dependencies might be imported only from files with extensions like `.mdx`, `.vue` or `.svelte`. See [compilers][12]
  for more details on how to include them.

- Problematic dependencies can be ignored:

  ```json
  {
    "ignoreDependencies": ["ignore-me", "@problematic/package"]
  }
  ```

## Unlisted dependencies

This means that a dependency is used, but not listed in `package.json`.

An unlisted dependency might be a transitive dependency that's imported directly. For instance, Knip uses `fast-glob`
which in turn has `micromatch` as a (transitive) dependency. Knip uses both `fast-glob` and `micromatch`, resulting in
`micromatch` being reported as unlisted. The solution is to make sure `micromatch` itself is also listed in
`package.json`.

## Unlisted binaries

Binaries are supposed to come from listed (dev) dependencies. Binaries not in the `bin` field of any those
`package.json` files will be reported as unlisted binaries, except for those listed as `IGNORED_GLOBAL_BINARIES` in
[constants.ts][13].

Sometimes binaries are used like `commitlint`, but listed as `@commitlint/cli` in `devDependencies`. When the command
looks like `npx commitlint` or `commitlint`, `@commitlint/cli` might be reported as unused and `commitlint` as unlisted
(as it's technically a transitive dependency). This can usually be prevented by using the same package name in both
locations.

## npx

For `npx` scripts, Knip assumes that `--yes` (as in `npx --yes package`) means that the package is not listed. Knip
expects the dependency to be listed with `--no` or no flag at all.

The recommendation here is to be explicit: use `--yes` if the dependency is not supposed to be listed in `package.json`
(and vice versa).

## Unused exports

Unused exports of `entry` files are not reported.

Sometimes exports of non-entry files are meant to be imported by consumers of the library. There are a few options to
consider in this case:

- Move the export(s) to an entry file.
- Add the containing file to the `entry` array in the configuration.
- Re-export the export(s) from an existing entry file.
- Mark the export(s) [using the JSDoc `@public` tag][14].
- [Ignore exports used in file][15].

Note that entries in the `exports` map in `package.json` are automatically added as entry files by Knip (except when
they are ignored by a `.gitignore` entry).

## Start using Knip in CI with lots of reported issues

This type of QA only really works when it's tied to an automated workflow. But with too many issues to resolve in a
large codebase this might not be feasible right away. Here are a few options that may help in the meantime:

- Use `--no-exit-code` for exit code `0` in CI.
- Use `--include` (or `--exclude`) [output filters][16] to report only the issue types that have little or no errors.
- Use [`rules`][17] configuration to report only the issue types that have little or no errors.
- Use separate Knip commands to analyze e.g. only `--dependencies` or `--exports`.
- Use [ignore patterns][18] to filter out the most problematic areas.

[1]: #unused-files
[2]: #unused-dependencies
[3]: #unlisted-dependencies
[4]: #unlisted-binaries
[5]: #npx
[6]: #unused-exports
[7]: #start-using-knip-in-ci-with-lots-of-reported-issues
[8]: ../README.md#override-plugin-configuration
[9]: ./writing-a-plugin.md
[10]: ../README.md#plugins
[11]: ../README.md#multi-project-repositories
[12]: ./compilers.md
[13]: ../src/constants.ts
[14]: ../README.md#public-exports
[15]: ../README.md#ignore-exports-used-in-file
[16]: ../README.md#filters
[17]: ../README.md#rules
[18]: ../README.md#ignore
