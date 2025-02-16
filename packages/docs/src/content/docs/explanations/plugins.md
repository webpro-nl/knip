---
title: Plugins
sidebar:
  order: 2
---

This page describes why Knip uses plugins and the difference between `config`
and `entry` files.

Knip has an extensive and growing [list of built-in plugins][1]. Feel free to
[write a plugin][2] so others can benefit too!

## What does a plugin do?

Plugins are enabled if the related package is listed in the list of dependencies
in `package.json`. For instance, if `astro` is listed in `dependencies` or
`devDependencies`, then the Astro plugin is enabled. And this means that this
plugin will:

- Handle [configuration files][3] like `astro.config.mjs`
- Add [entry files][4] such as `src/pages/**/*.astro`
- Define [command-line arguments][5]

## Configuration files

Knip uses [entry files][6] as starting points to scan your source code and
resolve other internal files and external dependencies. The module graph can be
statically resolved through the `require` and `import` statements in those
source files. However, configuration files reference external dependencies in
various ways. Knip uses a plugin for each tool to parse configuration files and
find those dependencies.

### Example: ESLint

In the first example we look at [the ESLint plugin][7]. The default `config`
file patterns include `.eslintrc.json`. Here's a minimal example:

```json title=".eslintrc.json"
{
  "extends": ["airbnb", "prettier"],
  "plugins": ["@typescript-eslint"]
}
```

Configuration files like this don't `import` or `require` anything, but they do
require the referenced dependencies to be installed.

In this case, the plugin will return three dependencies:

- `eslint-config-airbnb`
- `eslint-config-prettier`
- `@typescript-eslint/eslint-plugin`

Knip will then look for missing dependencies in `package.json` and report those
as unlisted. And vice versa, if there are any ESLint plugins listed in
`package.json`, but unused, those will be reported as well.

### Example: Vitest

The second example uses [the Vitest plugin][7]. Here's a minimal example of a
Vitest configuration file:

```ts title="vitest.config.ts"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
    },
    environment: 'happy-dom',
  },
});
```

The Vitest plugin reads this configuration and return two dependencies:

- `@vitest/coverage-istanbul`
- `vitest-environment-happy-dom`

Knip will look for missing and unused dependencies in `package.json` and report
accordingly.

Some tools allow configuration to be stored in `package.json`, that's why some
plugins contain `package.json` in the list of `config` files.

:::tip[Summary]

Plugins parse `config` files to find external dependencies. Knip uses this to
determine unused and unlisted dependencies.

:::

## Entry files

Many plugins have default `entry` files configured. When the plugin is enabled,
Knip will add entry files as configured by the plugin to resolve used files and
dependencies.

For example, if `next` is listed as a dependency in `package.json`, the Next.js
plugin will automatically add multiple patterns as entry files, such as
`pages/**/*.{js,jsx,ts,tsx}`. If `vitest` is listed, the Vitest plugin adds
`**/*.{test,test-d,spec}.ts` as entry file patterns. Most plugins have entry
files configured, so you don't have to.

It's mostly plugins for meta frameworks and test runners that have `entry` files
configured.

:::tip[Plugins result in less configuration]

Plugins uses entry file patterns as defined in the configuration files of these
tools. So you don't need to repeat this in your Knip configuration.

:::

For example, let's say your Playwright configuration contains the following:

```ts title="playwright.config.ts"
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'integration',
  testMatch: ['**/*-test.ts'],
};

export default config;
```

The Playwright plugin will read this configuration file and return those entry
patterns (`integration/**/*-test.ts`). Knip will then not use the default entry
patterns.

You can still override this behavior in your Knip configuration:

```json title="knip.json"
{
  "playwright": {
    "entry": "src/**/*.integration.ts"
  }
}
```

This should not be necessary though. Please consider opening a pull request or a
bug report if any plugin is not behaving as expected.

:::tip[Summary]

Plugins try hard to automatically add the correct entry files.

:::

## Entry files from config files

Entry files are part of plugin configuration (as described in the previous
section). Yet plugins can also return additional entry files after parsing
configuration files. Below are some examples of configuration files parsed by
plugins to return additional entry files. The goal of these examples is to give
you an idea about the various ways Knip and its plugins try to find entry files
so you don't need to configure them yourself.

### Angular

The Angular plugin parses the Angular configuration file. Here's a fragment:

```json title="angular.json"
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "projects": {
    "knip-angular-example": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/knip-angular-example",
            "main": "src/main.ts",
            "tsConfig": "tsconfig.app.json"
          }
        }
      }
    }
  }
}
```

This will result in `src/main.ts` being added as an entry file (and
`@angular-devkit/build-angular` as a referenced dependency).

Additionally, the Angular plugin returns `tsconfig.app.json` as a configuration
file for the TypeScript plugin.

### GitHub Actions

This plugin parses workflow YAML files. This fragment contains three `run`
scripts:

```yml title=".github/workflows/deploy.yml"
jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - run: npm install
      - run: node scripts/build.js
      - run: node --loader tsx scripts/deploy.ts
      - run: playwright test -c playwright.web.config.ts
        working-dir: e2e
```

From these scripts, the `scripts/build.js` and `scripts/deploy.ts` files will be
added as entry files by the GitHub Actions plugin.

Additionally, the file `e2e/playwright.web.config.ts` is detected and will be
handed over as a Playwright configuration file.

Read more about this in [command-line arguments][5].

### webpack

Let's take a look at this example webpack configuration file:

```js title="webpack.config.js"
module.exports = env => {
  return {
    entry: {
      main: './src/app.ts',
      vendor: './src/vendor.ts',
    },
    module: {
      rules: [
        {
          test: /\.(woff|ttf|ico|woff2|jpg|jpeg|png|webp)$/i,
          use: 'base64-inline-loader',
        },
      ],
    },
  };
};
```

The webpack plugin will parse this and add `./src/app.ts` and `./src/vendor.ts`
as entry files. It will also add `base64-inline-loader` as a referenced
dependency.

:::tip[Summary]

Plugins can find additional entry files when parsing config files.

:::

## Bringing it all together

Sometimes a configuration file is a JavaScript or TypeScript file that imports
dependencies, but also contains configuration that needs to be parsed by a
plugin to find additional dependencies.

Let's take a look at this example Vite configuration file:

```ts title="vite.config.ts"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async ({ mode, command }) => {
  return {
    plugins: [react()],
    test: {
      setupFiles: ['./setup-tests.ts'],
      environment: 'happy-dom',
      coverage: {
        provider: 'c8',
      },
    },
  };
});
```

This file imports `vite` and `@vitejs/plugin-react` directly, but also
indirectly references the `happy-dom` and `@vitest/coverage-c8` packages.

The Vite plugin of Knip will **dynamically** load this configuration file and
parse the exported configuration. But it's not aware of the `vite` and
`@vitejs/plugin-react` imports. This is why such `config` files are also
automatically added as `entry` files for Knip to **statically** resolve the
`import` and `require` statements.

Additionally, `./setup-tests.ts` will be added as an `entry` file.

## Command-Line Arguments

Plugins may define the arguments where Knip should look for entry files,
configuration files and dependencies. We've already seen some examples above:

```sh
node --loader tsx scripts/deploy.ts
playwright test -c playwright.web.config.ts
```

Please see [script parser][8] for more details.

## Summary

:::tip[Summary]

Plugins are configured with two distinct types of files:

- `config` files are dynamically loaded and parsed by the plugin
- `entry` files are added to the module graph
- Both can recursively lead to additional entry files, config files and
  dependencies

:::

[1]: ../reference/plugins.md
[2]: ../guides/writing-a-plugin.md
[3]: #configuration-files
[4]: #entry-files
[5]: #command-line-arguments
[6]: ./entry-files.md
[7]: ../reference/plugins/eslint.md
[8]: ../features/script-parser.md
