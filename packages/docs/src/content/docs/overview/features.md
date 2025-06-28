---
title: Features
---

Overview of capabilities in support of the core feature: find many [types of
issues][1].

Also see [related tooling][2].

## Overview

| Name                  | Description or example                                                |
| :-------------------- | :-------------------------------------------------------------------- |
| [Auto-fix][3]         | Use `--fix` to auto-fix issues                                        |
| [Cache][4]            | Use `--cache` to speed up consecutive runs                            |
| [CommonJS][5]         | Traditional JavaScript is just fine                                   |
| [Compilers][6]        | Support for Astro, MDX, Svelte, Vue and custom compilers              |
| [Debug][7]            | Use `--debug` for troubleshooting                                     |
| [Filters][8]          | Exclude or focus on specific issue types                              |
| [Format][9]           | Add `--format` to `--fix` and auto-format modified files              |
| [JSDoc tags][10]      | Exclude specific exports from the report                              |
| [Memory usage][11]    | Use `--memory` for detailed memory usage insights                     |
| [Monorepos][12]       | Workspaces are first-class citizen                                    |
| [Performance][13]     | Use `--performance` for detailed timing insights                      |
| [Plugins][14]         | Over 100 plugins with custom entry paths and config parsing           |
| [Preprocessors][15]   | Preprocess issues before being reported                               |
| [Production mode][16] | Use `--production` to lint only production code                       |
| [Reporters][17]       | Choose from many built-in reporters or use your own                   |
| [Rules][18]           | Exclude or focus on specific issue types                              |
| [Script parser][19]   | Shell scripts and `package.json` contain entry paths and dependencies |
| [Trace][20]           | Trace exports to find where they are used                             |
| [Watch mode][21]      | Use `--watch` for live updates of unused files and exports            |
| [Workspace][22]       | Use `--workspace` to lint a single workspace in a monorepo            |

[1]: ../reference/issue-types.md
[2]: ../reference/related.md
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
[15]: ../features/reporters.md#preprocessors
[16]: ../features/production-mode.md
[17]: ../features/reporters.md
[18]: ../features/rules-and-filters.md#rules
[19]: ../features/script-parser.md
[20]: ../guides/troubleshooting.md#trace
[21]: ../reference/cli.md#--watch
[22]: ../features/monorepos-and-workspaces#lint-a-single-workspace
