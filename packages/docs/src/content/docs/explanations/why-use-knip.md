---
title: Why use Knip?
sidebar:
  order: 3
---

The value of removing clutter from your code is undeniable. However, finding it
is a tedious job. This is where Knip comes in. As codebases grow in complexity
and size, comprehensive and automated tooling is indispensable.

:::tip[TL;DR]

Knip finds and fixes unused dependencies, exports and files.

Deep analysis from [fine-grained entry points][1] based on the actual frameworks
and tooling in [(mono)repos][2] for accurate and actionable results. Advanced
features for maximum coverage:

- [Custom module resolution][3]
- [Configuration file parsers][4]
- [Advanced shell script parser][5]
- [Built-in and custom compilers][6]
- [Auto-fix most issues][7]

:::

## Less is more

There are plenty of reasons to delete unused files, dependencies and "dead
code":

- Easier maintenance: things are easier to manage when there's less of it.
- Improved performance: startup time, build time and/or bundle size can be
  negatively impacted when unused code, files and/or dependencies are included.
  Relying on tree-shaking when bundling code helps, but it's not a silver
  bullet.
- Easier onboarding: there should be no doubts about whether files, dependencies
  and exports are actually in use or not. Especially for people new to the
  project and/or taking over responsibilities this is harder to grasp.
- Prevent regressions: tools like TypeScript, ESLint and Prettier do all sorts
  of checks and linting to report violations and prevent regressions. Knip does
  the same for dependencies, exports and files that are obsolete.
- Keeping dead code around has a negative value on readability, as it can be
  misleading and distracting. Even if it serves no purpose it will need to be
  maintained (source: [Safe dead code removal → YAGNI][8]).
- Also see [Why are unused dependencies a problem?][9] and [Why are unused
  exports a problem?][10].

## Automation

Code and dependency management is usually not the most exciting task for most of
us. Knip's mission is to automate finding clutter. This is such a tedious job if
you were to do it manually, and where would you even start? Knip applies many
techniques and heuristics to report what you need and save a lot of time.

:::tip

Knip not only finds clutter, it can also [remove clutter][7]!

Use Knip next to a linter like ESLint or Biome: after removing unused variables
inside files, Knip might find even more unused code. Rinse and repeat!

:::

## Comprehensive

You can use alternative tools that do the same. However, the advantage of a
strategy that addresses all of dependencies, exports and files is in their
synergy:

- Utilizing plugins to find their dependencies includes the capacity to find
  additional entry and configuration files. This results in more resolved and
  used files. Better coverage gives better insights into unused files and
  exports.
- Analyzing more files reveals more unused exports and dependency usage,
  refining the list of both unused and unlisted dependencies.
- This approach is amplified in a monorepo setting. In fact, files and internal
  dependencies can recursively reference each other (across workspaces).

## Greenfield or Legacy

Installing Knip in greenfield projects ensures the project stays neat and tidy
from the start. Add it to your CI workflow and prevent any regressions from
entering the codebase.

:::tip

Use Knip in a CI environment to prevent future regressions.

:::

In large and/or legacy projects, Knip may report false positives and require
some configuration. Yet it can be a great assistant when cleaning up parts of
the project or doing large refactors. Even a list of results with a few false
positives is many times better and faster than if you were to do it manually.

## Unobtrusive

Knip does not introduce new syntax for you to learn. This may sound obvious, but
consider comments like the following:

```js
// eslint-disable-next-line
// prettier-ignore
// @ts-expect-error
```

Maybe you wonder why Knip does not have similar comments like `// knip-ignore`
so you can get rid of false positives? A variety of reasons:

1. A false positive may be a bug in Knip, and should be reported, not dismissed.
2. Instead of proprietary comments, use [standardized annotations][11] that also
   serve as documentation.
3. In the event you want to remove Knip, just uninstall `knip` without having to
   remove useless comments scattered throughout the codebase.

Tip: use `@lintignore` in JSDoc comments, so other linters can use the same.

[1]: ./entry-files.md
[2]: ../features/monorepos-and-workspaces.md
[3]: ../reference/faq.md#why-doesnt-knip-use-an-existing-module-resolver
[4]: ./plugins.md#configuration-files
[5]: ../features/script-parser.md
[6]: ../features/compilers.md
[7]: ../features/auto-fix.mdx
[8]: https://jfmengels.net/safe-dead-code-removal/#yagni-you-arent-gonna-need-it
[9]: ../typescript/unused-dependencies.md#why-are-unused-dependencies-a-problem
[10]: ../typescript/unused-exports.md#why-are-unused-exports-a-problem
[11]: ../reference/jsdoc-tsdoc-tags.md
