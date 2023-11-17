---
title: Handling Issues
---

A long list of unused items can be frustrating. The list may contain many false
positives and/or it shows a lot of things that can be removed from the codebase.

This pages guides you in dealing with false positives, and wraps up with a few
things you can do if there's still a lot of work ahead of you.

It makes sense to go over the issue types one by one. For instance, reducing the
number of unused files will also reduce the number of unused dependencies. It's
recommended to work this list from top to bottom.

## Unused files

Files are reported as unused if they are in the set of project files, but not in
the set of files resolved from the entry files:

```
project files - (entry files + resolved files) = unused files
```

You may want to read the [entry files][1] explainer first to learn how and where
Knip looks for entry files.

In this section we'll look into common patterns that cause unused files and how
to handle them.

:::tip

Use `--include files` to [filter](../features/rules-and-filters.md#filters) the
report by unused files:

```sh
knip --include files
```

:::

### Mocks and other magic imports

Some files are magically imported by other tooling, such as fixtures, mocks or
templates. Usually you'll want to ignore those, with patterns like this:

```json
{
  "ignore": ["**/__mocks__/**", "**/__fixtures__/**"]
}
```

If they should be included instead, add them to the `entry` file patterns.

### Plugins

#### Existing Plugins

Files may be reported as unused if existing plugins do not include that entry
file pattern yet.

See the [plugins section of entry files][2] for more details. [Override plugin
configuration][3] to customize default patterns for existing plugins.

#### Missing Plugins

You might be using a tool or framework that's not in the list of available
plugins. Configuration and entry files (and related dependencies) may be
reported as unused because there is no plugin yet that includes those files. For
example, if some `tool.config.js` contains a reference to `@tool/package` then
both the file and the dependency may be reported as an unused.

[Create a new plugin][4] for tools or frameworks that are not [in the list][5]
yet, or open an issue to request it.

### Integrated Monorepos

Multiple instances of configuration files like `.eslintrc` and
`jest.config.json` across the repository may be reported as unused when working
in a (mono)repo with a single `package.json`. See [integrated monorepos][6] for
more details and how to configure plugins to target those configuration files.

### Build artifacts and ignored files

Sometimes build artifacts and `.gitignore` files may have a surprising effects
on files reported as unused. Results may be different in separate runs,
depending on the presence of build artifacts. Knip tries to do the right thing,
but in some cases you may need to add a file to the `entry` file patterns
manually for better or more consistent results.

## Unused dependencies

Dependencies imported in unused files are reported as unused dependencies.
That's why it's strongly recommended to try and remedy [unused files][7] first.
This solves many cases of reported unused dependencies.

:::tip

Use the `--dependencies` flag to
[filter](../features/rules-and-filters.md#filters) dependency related issues:

```sh
knip --dependencies
```

:::

### Plugins

If a plugin exists and the dependency is referenced in the configuration file,
but its custom dependency finder does not detect it, then that's a false
positive. Please open a pull request or issue to fix it.

Adding the configuration file as an `entry` file pattern may be a temporary
stopgap that fixes your situation, but it's better to create a new plugin or fix
an existing one.

### Non-standard Files

Dependencies might be imported from files with non-standard extensions like
`.mdx`, `.vue` or `.svelte`. These files are not included by default. See
[compilers][8] for more details on how to include them.

### Unreachable Code

If the reference to a dependency is unrecognizable or unreachable to Knip, and
you don't feel like a plugin could solve it, a last resort is to ignore it:

```json
{
  "ignoreDependencies": ["ignore-me", "@problematic/package"]
}
```

Depending on the situation, you may want to use `ignoreBinaries` instead. See
[unlisted binaries][9].

## Unlisted dependencies

This means that a dependency is used, but not listed in `package.json`.

An unlisted dependency is usually a transitive dependency that's imported
directly. The dependency is installed (since it's a dependency of another
dependency) and lives in `node_modules`, but it's not listed explicitly in
`package.json`.

You should not rely on transitive dependencies for various reasons, including
control, security and stability. The solution is to install and list the
dependency in `dependencies` or `devDependencies`.

## Unlisted binaries

Binaries are executable Node.js scripts. Many npm packages, when installed, add
an executable file to use from scripts in `package.json`. Examples include
TypeScript with the `tsc` binary, Next.js with the `next` binary, and so on.

Knip detects such binaries in scripts and checks whether there's package
installed that includes the binary. It looks up the `bin` field in the
`package.json` file of installed packages. If it doesn't find it, it will be
reported as an unlisted binary as there is no package listed that contains it.
Except for those listed as `IGNORED_GLOBAL_BINARIES` in `constants.ts`.

### Missing Binaries

In case the list of unused (dev) dependencies looks "offset" against the list of
unlisted binaries this might be caused by `node_modules` not containing the
packages. This in turn might have been caused by either the way your package
manager installs dependencies or by running Knip from inside a workspace instead
of from the root of the repository. Knip should run from the root, and you can
[lint individual workspaces][10].

### Example

Sometimes their usage or the way Knip reports them can be a bit confusing. See
this example:

```json
{
  "name": "lib",
  "scripts": {
    "commitlint": "commitlint --edit"
  },
  "devDependencies": {
    "@commitlint/cli": "*"
  }
}
```

This example works fine without anything reported, as the `@commitlint/cli`
package includes the `commitlint` binary. However, some script may contain
`npx commitlint` and here Knip assumes `commitlint` is the name of the package.
This technically works as `commitlint` is a transitive dependency, but to avoid
confusing Knip it's recommended to use `npx @commitlint/cli`.

## npx

For `npx` scripts, Knip assumes that `--yes` (as in `npx --yes package`) means
that the package is not listed. Knip expects the dependency to be listed with
`--no` or no flag at all.

The recommendation here is to be explicit: use `--yes` if the dependency is not
supposed to be listed in `package.json` (and vice versa).

## ESLint & Jest

Tools like ESLint (and Jest too) are a story on their own. Sharing and extending
configurations is great, but for a project linter like Knip it can be a
challenge to assign the dependencies to the right workspace in a monorepo. Yet
ESLint is moving to a modern configuration system, which results in Knip's
recommendation going forward: migrate to the new "flat config" system. Knip
already did.

In a monorepo, Jest has comparable characteristics. Moving forward, the Jest
plugin does not have top priority. Pull requests and big fixes are still
accepted of course.

## Unused exports

By default, Knip does not report unused exports of `entry` files. There's quite
a few places [Knip looks for entry files][1] and [plugins add additional entry
files][2].

For unused exports in the other used files, there are a few options to consider:

- Add the file to the `exports` field of `package.json`
- Add the file to the `entry` file patterns array in the configuration
- Move the export(s) to an entry file
- Re-export the unused export(s) from an entry file
- Mark the export(s) [using the JSDoc `@public` tag][11]
- [Ignore exports used in file][12]

:::tip

Use the `--exports` flag to [filter](../features/rules-and-filters.md#filters)
exports related issues:

```sh
knip --exports
```

:::

### Missing Exports?

Do you expect certain exports in the report, but are they missing? They might be
exported from an entry file. Use [--include-entry-exports][13] to make Knip also
report unused exports in entry files.

## Start using Knip in CI with lots of reported issues

Linting only really works when it's done in an automated fashion. But with too
many issues to resolve in a large codebase this might not be feasible right
away. Here are a few options that may help the process in the meantime:

- Use `--no-exit-code` for exit code `0` in CI.
- Use `--include` or `--exclude` [output filters][14] to focus on specific issue
  types.
- Use [`rules`][15] configuration to focus on specific issue types.
- Use separate Knip commands to lint e.g. only `--dependencies` or `--exports`.
- Use [ignore patterns][16] to filter out problematic areas.

[1]: ../explanations/entry-files.md
[2]: ../explanations/plugins.md#entry-files
[3]: ../explanations/entry-files.md#plugins
[4]: ./writing-a-plugin.md
[5]: ../reference/plugins.md
[6]: ../features/integrated-monorepos.md
[7]: #unused-files
[8]: ../features/compilers.md
[9]: #unlisted-binaries
[10]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
[11]: ../reference/jsdoc-tsdoc-tags.mdx
[12]: ../reference/configuration.md#ignore-exports-used-in-file
[13]: ../reference/configuration.md#includeentryexports
[14]: ../features/rules-and-filters.md
[15]: ../features/rules-and-filters.md#rules
[16]: ../reference/configuration.md#ignore
