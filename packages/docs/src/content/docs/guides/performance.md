---
title: Performance
description: How to profile and speed up Knip using the `--cache`, `--performance`, and `--debug` flags, file patterns, and per-workspace linting.
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

## Bun

On large projects, [`knip-bun`][4] is slower than `knip` on Node.js. Knip parses
files with oxc-parser, which passes the AST to JavaScript using raw transfer.
Raw transfer needs an `ArrayBuffer` larger than 4 GiB, which Bun can't allocate.
So oxc-parser disables raw transfer under Bun and uses the slower path that
[`KNIP_DISABLE_RAW_TRANSFER=1`][5] selects on Node.js.

Measured with Node.js v26.13 and Bun v1.4.4 on macOS, Bun was about 20% slower
on the Sentry repository (about 10,000 files) and on par on the Astro monorepo,
while using 14-18% less memory. On Knip's own repository, Bun was faster because
it starts faster.

## A last resort

In case Knip is unbearably slow (or even crashes), you could resort to [lint
individual workspaces][6].

[1]: ./configuring-project-files.md
[2]: ../reference/cli.md#--performance
[3]: ../reference/configuration.md#ignoreexportsusedinfile
[4]: ../reference/cli.md#knip-bun
[5]: ../reference/cli.md#knip_disable_raw_transfer
[6]: ../features/monorepos-and-workspaces.md#filter-workspaces
