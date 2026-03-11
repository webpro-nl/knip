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

## Workspace sharing

Knip shares files from separate workspaces if the configuration in
`tsconfig.json` allows this. This aims to reduce memory consumption and run
duration. Relevant compiler options include `baseUrl`, `paths` and
`moduleResolution`.

With the `--debug` flag you can see how many programs Knip uses. Look for
messages like this:

```sh
...
[*] Installed 2 programs for 29 workspaces
...
[*] Analyzing used resolved files [P1/1] (123)
...
[*] Analyzing used resolved files [P1/2] (8)
...
[*] Analyzing used resolved files [P2/1] (41)
...
```

The first number in `P1/1` is the number of the programs, the second number
indicates additional entry files were found so it does another round of analysis
on those files.

Use [--isolate-workspaces][2] to disable this behavior. This is usually not
necessary, but more of an escape hatch in cases with memory usage issues or
incompatible `compilerOptions` across workspaces. Workspaces are analyzed
sequentially to spread out memory usage more evenly, which may prevent crashes
on large monorepos.

## Metrics

Use [the `--performance` flag][4] to see how many times potentially expensive
functions (e.g. `findReferences`) are invoked and how much time is spent in
those functions. Example usage:

```sh
knip --performance
```

## ignoreExportsUsedInFile

The [ignoreExportsUsedInFile][5] option slows down the process slightly.
Typically, anywhere between 0.25% and 10% of total running time. To find out:

```sh
knip --performance-fn hasRefsInFile
```

## A last resort

In case Knip is unbearably slow (or even crashes), you could resort to [lint
individual workspaces][6].

[1]: ./configuring-project-files.md
[2]: ../reference/cli.md#--isolate-workspaces
[4]: ../reference/cli.md#--performance
[5]: ../reference/configuration.md#ignoreexportsusedinfile
[6]: ../features/monorepos-and-workspaces.md#filter-workspaces
