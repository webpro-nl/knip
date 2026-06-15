---
title: Why use Knip?
description: Why remove unused files, exports and dependencies, and how Knip finds them comprehensively across greenfield and legacy (mono)repos.
---

The value of removing clutter is clear, but finding it manually is tedious. Meet
Knip: comprehensive and accurate results at any scale.

:::tip[TL;DR]

Unused files, exports and dependencies pile up as projects grow. Removing them
improves maintenance, performance, security and onboarding, and prevents
regressions in CI. Knip automates finding (and fixing) all three,
comprehensively and at any scale.

:::

## Less is more

There are plenty of reasons to delete unused files, dependencies and "dead
code":

- Easier maintenance: things are easier to manage when there's less of it.
- Improved performance: startup time, build time and/or bundle size can be
  negatively impacted when unused code, files and/or dependencies are included.
  Relying on tree-shaking when bundling code helps, but it's not a silver
  bullet.
- Increased security: less code and dependencies means less room for weak spots.
- Easier onboarding: there should be no doubts about whether files, dependencies
  and exports are actually in use or not. Especially for people new to the
  project and/or taking over responsibilities this is harder to grasp.
- Prevent regressions: tools like TypeScript, ESLint and Prettier do all sorts
  of checks and linting to report violations and prevent regressions. Knip does
  the same for dependencies, exports and files that are obsolete.
- Keeping dead code around has a negative value on readability, as it can be
  misleading and distracting. Even if it serves no purpose it will need to be
  maintained (source: [Safe dead code removal → YAGNI][1]).
- Also see [Why are unused dependencies a problem?][2] and [Why are unused
  exports a problem?][3].

## Automation

Code and dependency management is usually not the most exciting task for most of
us. Knip's mission is to automate finding clutter. This is such a tedious job if
you were to do it manually, and where would you even start? Knip applies many
techniques and heuristics to report what you need and save a lot of time.

:::tip

Knip not only finds clutter, it can also [remove clutter][4]!

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
- This approach is amplified in a [monorepo setting][5]. In fact, files and
  internal dependencies can recursively reference each other (across
  workspaces).

Knip reaches this coverage through [fine-grained entry points][6], [custom
module resolution][7], [configuration-file parsers][8], an [advanced
shell-script parser][9], and [built-in and custom compilers][10], then [fixes
most of it automatically][4].

## Greenfield or Legacy

Installing Knip in greenfield projects ensures the project stays neat and tidy
from the start. Add it to your CI workflow and prevent any regressions from
entering the codebase.

:::tip

Use Knip in a CI environment to prevent future regressions.

:::

In large and/or legacy projects, Knip may report false positives and require
some configuration. It aims to be a great assistant when cleaning up parts of
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

Knip doesn't have similar comments like `// knip-ignore` so you can get rid of
false positives for a variety of reasons:

1. A false positive may be a bug in Knip, and should be reported, not dismissed.
2. Instead of proprietary comments, use [standardized annotations][11] that also
   serve as documentation.
3. In the event you want to remove Knip, just uninstall `knip` without having to
   remove useless comments scattered throughout the codebase.

Tip: use `@lintignore` in JSDoc comments, so other linters can use the same.

[1]: https://jfmengels.net/safe-dead-code-removal/#yagni-you-arent-gonna-need-it
[2]: ../typescript/unused-dependencies.md#why-are-unused-dependencies-a-problem
[3]: ../typescript/unused-exports.md#why-are-unused-exports-a-problem
[4]: ../features/auto-fix.mdx
[5]: ../features/monorepos-and-workspaces.md
[6]: ./entry-files.md
[7]: ../reference/faq.md#why-doesnt-knip-use-an-existing-module-resolver
[8]: ./plugins.md#configuration-files
[9]: ../features/script-parser.md
[10]: ../features/compilers.md
[11]: ../reference/jsdoc-tsdoc-tags.md
