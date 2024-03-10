---
title: Writing A Plugin
---

## Introduction

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

Let's dive right in. Here's the entire source code of the Rollup plugin:

```ts
import { hasDependency } from '~/util/plugin.js';
import type { IsPluginEnabled } from '~/types/plugins.js';

const title = 'Rollup';

const enablers = ['rollup'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const entry = ['rollup.config.{js,cjs,mjs,ts}'];

export default {
  title,
  enablers,
  isEnabled,
  entry,
};
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

In summary: if `rollup` is listed as a dependency then `rollup.config.*` files
are added as entry files.

With many tools, the dynamic configuration file import dependencies such as
plugins or reporters with regular `require` or `import` statements. In this
case, we have no extra work in the Knip plugin, as they'll be treated as regular
entry files. All internal and external dependencies of the `rollup.config.ts`
entry file will be marked as used.

The next example shows how to handle a tool that has its own particular
configuration object.

## Example 2: config

Here's the full source code of the `nyc` plugin:

```ts
import { hasDependency } from '~/util/plugin.js';
import type { NycConfig } from './types.js';
import type { ResolveConfig, IsPluginEnabled } from '~/types/plugins.js';

const title = 'nyc';

const enablers = ['nyc'];

const isEnabled: IsPluginEnabled = ({ dependencies }) =>
  hasDependency(dependencies, enablers);

const config = ['.nycrc', '.nycrc.json', '.nycrc.{yml,yaml}', 'nyc.config.js'];

const resolveConfig: ResolveConfig<NycConfig> = config => {
  return config?.extends ? [config.extends].flat() : [];
};

export default {
  title,
  enablers,
  isEnabled,
  config,
  resolveConfig,
};
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
tool. Knip loads matching files and passes the result into the `resolveConfig`
function:

### 6. `resolveConfig`

This function receives the exported value of the `config` files, and executes
the `resolveConfig` function with this object. The plugin should return the
dependencies referenced in this object.

Knip supports JSON, YAML, TOML, JavaScript and TypeScript config files.

### Custom entry paths

Some tools operate mostly on entry files, some examples:

- Mocha looks for test files at `test/*.{js,cjs,mjs}`
- Storybook looks for stories at `*.stories.@(mdx|js|jsx|tsx)`

And some of those tools allow to configure those locations and patterns. If
that's the case, than we can define `resolveEntryPaths` in our plugin to take
this from the configuration object and return it to Knip:

### 7. resolveEntryPaths

Here's an example from the Ava test runner plugin:

```ts
const resolveEntryPaths: ResolveEntryPaths<AvaConfig> = localConfig => {
  if (typeof localConfig === 'function') localConfig = localConfig();
  return localConfig?.files ?? [];
};
```

With Ava, you can configure `files` to override the default glob patterns to use
custom locations for test files. If this function is implemented in a plugin,
Knip will use its return value over the default `entry` patterns. The result is
that users don't need to duplicate this customization in both Ava and Knip.

## Example 3

Most plugins can be kept relatively simple like the examples above, but
sometimes more customization is required. This is where the `resolveFromPath`
function comes in.

### 7. `resolveFromPath`

Compared to the `resolveConfig` function, this function receives the path to the
configuration file instead of the `config` object:

```ts title="src/plugins/tool/index.ts"
import { load } from '~/util/plugin.js';

const resolveFromPath: GenericPluginCallback = async (
  configFilePath,
  options
) => {
  // 1. Load the configuration
  const config = await load(configFilePath);

  // 2. Grab the dependencies from the object
  const addons = config?.addons ?? [];
  const plugins = config?.plugins ?? [];

  // 3. Return the results
  return [...addons, ...plugins];
};

export default {
  resolveFromPath,
};
```

## When to use what?

You might be wondering which functions you should be using for your plugin. Each
plugin falls in one of three categories:

| Category | File patterns | Method            | Example |
| :------: | :------------ | :---------------- | :-----: |
|    1     | `entry`       | none              |    1    |
|    2     | `config`      | `resolveConfig`   |    2    |
|    3     | `config`      | `resolveFromPath` |    3    |

The majority of plugins are straightforward and fit in category 1 or 2:

:::tip[Rule of thumb]

- Does the tool support a `config` file in JSON or YAML format? Category 2.
- Does the `config` file reference dependencies as strings? Category 2.

:::

That covers the majority of plugins (85%). During development, for the remaining
plugins in category 3 it's mostly a matter of moving the logic into a single
`resolveFromPath` function when necessary.

Example 1 is in category 1, and so on. See [example 2](#example-2-config) that
fits in category 2.

## Create a new plugin

The easiest way to create a new plugin is to use the `create-plugin` script:

```sh
cd packages/knip
npm run create-plugin -- --name tool
```

This adds source and test files and fixtures to get you started. It also adds
the plugin to the JSON Schema and TypeScript types.

Run the test for your new plugin:

```sh
npx tsx test/plugins/tool.test.ts
```

You're ready to implement and submit a new Knip plugin! 🆕 🎉

## Wrapping Up

Feel free to check out the implementation of other similar plugins, and borrow
ideas and code from those!

The documentation website takes care of generating the [plugin list and the
individual plugin pages][1] from the exported plugin values.

Thanks for reading. If you have been following this guide to create a new
plugin, this might be the right time to open a pull request! Feel free to join
[the Knip Discord channel][8] if you have any questions.

[1]: ../reference/plugins.md
[2]: https://github.com/webpro/knip/blob/v3/packages/knip/src/types/plugins.ts
[3]: ../explanations/plugins.md
[4]: #entry
[5]: ../explanations/plugins.md#bringing-it-all-together
[6]: ../features/production-mode.md
[7]: ../overview/configuration.md#defaults
[8]: https://discord.gg/r5uXTtbTpc
