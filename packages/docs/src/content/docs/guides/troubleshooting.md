---
title: Troubleshooting
sidebar:
  order: 2
---

We can distinguish two types of issues:

- [Issues reported by Knip][1]
- [Exceptions thrown by Knip][2]

Both of which could be either an issue on your end or with Knip.

Use [--debug][3] and [--trace][4] to help troubleshoot issues.

## Issues reported by Knip

This indicates a successful run, but clutter was found. Continue to [handle
issues][5] and deal with the reported clutter.

If Knip reports false positives and you want to open an issue, please see [issue
reproduction][6].

## Exceptions thrown by Knip

Knip (or one of its plugins loading a configuration file) may throw an error,
resulting in an unsuccessful run. You might be encountering a [known issue][7].

Add `--debug` to the command for more error details to better locate the cause
of the error.

Feel free to report bugs, please see [issue reproduction][6].

## Debug

To better understand why Knip reports what it does, run it in debug mode by
adding `--debug` to the command:

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

It's like a reversed dependency graph. Instead of traversing imports it goes in
the opposite direction and shows where exports are imported.

#### Legend

|     | Description                                 |
| --- | :------------------------------------------ |
| `✓` | Contains import and reference to the export |
| `◯` | Entry file                                  |

## Opening an issue

If you want to open an issue, please see [issue reproduction][6].

## Understanding Knip

Looking to better understand how Knip works? The [entry files][8] and
[plugins][9] explanations cover two core concepts. After this you might want to
check out features like [production mode][10] and [monorepos & workspaces][11].

In a more general sense, [Why use Knip?][12] explains what Knip can do for you.

## Asking for help

If you can't find your answer in any of the aforementioned resources, feel free
to [open an issue on GitHub][13] or discuss it in [the Discord channel][14].

[1]: #issues-reported-by-knip
[2]: #exceptions-thrown-by-knip
[3]: #debug
[4]: #trace
[5]: ../guides/handling-issues.md
[6]: ./issue-reproduction.md
[7]: ../reference/known-issues.md
[8]: ../explanations/entry-files.md
[9]: ../explanations/plugins.md
[10]: ../features/production-mode.md
[11]: ../features/monorepos-and-workspaces.md
[12]: ../explanations/why-use-knip.md
[13]: https://github.com/webpro-nl/knip/issues
[14]: https://discord.gg/r5uXTtbTpc
