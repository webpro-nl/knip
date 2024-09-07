---
title: Why use Knip?
sidebar:
  order: 3
---

The value of removing clutter from your code is undeniable. However, finding
them is a manual and tedious job. This is where Knip comes in. As codebases grow
in complexity and size, automated and comprehensive tooling becomes critical.

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
  the same for files, dependencies and exports that you forgot to delete.
- Keeping dead code around has a negative value on readability, as it can be
  misleading and distracting. Even if it serves no purpose it will need to be
  maintained (source: [Safe dead code removal → YAGNI][1]).
- Also see
  [Why are unused dependencies a problem?](../typescript/unused-dependencies.md#why-are-unused-dependencies-a-problem)

## Automation

Code and dependency management is often not the most fulfilling task. It is
Knip's mission to automate the part where it comes to finding clutter. Because
finding them manually is such a tedious job, and where do you even start? Knip
contains a lot of standards and heuristics to search for clutter. Knip is not
without flaws. But even a list of results with a few false positives is many
times better and faster than trying to do it manually.

:::tip

Knip not only finds clutter, it can also [clean it][2]! Use Knip next to a
linter like ESLint or Biome: after removing unused variables inside files, Knip
might find even more unused code. Rinse and repeat!

:::

## Comprehensive

You can use alternative tools that do the same. However, the advantage of a
strategy that addresses all of files, dependencies and exports is in their
synergy:

- Utilizing plugins to find their dependencies includes the capacity to find
  additional entry files. This results in more resolved and used files. Better
  coverage gives greater insights into unused files and exports.
- Analyzing more files reveals more dependency usage, refining the list of both
  unused and unlisted dependencies.
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
the project or doing large refactors. Again, even a list of results with a few
false positives is many times better and faster than trying to do it manually.

## Unobtrusive

Knip does not introduce new syntax for you to learn. This may sound obvious, but
consider comments like the following:

```js
// eslint-disable-next-line
// prettier-ignore
// @ts-expect-error
```

Maybe you wonder why Knip does not have similar comments like `// knip-ignore`
so you can easily get rid of false positives? A variety of reasons:

1. A false positive may be a bug in Knip, and should be reported (not easily
   dismissed).
2. Instead of proprietary comments, use [standardized annotations][3] serving as
   documentation as well.
3. In the event you want to remove Knip, you only need to uninstall the `knip`
   dependency and delete the file to configure it (and not countless useless
   comments scattered throughout the codebase).

Knip v4 introduces [--tags][4], to filter the report to your needs.

[1]: https://jfmengels.net/safe-dead-code-removal/#yagni-you-arent-gonna-need-it
[2]: ../features/auto-fix.mdx
[3]: ../reference/jsdoc-tsdoc-tags.md
[4]: ../reference/cli.md#--tags
