---
title: Features
---

Overview of capabilities in support of the core feature: find many [types of
issues][1].

Also see [related tooling][2].

## Overview

| Name                         | Description or example                                                |
| :--------------------------- | :-------------------------------------------------------------------- |
| [Auto-fix][3]                | Use `--fix` to auto-fix issues                                        |
| [Cache][4]                   | Use `--cache` to speed up consecutive runs                            |
| Catalog                      | Report & fix unused catalog entries                                   |
| [CommonJS][5]                | CommonJS is still widely used & supported, but conditions apply       |
| [Compilers][6]               | Support for Astro, MDX, Svelte, Vue and custom compilers              |
| Configuration hints          | Display configuration hints to keep `knip.json` tidy                  |
| [Debug][7]                   | Use `--debug` for troubleshooting                                     |
| [Filters][8]                 | Exclude or focus on specific issue types                              |
| [Format][9]                  | Add `--format` to `--fix` and auto-format modified files              |
| [JSDoc tags][10]             | Tag and exclude specific exports from the report                      |
| [Memory usage][11]           | Use `--memory` for detailed memory usage insights                     |
| [Monorepos][12]              | Workspaces are first-class citizen                                    |
| [Performance][13]            | Use `--performance` for detailed timing insights                      |
| [Plugins][14]                | Over 100 plugins with custom entry paths and config parsing           |
| [Plugins: inputs][15]        | Inputs are an affective mechanism to add entries, dependencies & more |
| [Plugins: CLI arguments][16] | Tool-specific CLI argument parsing make plugins go the extra mile     |
| [Preprocessors][17]          | Preprocess issues before being reported                               |
| [Production mode][18]        | Use `--production` to lint only production code                       |
| [Reporters][19]              | Choose from many built-in reporters or use your own                   |
| [Rules][20]                  | Exclude or focus on specific issue types                              |
| [Script parser][21]          | Shell scripts and `package.json` contain entry paths and dependencies |
| [Source mapping][22]         | Map `dist` files back to `src` files                                  |
| [Strict mode][23]            | Use `--strict` to isolate workspaces and consider only `dependencies` |
| [Trace][24]                  | Trace exports to find where they are used                             |
| [Watch mode][25]             | Use `--watch` for live updates of unused files and exports            |
| [Workspace][26]              | Use `--workspace` to lint a single workspace in a monorepo            |

[1]: ../reference/issue-types.md
[2]: ../reference/related-tooling.md
[3]: ../features/auto-fix.mdx
[4]: ../reference/cli.md#--cache
[5]: ../guides/working-with-commonjs.md
[6]: ../features/compilers.md
[7]: ../guides/troubleshooting.md#issues-reported-by-knip
[8]: ../features/rules-and-filters.md#filters
[9]: ../features/auto-fix.mdx#format
[10]: ../reference/jsdoc-tsdoc-tags.md
[11]: ../reference/cli.md#--memory
[12]: ../features/monorepos-and-workspaces.md
[13]: ../reference/cli.md#--performance
[14]: ../explanations/plugins.md
[15]: ../writing-a-plugin/inputs.md
[16]: ../writing-a-plugin/argument-parsing.md
[17]: ../features/reporters.md#preprocessors
[18]: ../features/production-mode.md
[19]: ../features/reporters.md
[20]: ../features/rules-and-filters.md#rules
[21]: ../features/script-parser.md
[22]: ../features/source-mapping.md
[23]: ../features/production-mode.md#strict-mode
[24]: ../guides/troubleshooting.md#trace
[25]: ../reference/cli.md#--watch
[26]: ../features/monorepos-and-workspaces#lint-a-single-workspace
