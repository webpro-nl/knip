---
title: Performance
---

This page describes a few topics around Knip's performance, and how you might
improve it.

Knip does not want to tell you how to structure files or how to write your code,
but it might still be good to understand inefficient patterns for Knip.

Use the `--debug` and `--performance` flags to find potential bottlenecks.

## Cache

Use `--cache` to speed up consecutive runs.

## Ignoring files

Files matching the `ignore` patterns are not excluded from the analysis. They're
just not printed in the report. Use negated `entry` and `project` patterns to
exclude files from the analysis.

Read [configuring project files][1] for details and examples. Improving
configuration may have a significant impact on performance.

## Metrics

Use [the `--performance` flag][2] to see how many times potentially expensive
functions (e.g. `findReferences`) are invoked and how much time is spent in
those functions. Example usage:

```sh
knip --performance
```

## ignoreExportsUsedInFile

The [ignoreExportsUsedInFile][3] option slows down the process slightly.
Typically, anywhere between 0.25% and 10% of total running time. To find out:

```sh
knip --performance-fn hasRefsInFile
```

## A last resort

In case Knip is unbearably slow (or even crashes), you could resort to [lint
individual workspaces][4].

[1]: ./configuring-project-files.md
[2]: ../reference/cli.md#--performance
[3]: ../reference/configuration.md#ignoreexportsusedinfile
[4]: ../features/monorepos-and-workspaces.md#filter-workspaces
