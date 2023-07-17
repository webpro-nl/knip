# Handling Issues

How to handle reported issues? A long list of reported issues with many false positives may be caused by several things.
This document aims to help out with handling all of that.

## Unused files

Here are a few things to consider when Knip reports unused files:

- Files may be reported as unused because they are not part of the dependency graph calculated from the (default)
  `entry` file patterns. When added to the `entry` file patterns, they will no longer be reported as unused.

- Files may be reported as unused because existing plugins do not include that type of entry file yet. This usually
  happens when a tool or framework has its own locations regarding entry files. For example, Next.js has `pages/**/*.js`
  and Remix has `app/routes/**/*.ts`. Potential solutions:

  - [Override plugin configuration][1] to customize default patterns for existing plugins.
  - [Create a new plugin][2] for tools or frameworks that are not [in the list][3] yet (or open an issue to request it).
  - In the meantime, such file patterns can be added manually to the `entry` patterns of any workspace

- When working in a repository that is not a package-based monorepo and contains many configuration files across the
  repository, see [multi-project repositories][4] to also match those files.

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

- If unused dependencies are related to dependencies having a Knip [plugin][3], the `config` and/or `entry` files for
  that dependency may be at custom locations. The default values are in the plugin's documentation and can be overridden
  to match the custom path(s).

- If a dependency doesn't have a Knip plugin yet, this might result in false positives. For instance, when
  `tool.config.js` refers to `@tool/package` then this dependency will be reported as an unused. Please file an issue or
  [create a new plugin][2].

- Dependencies might be imported only from files with extensions like `.mdx`, `.vue` or `.svelte`. See [compilers][5]
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

- For npx, use `--yes` or `--no`. Knip behaves according to your intention. See [#160](https://github.com/webpro/knip/issues/160)

## Unused exports

Unused exports of `entry` files are not reported.

Sometimes exports of non-entry files are meant to be imported by consumers of the library. There are a few options to
consider in this case:

- Move the export(s) to an entry file.
- Add the containing file to the `entry` array in the configuration.
- Re-export the export(s) from an existing entry file.
- Mark the export(s) [using the JSDoc `@public` tag][6].
- [Ignore exports used in file][7].

Note that entries in the `exports` map in `package.json` are automatically added as entry files by Knip (except when
they are ignored by a `.gitignore` entry).

## Start using Knip in CI with too many reported issues

Eventually, this type of QA only really works when it's tied to an automated workflow. But with too many issues to
resolve this might not be feasible right away, especially in existing larger codebase. Here are a few options that may
help in the meantime:

- Use `--no-exit-code` for exit code 0 in CI.
- Use `--include` (or `--exclude`) [output filters][8] to report only the issue types that have little or no errors.
- Use [`rules`][9] configuration to report only the issue types that have little or no errors.
- Use separate Knip commands to analyze e.g. only `--dependencies` or `--exports`.
- Use [ignore patterns][10] to filter out the most problematic areas.

[1]: ../README.md#override-plugin-configuration
[2]: ./writing-a-plugin.md
[3]: ../README.md#plugins
[4]: ../README.md#multi-project-repositories
[5]: ./compilers.md
[6]: ../README.md#public-exports
[7]: ../README.md#ignore-exports-used-in-file
[8]: ../README.md#filters
[9]: ../README.md#rules
[10]: ../README.md#ignore
