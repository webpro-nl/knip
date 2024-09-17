---
title: Troubleshooting
sidebar:
  order: 2
---

We can distinguish two types of issues:

- [Lint issues reported by Knip][1]
- [Exceptions thrown by Knip][2]

Also see the [debug][3] and [trace][4] options below that can help to
troubleshoot issues.

## Lint issues reported by Knip

Knip reports lint issues in your codebase. See [handling issues][5] to deal with
the reported issues.

If Knip reports false positives and you're considering filing a GitHub issue,
please do! It'll make Knip better for everyone. Please read [issue
reproduction][6] first.

Exit code 1 indicates a successful run, but lint issues were found.

## Exceptions thrown by Knip

Knip may throw an exception, resulting in an unsuccessful run.

See [known issues][7] as it may be listed there and a workaround may be
available. If it isn't clear what's throwing the exception, try another run with
`--debug` to locate the cause of the issue with more details.

If Knip throws an exception and you're considering filing a GitHub issue, please
do! It'll make Knip better for everyone. Please read [issue reproduction][6]
first.

Exit code 2 indicates an exception was thrown by Knip.

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

Use `--trace` to see where all exports are used. Or be more specific:

- Use `--trace-file [path]` to output this only for the given file.
- Use `--trace-export [name]` to output this only for the given export name.
- Use both to trace a specific named or default export of a certain file.

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
