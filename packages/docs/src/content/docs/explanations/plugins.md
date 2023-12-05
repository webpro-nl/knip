---
title: Plugins
sidebar:
  order: 2
---

## Introduction

This page describes why Knip uses plugins and the difference between `config`
and `entry` files.

## Enabled

Plugins are enabled if the related package is listed in the list of dependencies
in `package.json`. For instance, if `astro` is listed in `dependencies` or
`devDependencies`, then the Astro plugin is enabled.

## Configuration Files

Knip uses [entry files][1] as starting points to scan your source code and
resolve other internal files and external dependencies. The dependency graph can
be statically resolved through the `require` and `import` statements in those
source files. However, configuration files often reference external dependencies
in different ways. Knip uses plugins to parse configuration files to find those
dependencies.

In this example we look at [Knip's ESLint plugin][2]. The default `config` file
patterns include `.eslintrc.json`. Here's a minimal example:

```json title=".eslintrc.json"
{
  "extends": ["airbnb", "prettier"],
  "plugins": ["@typescript-eslint"]
}
```

Configuration files like this don't `import` or `require` anything, but they do
require the referenced dependencies to be installed.

In this case, the plugin will return the `eslint-config-airbnb`,
`eslint-config-prettier` and `@typescript-eslint/eslint-plugin` dependencies, so
Knip knows they should be listed in `package.json`.

Some tools allow configuration to be stored in `package.json`, that's why some
the relevant plugins contain `package.json` in the list of `config` files.

:::tip[Summary]

`config` files are parsed by plugins to find external dependencies. Knip uses
this to determine the unused and unlisted dependencies.

:::

## Entry Files

Many plugins have default `entry` files configured. When the plugin is enabled,
Knip will add entry files as configured by the plugin to resolve used files and
dependencies.

For example, if `next` is listed as a dependency in `package.json`, the Next.js
plugin will automatically add multiple patterns as entry files, such as
`pages/**/*.{js,jsx,ts,tsx}`. If `vitest` is listed, the Vitest plugin adds
`**/*.{test,spec}.ts` as entry file patterns. Most plugins have entry files
configured, so you don't have to.

It's mostly plugins for meta frameworks and test runners that have `entry` files
configured.

:::tip[Plugins result in less configuration]

Plugins even consult the configuration files of these tools, in case alternative
entry files should be used. So you need don't need to repeat this in your Knip
configuration.

:::

For example, if your Playwright configuration contains the following:

```ts title="playwright.config.ts"
import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: 'integration',
  testMatch: ['**/*-test.ts'],
};

export default config;
```

Then the plugin will inform Knip that not its default entry patterns, but
`integration/**/*-test.ts` should be added as entry files.

If that's not correct or in some way doesn't work, you can override this
behavior in your Knip configuration:

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

## Entry Files From Config Files

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
            "main": "src/main.ts"
          }
        }
      }
    }
  }
}
```

This will result in `src/main.ts` being added as an entry file (and
`@angular-devkit/build-angular` as a referenced dependency).

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
```

From these scripts, the `scripts/build.js` and `scripts/deploy.ts` files will be
added as entry files by the GitHub Actions plugin.

You can read more about this in [Script Parser][3].

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

## Bringing It All Together

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

:::tip[Summary]

Plugins are configured with two distinct types of files:

- `config` files are dynamically loaded and parsed by the plugin
- `entry` files are statically analyzed by Knip to create a comprehensive
  dependency graph
- Both can result in additional entry files and dependencies

:::

[1]: ./entry-files.md
[2]: ../reference/plugins/eslint.md
[3]: ../features/script-parser.md
