---
title: FAQ
date: 2024-08-20
---

## Introduction

Knip finds and fixes unused files, dependencies and exports. As a "kitchen sink"
in the npm ecosystem, it creates comprehensive module and dependency graphs of
your project.

:::note

The JavaScript/TypeScript ecosystem has a vast amount of frameworks and tools,
and even more ways to configure those. Files and dependencies can be referenced
in many ways, not just through static import statements. In short: "it's
complicated". Knip and documentation are always a work in progress.

:::

This FAQ is an attempt to provide some perspective on a few design decisions and
why certain things work the way they do. Here and there it's intentionally a bit
more in-depth than the rest of the docs.

## Comparison

### Why isn't Knip an ESLint plugin?

Linters like ESLint analyze files separately, while Knip lints projects as a
whole.

Knip requires full module and dependency graphs to find clutter across the
project. Creating these comprehensive graphs is not a trivial task and it seems
no such tool exists today, even more so when it comes to monorepos.

File-oriented linters like ESLint and Knip are complementary tools.

### Isn't tree-shaking enough?

In short: no. They share an important goal: improve UX by removing unused code.
The main takeaway here is that tree-shaking and Knip are different and
complementary tools.

Tree-shaking is a build or compile-time activity to reduce production bundle
size. It typically operates on bundled production code, which might include
external/third-party code. An optimization in the build process, "out of your
hands".

On the other hand, Knip is a project linter that should be part of QA. It lints,
reports and fixes only your own source code. A linter reporting issues hands
control back to you (unless you [auto-fix][1] everything).

Besides those differences, Knip has a broader scope:

- Improve DX (see [less is more][2]).
- Include non-production code and dependencies in the process by default.
- Report more [issue types][3] (such as unlisted dependencies).

## Synergy

### Why does Knip have plugins?

Plugins are an essential part of Knip. They prevent you from a lot of
configuration out of the box, by adding entry files as accurately as possible
and only for the tools actually installed. Yet the real magic is in their custom
parsers for configuration files and command-line argument definitions.

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

### Why is Knip so heavily engineered?

Even though a modular approach has its merits, for Knip it makes sense to have
all the pieces in a single tool.

Building up the module and dependency graphs requires non-standard module
resolution and not only static but also dynamic analysis (i.e. actually load and
execute modules), such as for parsers of plugins to receive the exported value
of dynamic tooling configuration files. Additionally, [exports consumed by
external libraries][4] require type information, as supported by the TypeScript
backend. Last but not least, shell script parsing is required to find the right
entry files, configuration files and dependencies accurately.

The rippling effect of plugins and recursively adding entry files and
dependencies to build up the graphs is also exactly what's meant by
["comprehensive" here][5].

## Building the graphs

### Where does Knip look for entry files?

- In default locations such as `index.js` and `src/index.ts`
- In `main`, `bin` and `exports` fields in `package.json`
- In the entry files as configured by enabled plugins
- In `config` files as configured and parsed by enabled plugins
- The `config` files themselves are entry files
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
      "start": "node --import tsx/esm run.ts",
      "start": "vitest -c config/vitest.config.ts"
    }
  }
  ```
- Through plugins handling CI workflow files like `.github/workflows/ci.yml`:
  ```yaml
  jobs:
    test:
      steps:
        run: playwright test e2e/**/*.spec.ts --config playwright.e2e.config.ts
        run: node --import tsx/esm run.ts
  ```

Scripts like the ones shown here may also contain references to configuration
files (`config/vitest.config.ts` and `playwright.e2e.config.ts` in the examples
above). They're recognized as configuration files and passed to their respective
plugins, and may contain additional entry files.

Entry files are added to the module graph. [Module resolution][6] might result
in additional entry files recursively until no more entry files are found.

### What does Knip look for in source files?

The TypeScript source file parser is powerful and fault-tolerant. Knip visits
all nodes of the generated AST to find:

- Imports and dynamic imports of internal modules and external dependencies
- Exports
- Accessed properties on namespace imports and re-exports to track individual
  export usage
- Calls to `require.resolve` and `import.meta.resolve`
- Scripts in template strings (passed to [script parser][7])

### What's in the graphs?

Once the module and dependency graphs are created, they contain the information
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

The graphs allows to report more interesting details, such as:

- Circular references
- Usage numbers per export
- Export usage across workspaces in a monorepo
- List of all binaries used
- List of all used (OS) binaries not installed in `node_modules`

### Why doesn't Knip just read the lockfile?

Knip reads the `package.json` file of each dependency. Most of the information
required is in the lockfile as well, which would be more efficient. However,
there are a few issues with this approach:

- It requires lockfile parsing for each lockfile format and version of each
  package manager.
- The lockfile doesn't contain whether the package [has types included][8].

## Module Resolution

### Why doesn't Knip use an existing module resolver?

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
combination of [enhanced-resolve][9], the TypeScript module resolver and a few
customizations. This single custom module resolver function is hooked into the
TypeScript compiler and language service hosts.

Everything else is handled by `enhanced-resolve` for things like [script
parsing][7] and resolving references to files in other workspaces.

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

A TypeScript program has a 1-to-1 relationship with workspaces if they're
analyzed in isolation. However, by default Knip optimizes for performance and
utilizes [workspace sharing][10]. That's why debug output contains messages like
"Installed 2 programs for 29 workspaces".

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

### Why doesn't Knip analyze workspaces in isolation by default?

Knip creates TypeScript programs to create a module graph and traverse file
ASTs. In a monorepo, it would make a lot of sense to create one program per
workspace. However, this slows down the whole process considerably. That's why
Knip shares the files of multiple workspaces in a single program if their
configuration allows it. This optimization is enabled by default, while it also
allows the module resolver (one per program) to do some more caching.

Also see [workspace sharing][10].

### Why doesn't Knip just use `ts.findReferences`?

TypeScript has a very good "Find references" feature, that you might be using in
your IDE as well. Yet at scale this becomes too slow. That's why Knip builds up
its own module graph to look up export usages. Additional benefits for this
comprehensive graph include:

- serializable and cacheable
- enables more features
- usable for other tools to build upon as well

Without sacrificing these benefits, Knip does use `ts.findReferences` to find
references to class members (i.e. when the issue type `classMembers` is
included). In case analysis of exports requires type information of external
dependencies, the [`--include-libs ` flag][4] will trigger the same.

### Why can't I use path aliases to reference other workspaces?

Some projects use `compilerOptions.paths` to alias paths to other workspaces in
the same monorepo. Knip doesn't understand those paths might represent internal
workspaces and might report false positives.

Instead, it's recommended to list such workspaces/dependencies in
`package.json`, and import them as such. Other tooling has no issues with this
standard approach either.

### What's up with that configurable `tsconfig.json` location?

There's a difference between `--tsConfig [file]` as a CLI argument and the
`typescript.config` option in Knip configuration.

The [`--tsConfig [file]` option][11] is used to provide an alternative location
for the default root `tsconfig.json` file. Relevant `compilerOptions` include
`paths` and `moduleResolution`. This setting is only available at the root
level.

On the other hand, the [`config` option of the plugin][12] can be set per
workspace. The TypeScript plugin extracts referenced external dependencies such
as those in `extends`, `compilerOptions.types` and JSX settings:

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

#### Notes

- The TypeScript plugin doesn't add support for TypeScript to Knip (that's
  already built-in). Like other plugins, it extracts dependencies from
  `tsconfig.json`. With the `typescript.config` option an alternative location
  for `tsconfig.json` can be set per workspace.
- In case path aliases from `compilerOptions.paths` aren't picked up by Knip,
  either use `--tsConfig [file]` to target a different `tsconfig.json`, or
  manually add [paths][13] to the Knip configuration. The latter can be done per
  workspace.

## Compilers

### How does Knip handle Svelte or Astro files?

To further increase the coverage of the module graph, non-standard files other
than JavaScript and TypeScript modules should be included as well. For instance,
`.mdx` and `.astro` files can import each other, internal modules and external
dependencies.

Knip includes basic "compilers" for a few common file types (Astro, MDX, Svelte,
Vue). Knip does not include actual compilers for reasons of potential
incompatibility with the existing compiler, and dependency size. Knip allows to
override them with the compilers in your project, and add additional ones for
other file types.

### Why are the exports of my `.vue` files not used?

Knip comes with basic "compilers" for a few common non-standard file types.
They're not actual compilers, they're regular expressions only to extract import
statements. Override the built-in Vue "compiler" with the real one in your
project. Also see the answer to the previous question and [Compilers][14].

## Miscellaneous

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

Also see [production mode][15].

### Why doesn't Knip have...?

Examples of features that have been requested include:

- Expose programmatic API
- Add local/custom plugins
- Expose the module and dependency graphs
- Custom AST visitors, e.g. to find and return:
  - Unused interface/type members
  - Unused object members (and e.g. React component props)
  - Unused object props in function return values
- Analyze workspaces in parallel
- Plugins for editors like VS Code and WebStorm (LSP-based?)
- Support Deno
- Improve internal code structures and accessibility to support contributions
- One-shot dead code removal (more comprehensive removal of unused variables,
  duplicate exports, dead code, etc).
- Replace dependencies for better performance and correctness, such as for shell
  script parsing, module resolution and globbing with "unignores".

These are all interesting ideas, but most increase the API surface area, and all
require more development efforts and maintenance. Time is limited and
[sponsorships][16] currently don't cover - this can change though!

[1]: ../features/auto-fix.mdx
[2]: ../explanations/why-use-knip.md#less-is-more
[3]: ./issue-types.md
[4]: ../guides/handling-issues.mdx#external-libraries
[5]: ../explanations/why-use-knip.md#comprehensive
[6]: #module-resolution
[7]: ../features/script-parser.md
[8]: ../guides/handling-issues.mdx#types-packages
[9]: https://www.npmjs.com/package/enhanced-resolve
[10]: ../guides/performance.md#workspace-sharing
[11]: ../reference/cli.md#--tsconfig-file
[12]: ../explanations/plugins.md#configuration-files
[13]: ../reference/configuration.md#paths
[14]: ../features/compilers.md
[15]: ../features/production-mode.md
[16]: /sponsors
