---
title: Features
---

Overview of capabilities in support of the core feature: find many [types of
issues][1].

There are also [things Knip does **not** do][2].

## Overview

| Name                                       | Description or example                                     |
| :----------------------------------------- | :--------------------------------------------------------- |
| [Auto-fix][3]                              | Use `--fix` to auto-fix issues                             |
| [Cache][4]                                 | Use `--cache` to speed up consecutive runs                 |
| [CommonJS][5]                              | Traditional JavaScript is just fine                        |
| [Compilers][6] (built-in/custom)           | Support for Astro, MDX, Vue, etc.                          |
| [Debug][7]                                 | Use `--debug` for troubleshooting                          |
| [Filters][8]                               | Exclude or focus on specific issue types                   |
| [JSDoc tags][9]                            | Make exceptions for exports                                |
| [Monorepos][10] (package-based/integrated) | Workspaces are first-class citizen                         |
| [Performance][11]                          | Use `--performance` for detailed timing insights           |
| [Plugins][12]                              | Over 60 plugins with custom entry paths and config parsing |
| [Preprocessors][13]                        | Preprocess issues before being reported                    |
| [Production mode][14]                      | Use `--production` to lint only production code            |
| [Reporters][15] (built-in/custom)          | Use a custom `--reporter ./custom-output.ts`               |
| [Rules][16]                                | Exclude or focus on issue types                            |
| [Script parser][17]                        | Scripts contain dependencies and entry paths               |
| [Trace][18]                                | Trace exports to find where they are used                  |
| [Watch mode][19]                           | Use `--watch` to update the reporter on file changes       |
| [Workspace][20]                            | Use `--workspace` to lint a single workspace in a monorepo |

[1]: ../reference/issue-types.md
[2]: ../reference/unsupported.md
[3]: ../features/auto-fix.mdx
[4]: ../reference/cli.md#--cache
[5]: ../guides/working-with-commonjs.md
[6]: ../features/compilers.md
[7]: ../guides/troubleshooting.md#issues-reported-by-knip
[8]: ../features/rules-and-filters.md#filters
[9]: ../reference/jsdoc-tsdoc-tags.md
[10]: ../features/monorepos-and-workspaces.md
[11]: ../reference/cli.md#--performance
[12]: ../explanations/plugins.md
[13]: ../features/reporters.md#preprocessors
[14]: ../features/production-mode.md
[15]: ../features/reporters.md
[16]: ../features/rules-and-filters.md#rules
[17]: ../features/script-parser.md
[18]: ../guides/troubleshooting.md#trace
[19]: ../reference/cli.md#--watch
[20]: ../features/monorepos-and-workspaces#lint-a-single-workspace
