---
title: Features
description: Table of Knip capabilities including auto-fix, cache, compilers, monorepos, plugins, reporters, production mode, trace and watch mode.
---

Overview of capabilities in support of the core feature: find many [types of
issues][1].

Also see [related tooling][2].

## Overview

| Name                         | Description or example                                                |
| :--------------------------- | :-------------------------------------------------------------------- |
| [Auto-fix][3]                | Use `--fix` to auto-fix issues                                        |
| [Cache][4]                   | Use `--cache` to speed up consecutive runs                            |
| [Catalog][5]                 | Report & fix unused catalog entries                                   |
| [CommonJS][6]                | CommonJS is still widely used & supported, but conditions apply       |
| [Compilers][7]               | Support for Astro, MDX, Svelte, Vue and custom compilers              |
| Configuration hints          | Display configuration hints to keep `knip.json` tidy                  |
| [Debug][8]                   | Use `--debug` for troubleshooting                                     |
| [Filters][9]                 | Exclude or focus on specific issue types                              |
| [Format][10]                 | Use `--format` with `--fix` to auto-format modified files             |
| [JSDoc tags][11]             | Tag and exclude specific exports from the report                      |
| [Memory usage][12]           | Use `--memory` for detailed memory usage insights                     |
| [Monorepos][13]              | Workspaces are first-class citizen                                    |
| [Performance][14]            | Use `--performance` for detailed timing insights                      |
| [Plugins][15]                | Over 100 plugins with custom entry paths and config parsing           |
| [Plugins: inputs][16]        | Inputs are an affective mechanism to add entries, dependencies & more |
| [Plugins: CLI arguments][17] | Tool-specific CLI argument parsing make plugins go the extra mile     |
| [Preprocessors][18]          | Preprocess issues before being reported                               |
| [Production mode][19]        | Use `--production` to lint only production code                       |
| [Reporters][20]              | Choose from many built-in reporters or use your own                   |
| [Rules][21]                  | Exclude or focus on specific issue types                              |
| [Script parser][22]          | Shell scripts and `package.json` contain entry paths and dependencies |
| [Source mapping][23]         | Map `dist` files back to `src` files                                  |
| [Strict mode][24]            | Use `--strict` to tighten and lint only production `dependencies`     |
| [Trace][25]                  | Trace exports to find where they are used                             |
| [Watch mode][26]             | Use `--watch` for live updates of unused files and exports            |
| [Workspace][27]              | Use `--workspace` to filter workspaces in a monorepo                  |

[1]: ../reference/issue-types.md
[2]: ../reference/related-tooling.md
[3]: ../features/auto-fix.mdx
[4]: ../reference/cli.md#--cache
[5]: ../features/catalogs.md
[6]: ../guides/working-with-commonjs.md
[7]: ../features/compilers.md
[8]: ../guides/troubleshooting.md#debug
[9]: ../features/rules-and-filters.md#filters
[10]: ../features/auto-fix.mdx#format
[11]: ../reference/jsdoc-tsdoc-tags.md
[12]: ../reference/cli.md#--memory
[13]: ../features/monorepos-and-workspaces.md
[14]: ../reference/cli.md#--performance
[15]: ../explanations/plugins.md
[16]: ../writing-a-plugin/inputs.md
[17]: ../writing-a-plugin/argument-parsing.md
[18]: ../features/reporters.md#preprocessors
[19]: ../features/production-mode.md
[20]: ../features/reporters.md
[21]: ../features/rules-and-filters.md#rules
[22]: ../features/script-parser.md
[23]: ../features/source-mapping.md
[24]: ../features/production-mode.md#strict-mode
[25]: ../guides/troubleshooting.md#trace
[26]: ../reference/cli.md#--watch
[27]: ../features/monorepos-and-workspaces.md#filter-workspaces
