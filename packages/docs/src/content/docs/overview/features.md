---
title: Features
---

Overview of features supported by Knip (A-Z):

| Name                                      | Description or example                                     |
| :---------------------------------------- | :--------------------------------------------------------- |
| [Auto-fix][1]                             | Use `--fix` to auto-fix issues                             |
| [Cache][2]                                | Use `--cache` to speed up consecutive runs                 |
| [CommonJS][3]                             | JavaScript is just fine                                    |
| [Compilers][4] (built-in/custom)          | Support for Astro, MDX, Vue, etc.                          |
| [Debug][5]                                | Use `--debug` for troubleshooting                          |
| [Filters][6]                              | Exclude or focus on specific issue types                   |
| [JSDoc tags][7]                           | Make exceptions for exports                                |
| [Monorepos][8] (package-based/integrated) | Workspaces are first-class citizen                         |
| [Performance][9]                          | Use `--performance` for detailed timing insights           |
| [Plugins][10]                             | Over 60 plugins with custom entry paths and config parsing |
| [Preprocessors][11]                       | Preprocess issues before being reported                    |
| [Production mode][12]                     | Use `--production` to lint only production code            |
| [Reporters][13] (built-in/custom)         | Use a custom `--reporter ./custom-output.ts`               |
| [Rules][14]                               | Exclude or focus on issue types                            |
| [Script parser][15]                       | Scripts contain dependencies and entry paths               |
| [Trace][16]                               | Trace exports to find where they are used                  |
| [Watch mode][17]                          | Use `--watch` to update the reporter on file changes       |
| [Workspace][18]                           | Lint only a single workspace in a monorepo                 |

[1]: ../features/auto-fix.mdx
[2]: ../reference/cli.md#--cache
[3]: ../guides/working-with-commonjs.md
[4]: ../features/compilers.md
[5]: ../guides/troubleshooting.md#issues-reported-by-knip
[6]: ../features/rules-and-filters.md#filters
[7]: ../reference/jsdoc-tsdoc-tags.md
[8]: ../features/monorepos-and-workspaces.md
[9]: ../reference/cli.md#--performance
[10]: ../explanations/plugins.md
[11]: ../features/reporters.md#preprocessors
[12]: ../features/production-mode.md
[13]: ../features/reporters.md
[14]: ../features/rules-and-filters.md#rules
[15]: ../features/script-parser.md
[16]: ../guides/troubleshooting.md#trace
[17]: ../reference/cli.md#--watch
[18]: ../features/monorepos-and-workspaces#lint-a-single-workspace
