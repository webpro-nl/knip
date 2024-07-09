---
title: Performance
---

This page describes a few topics around Knip's performance, and how you might
improve it.

Knip does not want to tell you how to structure files or how to write your code,
but it might still be good to understand inefficient patterns for Knip.

Use the `--debug` and `--performance` flags to find potential bottlenecks.

## Ignoring files

Files matching the `ignore` patterns are not excluded from the analysis. They're
just not printed in the report. Use negated `entry` patterns to exclude files
from the analysis whenever possible.

Here's a little guide:

1. Set `entry` files if necessary.
2. Override the default `project` setting to cover all source files (default:
   `**/*.{js,ts}`)
3. If needed, use additional negated `entry` patterns to exclude files from the
   analysis.
4. If needed, use additional negated `project` files to narrow down the set of
   all files to find unused files.
5. Then use `ignore` patterns for the remaining issues in the reports.

❌ Don't do this:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "ignore": ["build/**", "dist/**", "src/generated.ts"]
}
```

✅ Do this:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "project": ["src/**", "scripts/**"],
  "ignore": ["src/generated.ts"]
}
```

This way, the `project` files cover all source files, and most other files don't
even need to be ignored anymore. This may have a significant impact on
performance.

Also see [configuring project files][1].

## Workspace sharing

Knip shares files from separate workspaces if the configuration in
`tsconfig.json` allows this. This reduces memory consumption and run duration.
Relevant compiler options include `baseUrl`, `paths` and `moduleResolution`.

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

The first number in `P1/1` is the number of the program, the second number
indicates additional entry files were found in the previous round so it does
another round of analysis on those files.

Use [--isolate-workspaces](../reference/cli.md#--isolate-workspaces) to disable
this behavior.

## findReferences

The `findReferences` function (from the TypeScript Language Service) is invoked
for exported class members. If finding unused class members is enabled, use the
`--performance` flag to see how many times this function is invoked and how much
time is spent there:

```sh
knip --include classMembers --performance
```

The first invocation (per program) is especially expensive, as TypeScript sets
up symbols and caching.

## A last resort

In case Knip is unbearable slow (or even crashes), you could resort to [lint
individual workspaces][2].

[1]: ./configuring-project-files.md
[2]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
