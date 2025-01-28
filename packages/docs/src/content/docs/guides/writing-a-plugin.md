---
title: Writing A Plugin
---

Plugins provide Knip with entry files and dependencies it would be unable to
find otherwise. Plugins always do at least one of the following:

1. Define entry file patterns
2. Find dependencies in configuration files

Knip v5.1.0 introduces a new plugin API, which makes them a breeze to write and
maintain.

:::tip[The new plugin API]

Easy things should be easy, and complex things possible.

:::

This tutorial walks through example plugins so you'll be ready to write your
own!

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

The title of the plugin displayed in the [list of plugins][1] and in debug
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

This plugin exports `entry` file patterns.

In summary: if `tailwind` is listed as a dependency then `tailwind.config.*`
files are added as entry files.

With many tools, the dynamic configuration file import dependencies such as
plugins or reporters with regular `require` or `import` statements. In this
case, we have no extra work in the Knip plugin, as they'll be treated as regular
entry files. All internal and external dependencies of the `tailwind.config.ts`
entry file will be marked as used.

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
tool. Knip loads matching files and passes the results (i.e. what resolves as
the default export) into the `resolveConfig` function:

### 6. `resolveConfig`

This function receives the exported value of the `config` files, and executes
the `resolveConfig` function with this object. The plugin should return the
dependencies referenced in this object.

Knip supports JSON, YAML, TOML, JavaScript and TypeScript config files. Files
without an extension are provided as plain text strings.

:::tip[Should I implement resolveConfig?]

You should implement `resolveConfig` if any of these are true:

- The tool supports a `config` file in JSON or YAML format
- The `config` file references dependencies by strings (not import statements)

:::

## Example 3: custom entry paths

Some tools operate mostly on entry files, some examples:

- Mocha looks for test files at `test/*.{js,cjs,mjs}`
- Storybook looks for stories at `*.stories.@(mdx|js|jsx|tsx)`

And some of those tools allow to configure those locations and patterns. If
that's the case, than we can define `resolveEntryPaths` in our plugin to take
this from the configuration object and return it to Knip:

### 7. resolveEntryPaths

Here's an example from the Preconstruct plugin:

```ts
const resolveEntryPaths: ResolveConfig<PreconstructConfig> = async config => {
  return (config.entrypoints ?? []).map(toEntry);
};
```

With Preconstruct, you can configure `entrypoints`. If this function is
implemented in a plugin, Knip will use its return value over the default `entry`
patterns. The result is that you don't need to duplicate this customization in
both the tool (e.g. Preconstruct) and Knip.

:::tip[Should I implement resolveEntryPaths?]

Plugins should have `resolveEntryPaths` implemented if the configuration file
contains one or more options that represent [entry points][2].

:::

## Inputs

You may have noticed the `toDeferResolve` and `toEntry` functions. They're a way
for plugins to tell what they've found and how to handle it. The more precise a
plugin can be, the better it is for results and performance. Here's a list of
all input type functions:

### toEntry

An `entry` input is just like an `entry` in the configuration. It should either
be an absolute or relative path, and glob patterns are allowed.

### toProductionEntry

A production `entry` input is just like an `production` in the configuration. It
should either be an absolute or relative path, and it can have glob patterns.

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

When creating inputs from specifiers, extra `options` can be provided.

#### dir

The optional `dir` argument assigns the input to a different workspace. For
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

## Argument parsing

As part of the [script parser][3], Knip parses command-line arguments. Plugins
can implement the `arg` object to add custom argument parsing tailored to the
executables of the tool.

For now, there are two resources available to learn more:

- [The documented `Args` type in source code][4]
- [Implemented `args` in existing plugins][5]

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
individual plugin pages][1] from the exported plugin values.

Thanks for reading. If you have been following this guide to create a new
plugin, this might be the right time to open a pull request! Feel free to join
[the Knip Discord channel][6] if you have any questions.

[1]: ../reference/plugins.md
[2]: ../explanations/plugins.md#entry-files-from-config-files
[3]: ../features/script-parser.md
[4]: https://github.com/webpro-nl/knip/blob/main/packages/knip/src/types/args.ts
[5]:
  https://github.com/search?q=repo%3Awebpro-nl%2Fknip++path%3Apackages%2Fknip%2Fsrc%2Fplugins+%22const+args+%3D%22&type=code
[6]: https://discord.gg/r5uXTtbTpc
