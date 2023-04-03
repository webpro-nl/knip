# Handling Issues

How to handle a long list of reported issues with false positives? The following sections describe potential causes for
false positives, and how to handle them.

## Unused files

Here are a few solutions you might want to consider when Knip reports too many unused files:

- Files may be reported as unused because they are not part of the (default) `entry` file patterns. When added to the
  `entry` file patterns, they will no longer be reported as unused.

- Files may be reported as unused because they are not part of the default file patterns and there's no plugin for that
  type of file yet. This usually happens when a tool or framework has its own standards regarding entry files. For
  example, Next.js has `pages/**/*.js` and Remix has `app/routes/**/*.ts`. Such file patterns can be added manually to
  the `entry` patterns of any workspace, or [override existing plugin configuration][1]. Even better: open an issue to
  report this or [create the plugin][2].

- When working in a repository that is not a package-based monorepo and contains many configuration files across the
  repository, see [multi-project repositories][3] for a potential solution.

- Ignore specific files and/or directories. Files and/or directories should be ignored when they are not used by other
  source code and configuration files. Or when they are magically imported by other tooling, such as fixtures, mocks or
  templates. Here are a few examples of common ignore patterns:

  ```json
  {
    "ignore": ["**/*.d.ts", "**/__mocks__", "**/__fixtures__"]
  }
  ```

## Unused dependencies

Dependencies imported in unused files are reported as unused dependencies. So it's good to remedy too many unused files
first.

- If unused dependencies are related to dependencies having a Knip [plugin][4], maybe the `config` and/or `entry` files
  for that dependency are at custom locations? The default values are in the plugin's documentation and can be
  overridden to match the custom location(s).

- If a dependency doesn't have a Knip plugin yet, this might result in false positives. For instance, when an unknown
  `tool.config.js` refers to `@tool/plugin` then this plugin will be reported as an unused dependency. Please file an
  issue or [create a new plugin][2].

- Dependencies might be used only in files with non-default extensions like `.mdx`, `.vue` or `.svelte`, etc. See
  [compilers][5] for more details.

- Problematic dependencies can be ignored:

  ```json
  {
    "ignoreDependencies": ["ignore-me", "@problematic/package"]
  }
  ```

## Unlisted dependencies

Unlisted dependencies are used, but not listed in `package.json`.

Often the reason for a dependency reported as unlisted is that it's a transitive dependency that can be imported
directly. For instance, Knip uses `fast-glob` which in turn has `micromatch` as a transitive dependency. When Knip
imports or uses `micromatch` directly somewhere, `micromatch` will be reported as unlisted, unless it's added as a
direct dependency of Knip itself in `package.json`.

## Unused exports

Unused exports of `entry` files are not reported. Exports of other files are might be reported as unused, while they are
meant to be used by consumers of the library. There are a few options to consider for those exported values and types:

- Move the export(s) to an entry file.
- Add the containing file to the `entry` array in the configuration.
- Re-export the export(s) from an existing entry file.
- Mark the export(s) [using the JSDoc `@public` tag][6].

## Start using Knip in CI with too many reported issues

Eventually, this type of QA only really works when it's tied to an automated workflow. But with too many issues to
resolve this might not be feasible right away, especially in existing larger codebase. Here are a few options that may
help in the meantime:

- Use `--no-exit-code` for exit code 0 in CI.
- Use `--include` (or `--exclude`) [output filters][7] to report only the issue types that have little or no errors.
- Use [`rules`][8] configuration to report only the issue types that have little or no errors.
- Use separate Knip commands to analyze e.g. only `--dependencies` or `--exports`.
- Use [ignore patterns][9] to filter out the most problematic areas.

[1]: ../README.md#override-plugin-configuration
[2]: ./writing-a-plugin.md
[3]: ../README.md#multi-project-repositories
[4]: ../README.md#plugins
[5]: ./compilers.md
[6]: ../README.md#public-exports
[7]: ../README.md#filters
[8]: ../README.md#rules
[9]: ../README.md#ignore
