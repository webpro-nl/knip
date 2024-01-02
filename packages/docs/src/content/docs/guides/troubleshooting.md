---
title: Troubleshooting
sidebar:
  order: 1
---

We can distinguish two types of issues:

- [Issues reported by Knip][1]
- [Exceptions thrown by Knip][2]

## Issues Reported by Knip

This indicates a successful run, but there are unused items. Continue with
[handling issues][3] to deal with unused items reported by Knip.

To better understand why Knip reports what it does, you may want to run it in
debug mode by adding `--debug` to the command:

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
resulting in an unsuccessful run. You might be encountering a [known issue][4].

Add `--debug` to the command for more error details to better locate the cause
of the error.

## Minimal Reproduction

If you encounter an issue or false positives when running Knip, you can [open an
issue on GitHub][5]. Depending on the type of issue, it may be of great help (or
you may be asked) to create a minimal reproduction. This is sometimes referred
to as MNWE (minimal not-working example) or MRE (minimal reproducible example).

A convenient way to do so is by forking one of these templates:

- [CodeSandbox][6]
- [StackBlitz][7]

Other solutions may work well too, the goal is to have an easy and common
understanding and reproduction.

## Understanding Knip

Looking to better understand how Knip works? The [entry files][8] and
[plugins][9] explanations cover two core concepts. After this you might want to
check out features like [production mode][10] and [monorepos & workspaces][11].

In a more general sense, [Why use Knip?][12] explains what Knip can do for you.

## Ask for Help

If you can't find your answer in any of the aforementioned resources, feel free
to [open an issue on GitHub][5] or discuss it in [the Discord channel][13].

[1]: #issues-reported-by-knip
[2]: #exceptions-thrown-by-knip
[3]: ../guides/handling-issues.md
[4]: ../reference/known-issues.md
[5]: https://github.com/webpro/knip/issues
[6]: https://codesandbox.io/p/devbox/knip-reproduction-lk5zqx
[7]: https://stackblitz.com/edit/knip-case-repro?file=README.md&view=editor
[8]: ../explanations/entry-files.md
[9]: ../explanations/plugins.md
[10]: ../features/production-mode.md
[11]: ../features/monorepos-and-workspaces.md
[12]: ../explanations/why-use-knip.md
[13]: https://discord.gg/r5uXTtbTpc
