---
title: Troubleshooting
sidebar:
  order: 2
---

We can distinguish two types of issues:

- [Issues reported by Knip][1]
- [Exceptions thrown by Knip][2]

## Issues reported by Knip

This indicates a successful run, but there are unused items. Continue with
[handling issues][3] to deal with unused items reported by Knip.

:::tip

Use [--debug][4] and [--trace][5] to troubleshoot issues.

:::

## Exceptions thrown by Knip

Knip (or one of its plugins loading a configuration file) may throw an error,
resulting in an unsuccessful run. You might be encountering a [known issue][6].

Add `--debug` to the command for more error details to better locate the cause
of the error.

## Debug

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
- Compiled non-standard source files

## Trace

Use `--trace` to see where exports are used.

- Use `--trace-file [path]` to output this only for the given file.
- Use `--trace-export [name]` to output this only for the given export name.

Use both to be more specific, this is useful e.g. for tracing only the `default`
export of a certain file.

This works across re-exports, barrel files and workspaces. Here's an example
screenshot:

<img src="/screenshots/trace.png" alt="trace" class="mw500" />

#### Legend

|     | Description                                 |
| --- | :------------------------------------------ |
| `✓` | Contains import and reference to the export |
| `◯` | Entry file                                  |

## Minimal reproduction

If you encounter an issue or false positives when running Knip, you can [open an
issue on GitHub][7]. Depending on the type of issue, you might be asked to
create a minimal reproduction: only the code and configuration required to
demonstrate the issue.

A convenient way to do so is by starting with one of these templates in
CodeSandbox or StackBlitz:

| Template |                   |                  |
| :------- | ----------------- | ---------------- |
| Basic    | [CodeSandbox][8]  | [StackBlitz][9]  |
| Monorepo | [CodeSandbox][10] | [StackBlitz][11] |

Other solutions may work well too. For instance, many people choose to create a
small repository on GitHub. The goal is to have an easy and common understanding
and reproduction.

:::tip

The optimal way is to add fixtures and/or failing tests to the Knip repository,
and open a pull request to discuss the issue!

:::

## Understanding Knip

Looking to better understand how Knip works? The [entry files][12] and
[plugins][13] explanations cover two core concepts. After this you might want to
check out features like [production mode][14] and [monorepos & workspaces][15].

In a more general sense, [Why use Knip?][16] explains what Knip can do for you.

## Asking for help

If you can't find your answer in any of the aforementioned resources, feel free
to [open an issue on GitHub][7] or discuss it in [the Discord channel][17].

[1]: #issues-reported-by-knip
[2]: #exceptions-thrown-by-knip
[3]: ../guides/handling-issues.md
[4]: #debug
[5]: #trace
[6]: ../reference/known-issues.md
[7]: https://github.com/webpro-nl/knip/issues
[8]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/basic
[9]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/basic
[10]:
  https://codesandbox.io/p/devbox/github/webpro-nl/knip/main/templates/issue-reproduction/monorepo
[11]:
  https://stackblitz.com/github/webpro-nl/knip/tree/main/templates/issue-reproduction/monorepo
[12]: ../explanations/entry-files.md
[13]: ../explanations/plugins.md
[14]: ../features/production-mode.md
[15]: ../features/monorepos-and-workspaces.md
[16]: ../explanations/why-use-knip.md
[17]: https://discord.gg/r5uXTtbTpc
