---
title: Writing A Plugin
---

Plugins provide Knip with entry files and dependencies it would be unable to
find otherwise. Plugins always do at least one of the following:

1. Define entry file patterns
2. Find dependencies in configuration files

Knip v5.1.0 introduced a new plugin API, which makes them a breeze to write and
maintain.

:::tip[The new plugin API]

Easy things should be easy, and complex things possible.

:::

This tutorial walks through example plugins so you'll be ready to write your
own! The following examples demonstrate the elements a plugin can implement.

There's a handy command available to easily [create a new plugin][1] and get
started right away.

## Example 1: entry

Let's dive right in. Here's the entire source code of the Tailwind plugin:

```ts
import type { IsPluginEnabled, Plugin } from '../../types/config.js';
import { hasDependency } from '../../util/plugin.js';

const title = 'Tailwind';

const enablers = ['tailwindcss'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const entry = ['tailwind.config.{js,cjs,mjs,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
} satisfies Plugin;
```

Yes, that's the entire plugin! Let's go over each item one by one:

### 1. `title`

The title of the plugin displayed in the [list of plugins][2] and in debug
output.

### 2. `enablers`

An array of strings to match one or more dependencies in `package.json` so the
`isEnabled` function can determine whether the plugin should be enabled or not.
Regular expressions are allowed as well.

### 3. `isEnabled`

This function checks whether a match is found in the `dependencies` or
`devDependencies` in `package.json`. The plugin is be enabled if the dependency
is listed in `package.json`.

This function can be kept straightforward with the `hasDependency` helper.

### 4. `entry`

This plugin exports `entry` file patterns. This means that if the Tailwind
plugin is enabled, then `tailwind.config.*` files are added as entry files. A
Tailwind configuration file does not contain anything particular, so adding it
as an `entry` to treat it as a regular source file is enough.

The next example shows how to handle a tool that has its own particular
configuration object.

## Example 2: config

Here's the full source code of the `nyc` plugin:

```ts
import { toDeferResolve } from '../../util/input.js';
import { hasDependency } from '../../util/plugin.js';
import type { NycConfig } from './types.js';
import type {
  IsPluginEnabled,
  Plugin,
  ResolveConfig,
} from '../../types/config.js';

const title = 'nyc';

const enablers = ['nyc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config = [
  '.nycrc',
  '.nycrc.{json,yml,yaml}',
  'nyc.config.js',
  'package.json',
];

const resolveConfig: ResolveConfig<NycConfig> = config => {
  const extend = config?.extends ?? [];
  const requires = config?.require ?? [];
  return [extend, requires].flat().map(toDeferResolve);
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
} satisfies Plugin;
```

Here's an example `config` file that will be handled by this plugin:

```json title=".nycrc.json"
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "check-coverage": true
}
```

Compared to the first example, this plugin has two new variables:

### 5. `config`

The `config` array contains all possible locations of the config file for the
tool. Knip loads matching files and passes the results (i.e. its default export)
into the `resolveConfig` function:

### 6. `resolveConfig`

This function receives the exported value of the `config` file, and executes the
`resolveConfig` function with this object. The plugin should return the entry
paths and dependencies referenced in this object.

Knip supports JSON, YAML, TOML, JavaScript and TypeScript config files. Files
without an extension are provided as plain text strings.

:::tip[Should I implement resolveConfig?]

You should implement `resolveConfig` if any of these are true:

- The `config` file contains one or more options that represent [entry
  points][3]
- The `config` file references dependencies by strings (not import statements)

:::

## Example 3: entry paths

### 7. entry and production

Some tools operate mostly on entry files, some examples:

- Mocha looks for test files at `test/*.{js,cjs,mjs}`
- Storybook looks for stories at `*.stories.@(mdx|js|jsx|tsx)`

And some of those tools allow to configure those locations and patterns in
configuration files, such as `next.config.js` or `vite.config.ts`. If that's the
case we can define `resolveConfig` in our plugin to take this from the
configuration object and return it to Knip:

Here's an example from the Mocha plugin:

```ts
const entry = ['**/test/*.{js,cjs,mjs}'];

const resolveConfig: ResolveConfig<MochaConfig> = localConfig => {
  const entryPatterns = localConfig.spec ? [localConfig.spec].flat() : entry;
  return entryPatterns.map(id => toEntry(id));
};

export default {
  entry,
  resolveConfig,
};
```

With Mocha, you can configure `spec` file patterns. The result of implementing
`resolveConfig` is that users don't need to duplicate this configuration in both
the tool (e.g. Mocha) and Knip.

Use `production` entries to target source files that represent production code.

:::tip

Regardless of the presence of `resolveConfig`, add `entry` and `production` to
the default export so they will be displayed in the plugin's documentation as
default values.

:::

## Example 4: Use the AST directly

If the `resolveFromConfig` function is impemented, Knip loads the configuration
file and passes the default-exported object to this plugin function. However,
that object might then not contain the information we need.

Here's an example `astro.config.ts` configuration file with a Starlight
integration:

```ts
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    starlight({
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
    }),
  ],
});
```

With Starlight, components can be defined to override the default internal ones.
They're not otherwise referenced in your source code, so you'd have to manually
add them as entry files ([Knip itself did this][4]).

In the Astro plugin, there's no way to access this object containing
`components` to add the component files as entry files if we were to try:

```ts
const resolveConfig: ResolveConfig<AstroConfig> = async config => {
  console.log(config); //  ¯\_(ツ)_/¯
};
```

This is why plugins can implement the `resolveFromAST` function.

### 7. resolveFromAST

Let's take a look at the Astro plugin implementation. This example assumes some
familiarity with Abstract Syntax Trees (AST) and the TypeScript compiler API.
Knip will provide more and more AST helpers to make implementing plugins more
fun and a little less tedious.

Anyway, let's dive in. Here's how we're adding the Starlight `components` paths
to the default `production` file patterns:

```ts
import ts from 'typescript';
import {
  getDefaultImportName,
  getImportMap,
  getPropertyValues,
} from '../../typescript/ast-helpers.js';

const title = 'Astro';

const production = [
  'src/pages/**/*.{astro,mdx,js,ts}',
  'src/content/**/*.mdx',
  'src/middleware.{js,ts}',
  'src/actions/index.{js,ts}',
];

const getComponentPathsFromSourceFile = (sourceFile: ts.SourceFile) => {
  const componentPaths: Set<string> = new Set();
  const importMap = getImportMap(sourceFile);
  const importName = getDefaultImportName(importMap, '@astrojs/starlight');

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === importName // match the starlight() function call
    ) {
      const starlightConfig = node.arguments[0];
      if (ts.isObjectLiteralExpression(starlightConfig)) {
        const values = getPropertyValues(starlightConfig, 'components');
        for (const value of values) componentPaths.add(value);
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return componentPaths;
};

const resolveFromAST: ResolveFromAST = (sourceFile: ts.SourceFile) => {
  // Include './src/components/Head.astro' and './src/components/Footer.astro'
  // as production entry files so they're also part of the analysis
  const componentPaths = getComponentPathsFromSourceFile(sourceFile);
  return [...production, ...componentPaths].map(id => toProductionEntry(id));
};

export default {
  title,
  production,
  resolveFromAST,
} satisfies Plugin;
```

## Inputs

You may have noticed functions like `toDeferResolve` and `toEntry`. They're a
way for plugins to tell what they've found and how Knip should handle those. The
more precise a plugin can be, the better it is for results and performance.
Here's an overview of all input type functions:

### toEntry

An `entry` input is just like an `entry` in the configuration. It should either
be an absolute or relative path, and glob patterns are allowed.

### toProductionEntry

A production `entry` input is just like an `production` in the configuration. It
should either be an absolute or relative path, and it can have glob patterns.

### toProject

A `project` input is the equivalent of `project` patterns in the configuration.
It should either be an absolute or relative path, and (negated) glob patterns
are allowed.

### toDependency

The `dependency` indicates the entry is a dependency, belonging in either the
`"dependencies"` or `"devDependencies"` section of `package.json`.

### toProductionDependency

The production `dependency` indicates the entry is a production dependency,
expected to be listed in `"dependencies"`.

### toDeferResolve

The `deferResolve` input type is used to defer the resolution of a specifier.
This could be resolved to a dependency or an entry file. For instance, the
specifier `"input"` could be resolved to `"input.js"`, `"input.tsx"`,
`"input/index.js"` or the `"input"` package name. Local files are added as entry
files, package names are external dependencies.

If this does not lead to a resolution, the specifier will be reported under
"unresolved imports".

### toDeferResolveEntry

The `deferResolveEntry` input type is similar to `deferResolve`, but it's used
for entry files only (not dependencies) and unresolved inputs are ignored. It's
different from `toEntry` as glob patterns are not supported.

### toConfig

The `config` input type is a way for plugins to reference a configuration file
that should be handled by a different plugin. For instance, Angular
configurations might contain references to `tsConfig` and `karmaConfig` files,
so these `config` files can then be handled by the TypeScript and Karma plugins,
respectively.

Requires the `pluginName` option.

### toBinary

The `binary` input type isn't used by plugins directly, but by the shell script
parser (through the `getInputsFromScripts` helper). Think of GitHub Actions
worfklow YAML files or husky scripts. Using this input type, a binary is
"assigned" to the dependency that has it as a `"bin"` in their `package.json`.

### Options

When creating inputs from specifiers, an extra `options` object as the second
argument can be provided.

#### dir

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

#### allowIncludeExports

By default, exports of entry files such as `src/index.ts` or the files in
`package.json#exports` are not reported as unused. When using the
`--include-entry-exports` flag or `isIncludeExports: true` option, unused
exports on such entry files are also reported.

Exports of entry files coming from plugins are not included in the analysis,
even with the option enabled. This is because certain tools and frameworks
consume named exports from entry files, causing false positives.

The `allowIncludeExports` option allows the exports of entry files to be
reported as unused when using `--include-entry-exports`. This option is
typically used with the [toProductionEntry][5] input type. Example:

```ts
toProductionEntry('./entry.ts', { allowIncludeExports: true });
```

## Argument parsing

As part of the [script parser][6], Knip parses command-line arguments. Plugins
can implement the `arg` object to add custom argument parsing tailored to the
executables of the tool.

For now, there are two resources available to learn more:

- [The documented `Args` type in source code][7]
- [Implemented `args` in existing plugins][8]

## Create a new plugin

The easiest way to create a new plugin is to use the `create-plugin` script:

```sh
cd packages/knip
bun create-plugin --name tool
```

This adds source and test files and fixtures to get you started. It also adds
the plugin to the JSON Schema and TypeScript types.

Run the test for your new plugin:

```sh
bun test test/plugins/tool.test.ts
```

You're ready to implement and submit a new Knip plugin! 🆕 🎉

## Wrapping Up

Feel free to check out the implementation of other similar plugins, and borrow
ideas and code from those!

The documentation website takes care of generating the [plugin list and the
individual plugin pages][2] from the exported plugin values.

Thanks for reading. If you have been following this guide to create a new
plugin, this might be the right time to open a pull request! Feel free to join
[the Knip Discord channel][9] if you have any questions.

[1]: #create-a-new-plugin
[2]: ../reference/plugins.md
[3]: ../explanations/plugins.md#entry-files-from-config-files
[4]:
  https://github.com/webpro-nl/knip/blob/6a6954386b33ee8a2919005230a4bc094e11bc03/knip.json#L12
[5]: #toproductionentry
[6]: ../features/script-parser.md
[7]: https://github.com/webpro-nl/knip/blob/main/packages/knip/src/types/args.ts
[8]:
  https://github.com/search?q=repo%3Awebpro-nl%2Fknip++path%3Apackages%2Fknip%2Fsrc%2Fplugins+%22const+args+%3D%22&type=code
[9]: https://discord.gg/r5uXTtbTpc
