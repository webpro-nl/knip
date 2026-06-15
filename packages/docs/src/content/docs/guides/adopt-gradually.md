---
title: Adopt Knip gradually
description: Roll Knip out on a large or legacy codebase without trying to reach zero on day one. Baseline, focus one issue type at a time, then ratchet with rules.
---

On a large or legacy codebase the first run can report a lot. Reaching zero in
one sitting is then the wrong goal. Get a trustworthy signal first, then ratchet
the codebase toward clean and keep it there.

## Actionable baseline

Most of the noise on a first run comes from gaps in what Knip can reach: a
dependency that Knip does not have a plugin for yet, an entry point it can't
resolve, a phantom dependency. Fix the gaps before you delete anything:

- Address [configuration hints][1].
- Tune [entry and project files][2] so Knip analyzes the right set of files.
- Tune configuration for your tools' [plugins][3].

Read the output from the top. One unused file hides its exports and
dependencies, so files come first.

Once the report reflects real findings instead of gaps, you have an actionable
baseline.

## Focus one issue type at a time

Don't fix everything at once. Narrow the report with [filters][4]:

```sh
knip --files        # unused files only (the major cascade!)
knip --dependencies # then dependencies
knip --exports      # then exports and types
```

Clear one type, commit, move to the next.

## Stage by rules

[Rules][5] set a severity per issue type. Start by setting all types to
`"warn"`, and then the types you've cleaned to `"error"`. Warnings are printed
in gray, and they don't fail the run. Example:

```json title="knip.json"
{
  "rules": {
    "files": "error",
    "dependencies": "error",
    "exports": "warn",
    "duplicates": "off"
  }
}
```

As each `"warn"` type reaches zero, set it to `"error"`. Keep iterating and
prune the codebase to perfection.

## Gate CI without blocking the team

Add Knip to [CI][6] as soon as you have a baseline, so new clutter is caught in
review. A few ways to stage it:

- Mark cleaned types `"error"` and the rest `"warn"`, so CI fails only on the
  types you've finished.
- Workspace by workspace: in a [monorepo][7], scope passes with `--workspace`
  (accepts multiple workspaces and glob patterns).
- Production first: [`--production`][8] limits analysis to shipped code, so you
  can clean what matters most and defer tests and tooling.
- Set a budget, so CI fails only when the count exceeds the number (e.g. `knip
--max-issues 50`). This blocks regressions while you burn down the rest.
- Run report-only with [`--no-exit-code`][9] while you're still triaging.

## Suppress only what's justified

When something is genuinely fine as-is, prefer a specific, documented signal
over a blanket `ignore`, for example:

- tag an export with e.g. [`@lintignore` or `@internal`][10]
- use [`ignoreExportsUsedInFile`][11] for internal-only exports
- list known exceptions in [`ignoreDependencies`][12]

[Resolving reported issues][13] covers the right tool for each case.

[1]: ../reference/configuration-hints.md
[2]: ./configuring-project-files.md
[3]: ../explanations/plugins.md
[4]: ../features/rules-and-filters.md#filters
[5]: ../features/rules-and-filters.md#rules
[6]: ./using-knip-in-ci.md
[7]: ../features/monorepos-and-workspaces.md
[8]: ../features/production-mode.md
[9]: ../reference/cli.md#--no-exit-code
[10]: ../reference/jsdoc-tsdoc-tags.md
[11]: ../reference/configuration.md#ignoreexportsusedinfile
[12]: ../reference/configuration.md#ignoredependencies
[13]: ./handling-issues.mdx
