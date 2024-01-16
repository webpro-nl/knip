---
title: Why use Knip?
sidebar:
  order: 3
---

The value of removing obsolete things from your code is undeniable. However,
finding them is a manual and tedious job. This is where Knip comes in. As
codebases grow in complexity and size, automated and comprehensive tooling
becomes critical.

## Less is more

There are plenty of reasons to delete unused files, unused dependencies and
"dead code":

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

## Automation

Code and dependency management is often not the most fulfilling task. It is
Knip's mission to automate the part where it comes to finding unused things.
Because finding them manually is such a tedious job, and where do you even
start? Knip contains a lot of standards and heuristics to search for things that
can be deleted. Knip is not without flaws. But even a list of results with a few
false positives is many times better and faster than trying to do it manually.

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

The disadvantages of this strategy are not be dismissed: increased complexity
and less performance. In this early phase of the project completeness and
correctness are valued over speed. Not in the least because the speed of
automating this is still many times faster than the manual process. Both
complexity and performance can be optimized further down the road.

## Greenfield or Legacy

Installing Knip in greenfield projects ensures the project stays neat and tidy
from the start. Add it to your CI workflow and prevent any regressions from
entering the codebase.

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
2. The [documentation makes you think twice][2] before using syntax like
   `@public` or `@internal` tags.
3. In the event you want to remove Knip, you only need to uninstall the `knip`
   dependency and delete the file to configure it.

Knip v4 introduces [tags][3] (experimental), to filter the report to your needs.

[1]: https://jfmengels.net/safe-dead-code-removal/#yagni-you-arent-gonna-need-it
[2]: ../reference/jsdoc-tsdoc-tags.md
[3]: ../reference/cli.md#--experimental-tags
