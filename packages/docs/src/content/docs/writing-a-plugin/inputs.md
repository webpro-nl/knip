---
title: Inputs
sidebar:
  order: 2
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
`"dependencies"` or `"devDependencies"` section of `package.json`.

## toProductionDependency

The production `dependency` indicates the entry is a production dependency,
expected to be listed in `"dependencies"`.

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

## toConfig

The `config` input type is a way for plugins to reference a configuration file
that should be handled by a different plugin. For instance, Angular
configurations might contain references to `tsConfig` and `karmaConfig` files,
so these `config` files can then be handled by the TypeScript and Karma plugins,
respectively.

Example:

```ts
toConfig('typescript', './path/to/tsconfig.json');
```

For instance, the Angular plugin uses this to tell Knip about its `tsConfig`
value in `angular.json` projects.

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

The optional `dir` option assigns the input to a different workspace. For
instance, GitHub Action workflows are always stored in the root workspace, and
support `working-directory` in job steps. For example:

```yaml
jobs:
  stylelint:
    runs-on: ubuntu-latest
    steps:
      - run: npx esbuild
        working-directory: packages/app
```

The GitHub Action plugin understands `working-directory` and adds this `dir` to
the input:

```ts
toDependency('esbuild', { dir: 'packages/app' });
```

Knip now understands `esbuild` is a dependency of the workspace in the
`packages/app` directory.

### optional

Use the `optional` flag to indicate the dependency is optional. Then, a
dependency won't be flagged as unlisted if it isn't.

### allowIncludeExports

By default, exports of entry files such as `src/index.ts` or the files in
`package.json#exports` are not reported as unused. When using the
`--include-entry-exports` flag or `isIncludeExports: true` option, unused
exports on such entry files are also reported.

Exports of entry files coming from plugins are not included in the analysis,
even with the option enabled. This is because certain tools and frameworks
consume named exports from entry files, causing false positives.

The `allowIncludeExports` option allows the exports of entry files to be
reported as unused when using `--include-entry-exports`. This option is
typically used with the [toProductionEntry][2] input type.

Example:

```ts
toProductionEntry('./entry.ts', { allowIncludeExports: true });
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
