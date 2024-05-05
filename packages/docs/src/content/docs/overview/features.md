---
title: Features
---

Overview of features supported by Knip (A-Z):

| Name                                      | Description or example                                     |
| :---------------------------------------- | :--------------------------------------------------------- |
| [Auto-fix][5]                             | Use `--fix` to auto-fix issues                             |
| [Cache][14]                               | Use `--cache` to speed up consecutive runs                 |
| [CommonJS][11]                            | JavaScript is just fine                                    |
| [Compilers][6] (built-in/custom)          | Support for Astro, MDX, Vue, etc.                          |
| [Debug][12]                               | Use `--debug` for troubleshooting                          |
| [Filters][4]                              | Exclude or focus on specific issue types                   |
| [JSDoc tags][16]                          | Make exceptions for exports                                |
| [Monorepos][2] (package-based/integrated) | Workspaces are first-class citizen                         |
| [Performance][13]                         | Use `--performance` for detailed timing insights           |
| [Plugins][10]                             | Over 60 plugins with custom entry paths and config parsing |
| [Preprocessors][8]                        | Preprocess issues before being reported                    |
| [Production mode][1]                      | Use `--production` to lint only production code            |
| [Reporters][7] (built-in/custom)          | Use a custom `--reporter ./custom-output.ts`               |
| [Rules][3]                                | Exclude or focus on issue types                            |
| [Script parser][9]                        | Scripts contain dependencies and entry paths               |
| [Watch mode][15]                          | Use `--watch` to update the reporter on file changes       |
| [Workspace][17]                           | Lint only a single workspace in a monorepo                 |

[1]: ../features/production-mode.md
[2]: ../features/monorepos-and-workspaces.md
[3]: ../features/rules-and-filters.md#rules
[4]: ../features/rules-and-filters.md#filters
[5]: ../features/auto-fix.mdx
[6]: ../features/compilers.md
[7]: ../features/reporters.md
[8]: ../features/reporters.md#preprocessors
[9]: ../features/script-parser.md
[10]: ../explanations/plugins.md
[11]: ../guides/working-with-commonjs.md
[12]: ../guides/troubleshooting.md#issues-reported-by-knip
[13]: ../reference/cli.md#--performance
[14]: ../reference/cli.md#--cache
[15]: ../reference/cli.md#--watch
[16]: ../reference/jsdoc-tsdoc-tags.md
[17]: ../features/monorepos-and-workspaces#lint-a-single-workspace
