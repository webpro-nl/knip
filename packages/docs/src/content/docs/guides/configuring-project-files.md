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

Files are reported as unused if they are in the set of `project` files, but not
in the set of files resolved from the `entry` files. In other words, they're
calculated like so:

```
unused files = project files - (entry files + resolved files)
```

:::tip

To exclude files from the set of project files, first look at using negated
`project` patterns. This is recommended over `ignore` patterns.

:::

See [entry files][1] to see where Knip looks for entry files. Read on to learn
more about fine-tuning the sets of entry and project files.

## Negated patterns

Let's take a look at using negated patterns for `entry` and `project` files. If
you think there are too many files in the analysis, this is the first step in
selecting the right files for the analysis.

For example, we need to explicitly add route files as entry files, except those
starting with an underscore. Then we can use a negated pattern like so:

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

### Example

❌   Don't do this:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "ignore": ["build/**", "dist/**", "src/generated.ts"]
}
```

Don't exclude files like build artifacts using `ignore`, but include the source
and script files in `project` patterns instead:

✅   Do this:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts"],
  "project": ["src/**", "scripts/**"],
  "ignore": ["src/generated.ts"]
}
```

This way, the `project` files cover all source files, and other files don't even
need to be ignored anymore. Only files that are actually imported from source
code might be candidates to `ignore`. This may also have significant impact on
performance.

It's not recommended to add all files as entry files for two reasons:

1. Knip does not report [unused exports][2] in entry files.
2. Configuring `entry` and `project` files properly allows Knip to find unused
   files.

:::tip

Do not add too many `entry` files. You'll miss out on both unused exports and
unused files.

:::

## Ignore issues in specific files

Use `ignore` if a certain file contain unused exports that we want to ignore.
For example, this might happen with generated files that export "everything" and
we don't want the unused exports of such files to be reported:

```json
{
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["src/generated.ts"]
}
```

Also see the [ignoreExportsUsedInFile][3] configuration option.

## Production Mode

In default mode, Knip includes all test files and other non-production files in
the analysis. To find out what files, dependencies and exports are unused in
production source files, use [production mode][4].

How to exclude test and other non-production files from the analysis? For a
better understanding of how Knip works, here's a list of options that DON'T
work, and why.

❌   Don't do this:

```json
{
  "ignore": ["**/*.test.js"]
}
```

This is not a good idea, since `ignore` patterns have only one goal: to exclude
issues in matching files from the report. Files matching `ignore` patterns are
not excluded from the analysis, only their issues are not reported.

:::tip

The goal of `ignore` patterns is to exclude the issues in matching files from
the report. These files are not excluded from the analysis.

:::

This is also not efficient, since the files are first analyzed, and eventually
filtered out.

❌   Also don't do this:

```json
{
  "entry": ["index.ts", "!**/*.test.js"]
}
```

This won't help if dependencies like Vitest or Ava are listed, because their
plugins will add test files as entry files anyway, which you can't and shouldn't
undo or override here. Configure plugins individually if necessary.

❌   Also don't do this:

```json
{
  "project": ["**/*.ts", "!**/*.spec.ts"]
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

This will exclude test files from the analysis to focus on production code.

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

## Defaults & Plugins

To reiterate, the default `entry` and `project` files for each workspace:

```json
{
  "entry": [
    "{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}",
    "src/{index,cli,main}.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"
  ],
  "project": ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}!"]
}
```

Next to this, there are other places where [Knip looks for entry files][1].

Additionally, [plugins have plenty of entry files configured][5] that are
automatically added as well.

[1]: ../explanations/entry-files.md
[2]: ../typescript/unused-exports.md
[3]: ../reference/configuration#ignoreexportsusedinfile
[4]: ../features/production-mode.md
[5]: ../explanations/plugins.md#entry-files
