---
title: FAQ
date: 2024-08-21
sidebar:
  hidden: true
---

## Introduction

Knip finds and removes unused files, dependencies and exports. As a "kitchen
sink" in the npm ecosystem, it creates a comprehensive module and dependency
graph of your project.

The JavaScript ecosystem has a vast amount of frameworks and tools, and even
more ways to configure those. Files and dependencies can be referenced in many
ways, not just through import statements. This FAQ is an attempt to provide some
perspective on why certain things work the way they do.

## Why isn't Knip an ESLint plugin?

Linters like ESLint analyze files separately, while Knip lints projects as a
whole.

Knip requires a full dependency graph to find things that are not referenced
across the project. Creating this graph is not a trivial task and it seems no
such tool exists today, even more so when it comes to monorepos.

## Why doesn't Knip use an existing module resolver?

Runtimes like Node.js provide `require.resolve` and `import.meta.resolve`.
TypeScript comes with module resolution built-in. More module resolvers are out
there and bundlers are known to use or come with module resolvers. None of them
seem to meet all requirements to be usable on its own by Knip:

- Support non-standard extensions like `.css`, `.svelte` and `.png`
- Support path aliases
- Support `exports` map in `package.json`
- Support self-referencing imports
- Rewire `package.json#main` build artifacts like `dist/module.js` to its source
  at `src/module.ts`
- Don't resolve to type definition paths like `module.d.ts` but source code at
  `module.js`

A few strategies have been tried and tweaked, and Knip currently uses a
combination of [enhanced-resolve][1], the TypeScript module resolver and a few
customizations. This single custom module resolver function is hooked into the
TypeScript compiler and language service hosts.

Everything else outside the dependency graph is handled by `enhanced-resolve`
when doing things like [script parsing][2] and resolving references to files in
other workspaces.

## Why doesn't Knip match my TypeScript project structure?

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

## Why doesn't Knip analyze workspaces in isolation by default?

Knip creates TypeScript programs to create a dependency graph and traverse the
AST. In a monorepo, it would make a lot of sense to create one program per
workspace. However, memory usage (and duration) goes through the roof quickly
when one program per workspace is created, sometimes even crashing Node.js.
That's why Knip shares a single program for workspaces if their configuration
allows it. This optimization is enabled by default, while it also allows the
module resolver (one per program) to do some more caching.

This can be disabled using the `--isolate-workspaces` flag, but is rarely
necessary in practice.

Also see [workspace sharing][3] (and [Slim down to speed up][4] for full
history).

## Why doesn't Knip just use `ts.findReferences`?

TypeScript has a very good "Find references" feature, that you might be using in
your IDE as well. Yet at scale this becomes too slow. That's why Knip builds up
its own module graph to look up export usage a lot faster.

Knip does use `ts.findReferences` to find references to class members (i.e. when
`classMembers` is enabled).

## Why can't I use path aliases to reference other workspaces?

Some projects use `compilerOptions.paths` to alias paths to other workspaces in
the same monorepo. This works for TypeScript and bundlers. However, it does not
work well with Knip, since Knip doesn't understand those paths might represent
workspaces. Knip is thus unable to match dependencies (including internal
workspaces) in `package.json` against import usage correctly.

Instead, it's recommended to list such workspaces/dependencies in
`package.json`, and import them as such. TypeScript and bundlers have no issues
with this standard approach either.

## What's up with that configurable `tsconfig.json` location?

There's a difference between `--tsConfig [file]` as a CLI argument and the
`typescript.config` option in Knip configuration.

The `--tsConfig [file]` option is used to provide an alternative location for
the default root `tsconfig.json` file. Relevant `compilerOptions` include
`paths` and `moduleResolution`. It's currently only possible to set this
location at the root level (i.e. not in other monorepo workspaces).

On the other hand, the `typescript.config` option is a TypeScript plugin option,
and can be set per-workspace. The plugin extracts referenced external
dependencies such as those in `extends`, `compilerOptions.types` and JSX
settings:

```json title="tsconfig.json"
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "compilerOptions": {
    "jsxImportSource": "hastscript/svg"
  }
}
```

From this example, Knip can determine whether the `@tsconfig/node20` and
`hastscript` dependencies are properly listed in `package.json`.

Note that the TypeScript plugin doesn't add support for TypeScript to Knip. Like
other plugins, it extracts dependencies from configuration files. With the
`typescript.config` option an alternative location for `tsconfig.json` can be
set per workspace.

## How does Knip handle non-standard import syntax?

Knip tries to be resilient against import syntax like what's used by e.g.
webpack loaders or Vite asset imports. Knip strips off the prefixes and suffixes
in import specifiers like this:

```ts title="component.ts"
import Icon from './icon.svg?raw';
import Styles from '-!style-loader!css-loader?modules!./styles.css';
```

In this example, the `style-loader` and `css-loader` dependencies should be
dependencies found in webpack configuration, handled by Knip's webpack plugin.

## What does Knip look for in source files?

The TypeScript source file parser is powerful and fault-tolerant. Knip visits
all nodes of the generated AST to find:

- Exports
- Imports (incl. dynamic import calls) of internal modules and external
  dependencies
- Accessed properties on namespace imports and re-exports to track individual
  export usage
- Calls to `require.resolve` and `import.meta.resolve`
- Scripts in template strings

## Where does Knip look for entry files?

- In [default locations][5] such as `index.js` and `src/index.ts`
- In `main`, `bin` and `exports` fields in `package.json`
- In the entry files as configured by enabled plugins
- In `config` files as configured and parsed by enabled plugins
- In dynamic imports (i.e. `require()` and `import()` calls)
- In `require.resolve('./entry.js')`
- In `import.meta.resolve('./entry.mjs')`
- Through scripts inside template strings in source files such as:
  ```ts
  await $({ stdio: 'inherit' })`c8 node hydrate.js`; // execa
  await $`node scripts/parse.js`; // bun/zx
  ```
- Through scripts in `package.json` such as:
  ```json
  {
    "name": "my-lib",
    "scripts": {
      "start": "node --import tsx/esm run.ts"
    }
  }
  ```

Entry files are added to the module graph and they might lead to additional
entry files recursively until no more entry files are found.

## Why does Knip have plugins?

Plugins are an essential part of Knip. They save a lot of configuration out of
the box by adding entry files as accurately as possible and only for the tools
actually installed. Yet the real magic is in their custom parsers for
configuration files.

For instance, Vitest has the `environment` configuration option. The Vitest
plugin knows `"node"` is the default value for `environment` which does not
require an extra package, but will translate `"edge-runtime"` to the
`@edge-runtime/vm` package. This allows Knip to report it if this package is not
listed in `package.json`, or when it is no longer used after changes in the
Vitest configuration.

Configuration files may also contain references to entry files. For instance,
Jest has `setupFilesAfterEnv: "<rootDir>/jest.setup.js"` or a reference may
point to a file in another workspace in the same monorepo, e.g.
`setupFiles: ['@org/shared/jest-setup.ts']`. Those entry files may also contain
imports of internal modules or external dependencies, and so on.

With an easy-to-use plugin API, many plugins have been created by contributors.

## Why is Knip so heavily engineered?

Even though I love the Unix philosophy, at this point I believe for Knip it
makes sense to have the pieces in a single tool.

Building up the module and dependencies graph requires non-standard module
resolution and not only static but also dynamic analysis (i.e. actually load and
execute modules), such as for parsers of plugins to receive the exported value
of dynamic tooling configuration files. Additionally, [exports consumed by
external libraries][6] require type information, as supported by the TypeScript
backend.

The rippling effect of plugins and recursively adding entry files and
dependencies to build up this graph - as answered with the previous question -
is also exactly what's meant by ["comprehensive" here][7].

## Does Knip handle Svelte or Astro files?

To further increase the coverage of the module graph, non-standard files other
than JavaScript and TypeScript modules should be included as well. For instance,
`.mdx` and `.astro` files can import each other, internal modules and external
dependencies.

Knip includes basic "compilers" for a few common file types (Astro, MDX, Svelte,
Vue). Knip does not include actual compilers for reasons of potential
incompatibility with the existing compiler, and dependency size. Knip allows to
override them with the compiler(s) in your project, and add additional ones for
other file types.

## Why are the exports of my `.vue` files not used?

Knip comes with basic "compilers" for a few common non-standard file types.
They're not actual compilers, they're regular expressions only to extract import
statements. Override the built-in Vue "compiler" with the real one in your
project. Also see the answer to the previous question and [Compilers][8].

## Why isn't production mode the default?

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

Also see [production mode][9].

## What's in the graph?

Once the module and dependency graph is created, it contains the information
required to create the report including all issue types:

- Unused files
- Unused dependencies
- Unused devDependencies
- Referenced optional peerDependencies
- Unlisted dependencies
- Unlisted binaries
- Unresolved imports
- Unused exports
- Unused exported types
- Unused exported enum members
- Duplicate exports

And optionally more issue types like individual exports and exported types in
namespace imports, and unused class members.

This graph allows to report more interesting details, such as:

- Circular references
- Usage numbers per export
- Export usage across workspaces in a monorepo
- List of all binaries used
- List of all used (OS) binaries not installed in `node_modules`

## Why doesn't Knip expose...?

A few things that have been requested and could be opened up for more flexible
usage of Knip:

- Programmatic API
- Custom plugins
- Module + dependency graph
- Custom AST visitors, e.g. to find and return:
  - Unused interface/type members
  - Unused object members (and e.g. React component props)
  - Unused object props in function return values

These are all interesting ideas, but increase API surface area and would mean
more development and maintenance work on my side. Given that [sponsorships][10]
are limited, this isn't feasible at the moment.

[1]: https://www.npmjs.com/package/enhanced-resolve
[2]: #parser
[3]: ../guides/performance.md#workspace-sharing
[4]: ../blog/slim-down-to-speed-up.md
[5]: ../explanations/entry-files.md#default-entry-file-patterns
[6]: ../guides/handling-issues.mdx#external-libraries
[7]: ../explanations/why-use-knip.md#comprehensive
[8]: ../features/compilers.md
[9]: ../features/production-mode.md
[10]: ../sponsors.md
