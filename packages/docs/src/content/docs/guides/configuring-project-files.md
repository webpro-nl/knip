---
title: Configuring Project Files
sidebar:
  order: 1
---

The `entry` and `project` file patterns are the first and most important
options. Getting those right is essential to get the most value and performance
out of Knip.

The key takeaways of this page include:

- If the defaults need adjustment, define targeted `entry` file patterns.
- To find unused files, narrow down and add negated `project` patterns.
- To exclude test and other non-production files, use production mode.
- Use `ignore` patterns to exclude issues in matching files from the report.

Let's dive in and expand on all of these.

## Unused files

Files are reported as unused if they are in the set of project files, but not in
the set of files resolved from the entry files:

```
unused files = project files - (entry files + resolved files)
```

See [entry files][1] to see where Knip looks for entry files. Read on to learn
how to fine-tune the sets of entry and project files.

## Negated patterns

Let's take a look at using negated patterns for `entry` and `project` files. If
you think there are too many files in the analysis, this could be the first step
in selecting the right files for the analysis.

Say we need to explicitly add route files as entry files, except those starting
with an underscore. Then we can use a negated pattern like so:

```json
{
  "entry": ["src/routes/*.ts", "!src/routes/_*.ts"]
}
```

If certain files are not part of our project source files and are unwantedly
reported as unused files, we can use negated `project` patterns:

```json
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts", "!src/exclude/**"]
}
```

By the way, we don't want to simply add all files as entry files for two
reasons:

1. Knip does not report unused exports in entry files.
2. Configuring `entry` and `project` files properly allows Knip to find unused
   files.

## Ignore issues in specific files

Use `ignore` if a certain file contain unused exports that we want to ignore.
For example, this might happen with a generated file that exports "everything"
and we don't want the unused exports of this file to be reported:

```json
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["src/generated.ts"]
}
```

## Exclude non-production files

In default mode, Knip includes all test files and other non-production files in
the analysis. To find out what files, dependencies and exports are unused in
production source files, use [production mode][2].

How NOT to exclude test files from the analysis? For a better understanding of
how Knip works, here's a list of options that don't work, and why:

❌   Don't do this:

```json
{
  "ignore": ["**/*.test.js"]
}
```

This is not a good idea, since `ignore` patterns have only one goal: to exclude
issues in matching files from the report. Files matching `ignore` patterns are
not excluded from the analysis, only their issues are not reported. This also
hurts performance, since the files are first analyzed, and eventually filtered
out.

❌   Also don't do this:

```json
{
  "entry": ["!**/*.test.js"]
}
```

This won't help if dependencies like Vitest or Ava are listed, because their
plugins will add test files as entry files anyway, which you can't and shouldn't
undo or override here.

❌   Also don't do this:

```json
{
  "project": ["!**/*.spec.ts"]
}
```

This won't help either:

1. The set of `project` files have only one goal: to find unused files. Negated
   `project` patterns do not exclude files from the analysis.
2. Enabled plugins add (test) files as entry files, and their configuration
   remains unaffected. You'd need to disable the plugin or override its
   configuration instead.

✅   Do this:

```shell
knip --production
```

This will exclude test files from the analysis, so you can focus on production
code.

Now, Knip might still report certain files like test utilities as unused. That's
because they're still part of the set of `project` files. Those files should
then be excluded in production mode:

```json
{
  "entry": ["src/index.ts!"],
  "project": ["src/**/*.ts!", "!src/test-helpers/**!"]
}
```

Remember to keep adding the exclamation mark `suffix!` for production file
patterns.

In rare occasions, for large projects where a single configuration for both
default and production mode gets unwieldy, it might be interesting to consider
using a separate configuration file for production mode:

```shell
knip --production --config knip.production.json
```

[1]: ../explanations/entry-files.md
[2]: ../features/production-mode.md
