---
title: Inputs
description: Reference for Knip plugin input functions like toEntry, toEntryPath, toModule, toDependency and toConfig, plus their options.
---

Input helpers tell Knip what a plugin found and how to handle it. Choose a
helper based on the value the tool accepts:

- [toEntry][1]
- [toEntryPath][2]
- [toProject][3]
- [toDependency][4]
- [toModule][5]
- [toConfig][6]
- [toBinary][7]
- [toAlias][8]
- [Options][9]

## toEntry

Use `toEntry` for absolute or relative entry paths and glob patterns, including
negations, just like `entry` in the configuration. Relative patterns use `dir`,
defaulting to the workspace directory. A pattern that matches no files is
ignored.

Set `production: true` for application entry patterns:

```ts
toEntry('src/routes/**/*.tsx', { production: true });
```

## toEntryPath

Use `toEntryPath` to resolve one entry path without interpreting glob syntax.
Extensionless paths, directory indexes and aliases can be resolved. Relative
paths use `dir`, defaulting to the config file's directory. Missing local files
are ignored.

```ts
toEntryPath('src/[variant]/bootstrap', { dir: options.cwd, production: true });
```

Resolution tries a local path before the original specifier. For example, with
both a declared `input` dependency and an `input.js` file,
`toEntryPath('input')` chooses the file. Use [toModule][5] when the package
should take precedence.

This helper can also reference dependencies: a resolved package target, a scoped
package name or a path inside `node_modules` can credit a package or produce an
unlisted dependency issue. Ignoring missing local files does not suppress
unlisted dependency issues; use `optional: true` when those should be suppressed
too.

## toProject

A `project` input is the equivalent of `project` patterns in the configuration.
It should either be an absolute or relative path, and (negated) glob patterns
are allowed.

## toDependency

Use `toDependency` for known package references, such as a plugin or transformer
a tool loads at build time. Knip marks the package as referenced and reports it
as unlisted if it isn't declared, without requiring it to be installed.

References are development-only by default: in [production mode][10] they
neither count as dependency usage nor produce unlisted issues. Set
`production: true` for runtime dependencies:

```ts
toDependency('react', { production: true });
```

A file path starting with `./` or `../`, or an absolute local path, is resolved
as a file instead. Knip adds it as an entry file or reports an unresolved
import. For a value that may be a package or local module, use [toModule][5].

## toModule

Use `toModule` for a specifier that may refer to a package or a local module.
Relative file resolution uses `dir`, defaulting to the config file's directory.
Glob patterns are not supported.

A recognized package takes precedence over a same-named local file. A declared
external package can satisfy the reference even when it isn't installed. An
installed but undeclared package is reported as unlisted. Otherwise Knip tries
file resolution, including extensions and aliases, and adds a resolved local
file as an entry.

```ts
toModule('input', { dir: options.cwd });
```

This can reference the `input` package or resolve a file such as `input.js`,
`input.tsx` or `input/index.js`. Missing local files are reported as unresolved
imports. Use [toEntryPath][2] for file-first resolution with missing-file
tolerance.

Both helpers can produce entry files or dependency references.
`toModule(value, { optional: true })` still uses package-first resolution, so it
is not a substitute for `toEntryPath(value)`.

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

The entry, module, dependency and binary helpers accept an `options` object as
their second argument. `toConfig` and `toAlias` accept it as their third
argument. `toProject` accepts no options.

### dir

The `dir` option tells Knip which directory a relative specifier is resolved
from, and which workspace the input belongs to. It must be an absolute directory
such as `options.cwd`, `options.configFileDir` or `options.rootCwd`: Knip
matches it against the absolute workspace directories, so a relative `dir` falls
back to the workspace of the file the input came from.

Use it when a tool resolves values from its working directory rather than from
its config file:

```ts
toModule(specifier, { dir: options.cwd });
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

| Input helper                          | Relative to                             | Reads `dir` |
| ------------------------------------- | --------------------------------------- | ----------- |
| `toEntry`                             | `dir`, else the workspace directory     | base only   |
| `toProject`                           | the workspace directory                 | no          |
| `toModule`, `toEntryPath`, `toConfig` | `dir`, else the config file's directory | yes         |
| `toDependency`, `toBinary`            | not a path                              | yes         |
| `toAlias`                             | `dir`, else the workspace directory     | yes         |

### production

Use `production: true` for inputs that belong to production code. In [production
mode][10], their files remain entries, their dependency references count as
usage, and applicable unlisted or unresolved issues are still reported. This
does not change the helper's reporting policy: `toEntryPath` still ignores
missing local files.

```ts
toModule(specifier, { dir: options.cwd, production: true });
```

Inputs without this flag are development-only. In production mode they do not
count as dependency usage or produce missing-reference issues. Their resolved
local files can still identify development files to exclude.

### optional

Use `optional: true` to suppress unlisted dependency, unresolved import and
missing binary issues for that input. Existing targets are still resolved and
referenced where applicable. Optional development inputs do not add their
resolved files to production exclusions.

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
[toEntry][1] for patterns, [toEntryPath][2] for individual paths, or
[toModule][5] when the specifier resolves to a local file.

Example:

```ts
toEntry('./entry.ts', { production: true, allowIncludeExports: true });
toEntryPath('./src/[variant]/entry.ts', {
  production: true,
  allowIncludeExports: true,
});
```

[1]: #toentry
[2]: #toentrypath
[3]: #toproject
[4]: #todependency
[5]: #tomodule
[6]: #toconfig
[7]: #tobinary
[8]: #toalias
[9]: #options
[10]: ../features/production-mode.md
