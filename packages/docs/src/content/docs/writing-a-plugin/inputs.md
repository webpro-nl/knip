---
title: Inputs
description: Reference for Knip plugin input functions like toEntry, toDependency, toDeferResolve, toConfig, toBinary and toAlias, plus their options.
---

You may have noticed functions like `toDeferResolve` and `toEntry`. They're a
way for plugins to tell what they've found and how Knip should handle those. The
more precise a plugin can be, the better it is for results and performance.
Here's an overview of all input type functions:

- [toEntry][1]
- [toProductionEntry][2]
- [toProject][3]
- [toDependency][4]
- [toProductionDependency][5]
- [toDeferResolve][6]
- [toDeferResolveEntry][7]
- [toConfig][8]
- [toBinary][9]
- [toAlias][10]
- [Options][11]

## toEntry

An `entry` input is just like an `entry` in the configuration. It should either
be an absolute or relative path, and glob patterns are allowed.

## toProductionEntry

A production `entry` input is just like an `production` in the configuration. It
should either be an absolute or relative path, and it can have glob patterns.

## toProject

A `project` input is the equivalent of `project` patterns in the configuration.
It should either be an absolute or relative path, and (negated) glob patterns
are allowed.

## toDependency

The `dependency` indicates the entry is a dependency, belonging in either the
`"dependencies"` or `"devDependencies"` section of `package.json`. Use it for
package names referenced from configuration, such as a plugin or transformer a
tool loads at build time.

Knip marks the package as referenced, and reports it as an unlisted dependency
if it isn't listed at all. Such a reference is development-only: in [production
mode][12] the package is still marked as referenced, but an unlisted one is no
longer reported.

A specifier that is a file path (starting with `./` or `../`, or absolute) is
resolved as a file instead: Knip adds it as an entry file, or reports it under
"unresolved imports" if it can't be resolved. For a value that is either a
package name or a path, such as an item in Prettier's `plugins` option, prefer
to return [toDeferResolve][6] for a path, with the directory the tool resolves
it from as `dir`, and `toDependency` for anything else.

## toProductionDependency

The production `dependency` indicates the entry is a production dependency,
expected to be listed in `"dependencies"`. Unlike [toDependency][4] it's also
reported as unlisted in production mode.

## toDeferResolve

The `deferResolve` input type is used to defer the resolution of a specifier.
This could be resolved to a dependency or an entry file. For instance, the
specifier `"input"` could be resolved to `"input.js"`, `"input.tsx"`,
`"input/index.js"` or the `"input"` package name. Local files are added as entry
files, package names are external dependencies.

If this does not lead to a resolution, the specifier will be reported under
"unresolved imports".

## toDeferResolveEntry

The `deferResolveEntry` input type is similar to `deferResolve`, but it's used
for entry files only (not dependencies) and unresolved inputs are ignored. It's
different from `toEntry` as glob patterns are not supported.

A specifier inside `node_modules`, such as `node_modules/pkg/bin.js`, is the
exception: the tool loads that package rather than a project file, so Knip marks
the package as referenced, and reports it as an unlisted dependency if it isn't
listed.

## toConfig

The `config` input type is a way for plugins to reference a configuration file
that should be handled by a different plugin. The specifier is a path to that
file.

For instance, `angular.json` has `tsConfig` and `karmaConfig` options pointing
to files the TypeScript and Karma plugins know how to handle, so the Angular
plugin hands them over:

```ts
toConfig('typescript', 'tsconfig.app.json');
toConfig('karma', 'karma.conf.js');
```

## toBinary

The `binary` input type isn't used by plugins directly, but by the shell script
parser (through the `getInputsFromScripts` helper). Think of GitHub Actions
workflow YAML files or husky scripts. Using this input type, a binary is
"assigned" to the dependency that has it as a `"bin"` in their `package.json`.

## toAlias

The `alias` input type adds path aliases to the core module resolver. They're
added to `compilerOptions.paths` so the syntax is identical.

## Options

When creating inputs from specifiers, an extra `options` object as the second
argument can be provided.

### dir

The `dir` option tells Knip which directory a relative specifier is resolved
from, and which workspace the input belongs to. It must be an absolute directory
such as `options.cwd`, `options.configFileDir` or `options.rootCwd`: Knip
matches it against the absolute workspace directories, so a relative `dir` falls
back to the workspace of the file the input came from.

Use it when a tool resolves values from its working directory rather than from
its config file:

```ts
toDeferResolve(specifier, { dir: options.cwd });
```

And to assign inputs to another workspace. For instance, GitHub Action workflows
are always stored in the root workspace, and support `working-directory` in job
steps. For example:

```yaml
jobs:
  stylelint:
    runs-on: ubuntu-latest
    steps:
      - run: npx esbuild
        working-directory: packages/app
```

The GitHub Action plugin understands `working-directory` and adds this `dir` to
the input, an optional binary since workflow steps may run tools the repository
does not install:

```ts
toBinary('esbuild', {
  optional: true,
  dir: join(options.rootCwd, 'packages/app'),
});
```

Knip now looks up the `esbuild` binary in the workspace in the `packages/app`
directory and marks the package providing it as used.

Entry patterns resolve from `dir` as well, but `dir` never moves them to another
workspace: the workspace whose plugin returned the input globs the pattern. A
negated entry pattern excludes files only from the entry patterns the same
plugin returns with the same base (`dir`, else the workspace directory): a
negation from another base does not reach them, even when it resolves to the
same path. Project patterns ignore `dir`:

| Input type                                          | Relative to                             | Reads `dir` |
| --------------------------------------------------- | --------------------------------------- | ----------- |
| `toEntry`, `toProductionEntry`                      | `dir`, else the workspace directory     | base only   |
| `toProject`                                         | the workspace directory                 | no          |
| `toDeferResolve`, `toDeferResolveEntry`, `toConfig` | `dir`, else the config file's directory | yes         |
| `toDependency`, `toBinary`                          | not a path                              | yes         |
| `toAlias`                                           | `dir`, else the workspace directory     | yes         |

### production

Use the `production` flag for an input that is part of the production code, so
it's kept in [production mode][12]: a resolved file stays an entry file, and an
unlisted dependency or unresolved import is still reported. The production
helpers such as [toProductionDependency][5] set it already. For instance, a
module the build bundles into the application, resolved as a file or a package:

```ts
toDeferResolve(specifier, { dir: options.cwd, production: true });
```

### optional

Use the `optional` flag to indicate the dependency is optional. Then, a
dependency won't be flagged as unlisted if it isn't.

### isTypeOnly

Use `isTypeOnly` when only the types of a package are used, such as the packages
listed in `compilerOptions.types`. A `@types/pkg` dependency then satisfies the
reference on its own, without `pkg` itself being installed. Don't use it for
packages the tool actually loads, even if it does so only at build time.

### alsoReferenceOwner

Use `alsoReferenceOwner` together with `dir` when a shared config file, such as
an extended `tsconfig.json` preset, is read for another workspace. The
dependency is then referenced in the `dir` workspace and also in the workspace
that owns the file, so either one can list it.

### allowIncludeExports

By default, exports of entry files such as `src/index.ts` or the files in
`package.json#exports` are not reported as unused. When using the
`--include-entry-exports` flag or `isIncludeExports: true` option, unused
exports on such entry files are also reported.

Exports of entry files coming from plugins are not included in the analysis,
even with the option enabled. This is because certain tools and frameworks
consume named exports from entry files, causing false positives.

The `allowIncludeExports` option allows the exports of entry files to be
reported as unused when using `--include-entry-exports`. Use it with
[toProductionEntry][2] for entry patterns or `toDeferResolveProductionEntry` for
literal file paths.

Example:

```ts
toProductionEntry('./entry.ts', { allowIncludeExports: true });
toDeferResolveProductionEntry('./src/[variant]/entry.ts', {
  allowIncludeExports: true,
});
```

[1]: #toentry
[2]: #toproductionentry
[3]: #toproject
[4]: #todependency
[5]: #toproductiondependency
[6]: #todeferresolve
[7]: #todeferresolveentry
[8]: #toconfig
[9]: #tobinary
[10]: #toalias
[11]: #options
[12]: ../features/production-mode.md
