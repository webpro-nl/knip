---
title: FAQ
description: Design decisions behind Knip, common pitfalls, how it compares to ESLint and tree-shaking, and how the module graph works.
date: 2024-08-20
---

## Introduction

Knip finds and fixes unused dependencies, exports and files. As a "kitchen sink"
in the npm ecosystem, it creates a comprehensive module graph of your project.

:::note[Rationale]

The JavaScript/TypeScript ecosystem has a vast amount of frameworks and tools.
Additionally, file locations, configuration semantics, command-line arguments
and so on vary wildly. Files and dependencies are referenced in many ways. Knip
tries harder than you think to cover it all.

:::

This FAQ explains a few design decisions and why certain things work the way
they do, here and there in more depth than the rest of the docs.

:::tip

Try the [Knip MCP Server][1] or the [Knip Editor Extension][2]. Let your coding
agent use the built-in MCP Server and create a custom `knip.json` for you, so
you don't have to.

:::

## Common Pitfalls

### Why shouldn't I ignore or disable configuration hints?

Configuration hints are critical for building a healthy and accurate module
graph. They usually indicate that Knip cannot resolve a dependency, plugin, or
entry file. If you ignore or disable these hints, Knip's understanding of your
project will be incomplete, which inevitably leads to false positives (reporting
used code as unused). Always address configuration hints first before looking at
other reported issues.

### Why is it a bad idea to use `ignore` patterns like I do in ESLint?

Knip is not a regular file-based linter like ESLint. It works by analyzing the
entire interconnected module graph of your project. Using `ignore` patterns does
not exclude files from the analysis, it only suppresses the reporting of issues
in those files. This hides real issues and creates blind spots. Instead of
ignoring files, ensure your entry points and plugins are configured correctly,
and use `project` patterns to define the boundaries of your codebase. Read more:
[Configuring Project Files][3].

If you have specific exports (such as types) that are only used within the file
they are defined, use the [ignoreExportsUsedInFile][4] configuration option
rather than ignoring the file entirely.

### How should I exclude tests and development tools from the analysis?

A common mistake is trying to exclude test files, storybooks, or development
tools using `project` or `ignore` patterns. The correct approach is to use
[production mode][5]. This mode is specifically designed to strictly analyze
only your production source code and `dependencies`, automatically excluding
tests and `devDependencies` without requiring complex ignore rules.

### Why shouldn't I run `knip --fix` immediately?

Running `knip --fix` before your configuration is fully settled is dangerous. If
your configuration is missing entry points or has unresolved hints, Knip might
think perfectly valid, actively used code is unused. Auto-fixing in this state
can lead to deleting code that your application relies on. Always verify the
reported issues manually and ensure your configuration is solid before using the
`--fix` flag.

## Comparison

### Why isn't Knip an ESLint plugin?

Linters like ESLint analyze files separately, while Knip lints projects as a
whole.

Knip requires a full module and dependency graph to find clutter across the
project. Building the graph is substantial work, especially in monorepos.

File-oriented linters like ESLint are complementary to Knip.

### Isn't tree-shaking enough?

No. They share a goal: improving UX by removing unused code. But tree-shaking
and Knip are different, complementary tools.

Tree-shaking is a build-time optimization to reduce production bundle size. It
operates on bundled production code, which might include external code, and runs
automatically (out of your hands).

On the other hand, Knip is a project linter for the development and QA phase. It
reports and fixes only your own source code, and leaves the changes for you to
review. It focuses on inter-file dependencies, so dead code within a single file
may slip through.

Besides those differences, Knip has a broader scope:

- Improve DX (see [less is more][6]).
- Unless using [production mode][5], also lint all source code like tests,
  scripts and Storybook stories.
- Handle more [types of issues][7] (such as unlisted dependencies).

For how Knip compares to other unused-code tools and how to migrate from them,
see [Comparison & Migration][8].

## Synergy

### Why does Knip have plugins?

Plugins are an essential part of Knip. They save you a lot of configuration out
of the box, by adding entry files as accurately as possible and only for the
tools actually installed. More powerful still are their custom parsers for
configuration files and command-line argument definitions.

For instance, Vitest has the `environment` configuration option. The Vitest
plugin knows `"node"` is the default value for `environment` which does not
require an extra package, but will translate `"edge-runtime"` to the
`@edge-runtime/vm` package. This allows Knip to report it if this package is not
listed in `package.json`, or when it is no longer used after changes in the
Vitest configuration.

Configuration files may also contain references to entry files. For instance,
Jest has `setupFilesAfterEnv: "<rootDir>/jest.setup.js"` or a reference may
point to a file in another workspace in the same monorepo, e.g. `setupFiles:
['@org/shared/jest-setup.ts']`. Those entry files may also contain imports of
internal modules or external dependencies, and so on.

### Why is Knip so heavily engineered?

Even though a modular approach has its merits, for Knip it makes sense to have
all the pieces in a single tool.

Building up the module and dependency graph takes more than standard module
resolution. It needs dynamic analysis, not just static: plugin parsers actually
load and execute dynamic tooling configuration files to read their exported
value. On top of that, [exports consumed by external libraries][9] require type
information. And shell script parsing is needed to find the right entry files,
configuration files and dependencies accurately.

The rippling effect of plugins recursively pulling in more entry files and
dependencies is exactly what ["comprehensive"][10] refers to.

## Design decisions

### Why isn't production mode the default?

The default mode of Knip includes all source files, tests, dependencies, dev
dependencies and tooling configuration.

On the other hand, production mode considers only source files and production
dependencies. Plugins add only production entry files.

Which mode should've been the default? They both have their merits:

- Production mode catches dead production code and dependencies. This mode has
  the most impact on UX, since less code tends to be faster and safer.
- Default mode potentially catches more issues, e.g. lots of unused plugins of
  tooling, including most issues found in production mode. This mode has the
  most impact on DX, for the same reason.

Also see [production mode][5].

### Why doesn't Knip just read the lockfile?

Knip reads the `package.json` file of each dependency. Most of the information
required is in the lockfile as well, which would be more efficient. However,
lockfiles lack some data, including:

- It requires lockfile parsing for each lockfile format and version of each
  package manager.
- The lockfile doesn't contain whether the package [has types included][11].
- The lockfile doesn't contain entry point fields (`main`, `module`, `exports`)
  needed to resolve what a dependency actually exposes.
- The lockfile doesn't contain `bin` entries to determine installed binaries.

### Why doesn't Knip use an existing module resolver?

It does: Knip uses [oxc-resolver][12]. A runtime or bundler resolver can't be
used as-is, because Knip resolves imports to your source across every workspace
in a (mono)repo. It has to:

- Resolve to source (`src/module.ts`), not type definitions (`module.d.ts`) or
  the build artifact a `package.json#main` like `dist/module.js` points to
- Resolve non-standard extensions like `.svelte`, `.astro` and `.css` so those
  files enter the module graph

oxc-resolver is configurable enough for this. Combined with a thin layer for
Knip-configured `paths` and plugin aliases. This covers resolution across all
workspaces and[script parsing][13] and references to files in other workspaces.

### Why doesn't Knip match my TypeScript project structure?

Repositories and workspaces in a monorepo aren't necessarily structured like
TypeScript projects. Put simply, the location of `package.json` files isn't
always adjacent to `tsconfig.json` files. Knip follows the structure of
workspaces in a monorepo.

An additional layering of TypeScript projects would complicate things. The
downside is that a `tsconfig.json` file not used by Knip may have conflicting
module resolution settings, potentially resulting in missed files.

In practice, this is rarely an issue. Knip sticks to the workspaces structure
and installs a single "kitchen sink" module resolver function per workspace.
Different strategies might add more complexity and performance penalties, while
the current strategy is simple, fast and good enough.

Note that any directory with a `package.json` not listed in the root
`package.json#workspaces` can be added to the Knip configuration manually to
have it handled as a separate workspace.

If you do want Knip to take its project files from `tsconfig.json` rather than
its own `project` patterns, see [`--use-tsconfig-files`][14].

### Why doesn't Knip just use `ts.findReferences`?

TypeScript has a very good "Find references" feature, that you might be using in
your IDE as well. There are a few reasons Knip doesn't use it:

- It requires the full TypeScript language service, which is heavy to
  initialize.
- It must be called per symbol. A project with thousands of exports would need
  thousands of calls, each scanning potentially all files. Knip parses each file
  once and resolves all export usages from the resulting graph.
- It operates within a single TypeScript program. Monorepos with multiple
  `tsconfig.json` files would need separate language service instances.
- It cannot see into non-standard files like `.vue`, `.svelte` and `.astro`.

Knip's module graph is also serializable and cacheable, and usable for other
tools to build upon.

### Why doesn't Knip have...?

Examples of features that have been requested include:

- Expose programmatic API
- Add local/custom plugins
- Expose the module and dependency graph
- Custom AST visitors, e.g. to find and return:
  - Unused interface/type members
  - Unused object members (and e.g. React component props)
  - Unused object props in function return values
- Analyze workspaces in parallel
- Support Deno

These are all interesting ideas, but most increase the API surface area, and all
require more development efforts and maintenance. Time is limited and
[sponsorships][15] currently don't cover - this can change though!

## Under the hood

### Where does Knip look for entry files?

Knip discovers them from defaults, `package.json`, enabled plugins, source-code
imports and resolution calls (`require.resolve`, `import.meta.resolve`, `new
URL`, `new Worker`, `module.register`), and parsed scripts. See [Entry
Files][16] for the complete list. Entry files are added to the module graph, and
[module resolution][17] may result in more entry files recursively until none
remain.

### What does Knip look for in source files?

Knip uses oxc-parser to parse source files, it's powerful and fault-tolerant.
Knip visits all nodes of the generated AST to find:

- Imports and dynamic imports of internal modules and external dependencies
- Exports
- Accessed properties on namespace imports and re-exports to track individual
  export usage
- Entry files from `require.resolve`, `import.meta.resolve`, `new URL(specifier,
import.meta.url)`, `new Worker(…)`, `child_process` `fork`/`spawn`/`execFile`,
  and `module.register()`
- Scripts passed to the [script parser][13]: tagged `$` templates (`bun`,
  `execa`, `zx`) and `node:child_process`, `execa` and `nano-spawn` calls

### What's in the graph?

Once built, the graph holds everything needed to produce the report: every
[issue type][7], from unused files and dependencies to unused exports, types and
enum members.

The graph also surfaces more interesting details, such as:

- Circular references
- Usage numbers per export
- Export usage across workspaces in a monorepo
- List of all binaries used
- List of all used (OS) binaries not installed in `node_modules`

### How does Knip handle non-standard import syntax?

Knip tries to be resilient against import syntax like what's used by e.g.
webpack loaders or Vite asset imports. Knip strips off the prefixes and suffixes
in import specifiers like this:

```ts title="component.ts"
import Icon from './icon.svg?raw';
import Styles from '-!style-loader!css-loader?modules!./styles.css';
```

In this example, the `style-loader` and `css-loader` dependencies should be
dependencies found in webpack configuration, handled by Knip's webpack plugin.

## TypeScript

### What's the difference between workspaces, projects and programs?

A workspace is a directory with a `package.json` file. They're configured in
`package.json#workspaces` (or `pnpm-workspaces.yml`). In case a directory has a
`package.json` file, but is not a workspace (from a package manager
perspective), it can be added as a workspace to the Knip configuration.

Projects - in the context of TypeScript - are directories with a `tsconfig.json`
file. They're not a concept in Knip.

Knip analyzes all workspaces using a single module graph with a shared module
resolver.

### What's up with that configurable `tsconfig.json` location?

Two settings point Knip at a `tsconfig.json`, and they do different things:

- [`--tsConfig [file]`][18] (CLI, root only) sets an alternative location for
  the root `tsconfig.json`. Knip reads its `compilerOptions`, notably `paths`
  and `moduleResolution`.
- [`typescript.config`][19] (plugin, per workspace) sets the location the
  TypeScript plugin reads to extract referenced dependencies from `extends`,
  `compilerOptions.types` and JSX settings:

```json title="tsconfig.json"
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": {
    "jsxImportSource": "hastscript/svg"
  }
}
```

From this example, Knip can tell whether `@tsconfig/node20` and `hastscript` are
listed in `package.json`.

Note that the TypeScript plugin doesn't add TypeScript support to Knip (that's
built-in); like other plugins, it extracts dependencies from `tsconfig.json`. If
path aliases from `compilerOptions.paths` aren't picked up, either point
`--tsConfig` at the right `tsconfig.json` or add [paths][20] to the Knip config
(per workspace).

### What does `--use-tsconfig-files` do?

By default Knip discovers project files with its own `project` patterns. The
[`--use-tsconfig-files`][14] flag instead takes them from `tsconfig.json` per
workspace. Those become TypeScript program files, so Knip analyzes their exports
and dependencies but does not report them as unused files: delegating project
definition to `tsconfig.json` declares them intentional, including empty files.
This is by design: use the default `project` patterns (discovery mode) to flag
dangling files. Implicitly enabled in the [editor extension, MCP server and
language server][21] without a Knip configuration file.

## Compilers

### How does Knip handle Svelte or Astro files?

To further increase the coverage of the module graph, non-standard files other
than JavaScript and TypeScript modules should be included as well. For instance,
`.mdx` and `.astro` files can import each other, internal modules and external
dependencies.

Knip includes basic "compilers" for a few common file types (Astro, MDX, Svelte,
Vue). These are lightweight regex-based extractors, not actual compilers. You
can override the built-in compilers with your project's actual compiler, and add
additional ones for other file types.

### Why are the exports of my `.vue` files not used?

The built-in compilers extract `import` statements only, so the exports declared
in a `.vue` or `.svelte` file aren't analyzed and may be reported as unused.
Override the built-in with a real compiler. See [Compilers][22].

[1]: ../reference/integrations.md#mcp-server
[2]: ../reference/integrations.md#vs-code-extension
[3]: ../guides/configuring-project-files.md
[4]: ../reference/configuration.md#ignoreexportsusedinfile
[5]: ../features/production-mode.md
[6]: ../explanations/why-use-knip.md#less-is-more
[7]: ./issue-types.md
[8]: ../explanations/comparison-and-migration.md
[9]: ../guides/handling-issues.mdx#external-libraries
[10]: ../explanations/why-use-knip.md#comprehensive
[11]: ../guides/handling-issues.mdx#type-definition-packages
[12]: https://oxc.rs/docs/guide/usage/resolver.html
[13]: ../features/script-parser.md
[14]: ../reference/cli.md#--use-tsconfig-files
[15]: /sponsors
[16]: ../explanations/entry-files.md#where-knip-looks-for-entry-files
[17]: #why-doesnt-knip-use-an-existing-module-resolver
[18]: ../reference/cli.md#--tsconfig-file
[19]: ../explanations/plugins.md#configuration-files
[20]: ../reference/configuration.md#paths
[21]: ../reference/integrations.md
[22]: ../features/compilers.md
