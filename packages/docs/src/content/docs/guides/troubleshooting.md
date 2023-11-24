---
title: Troubleshooting
sidebar:
  order: 1
---

We can distinguish two types of issues:

- [Issues reported by Knip](#handling-issues)
- [Exceptions thrown by Knip](#exceptions-thrown-by-knip)

## Issues Reported by Knip

This indicates a successful run, but there are unused items (exit code `1`).

Read [handling issues][1] on how to deal with the unused items as reported by
Knip. To better understand why Knip reports what it does, run it in debug mode
by adding `--debug` to the command:

```sh
knip --debug
```

This will give a lengthy output, including:

- Included workspaces
- Used configuration per workspace
- Enabled plugins per workspace
- Glob patterns and options followed by matching file paths
- Plugin config file paths and found dependencies per plugin

## Exceptions thrown by Knip

Knip (or one of its plugins loading a configuration file) may throw an error,
resulting in an unsuccessful run (exit code `2`). You might be encountering a
[known issue][2].

Add `--debug` to the command for more error details to better locate the cause
of the error.

## Understanding Knip

Looking to better understand how Knip works? The [entry files][5] and
[plugins][6] explanations cover two core concepts. After this you might want to
check out features like [production mode][7] and [monorepos & workspaces][8].

In a more general sense, [Why use Knip?](../explanations/why-use-knip.md)
explains what Knip can do for you.

## Ask for Help

If you can't find your answer in any of the aforementioned resources, feel free
to [open an issue on GitHub][3] or discuss it in [the Discord channel][4].

[1]: ../guides/handling-issues.md
[2]: ../reference/known-issues.md
[3]: https://github.com/webpro/knip/issues
[4]: https://discord.gg/r5uXTtbTpc
[5]: ../explanations/entry-files.md
[6]: ../explanations/plugins.md
[7]: ../features/production-mode.md
[8]: ../features/monorepos-and-workspaces.md
