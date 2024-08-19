---
title: Configuration
description: config
---

## Defaults

Knip has good defaults and aims for "zero config". For best results, Knip might
need some configuration.

Here's a simplified version of the default configuration:

```json
{
  "entry": ["index.{js,ts}", "src/index.{js,ts}"],
  "project": ["**/*.{js,ts}"]
}
```

Entry files are the starting point for Knip to find more source files and
external dependencies. The resulting set of used files is matched against the
set of `project` files to determine which files are unused.

:::tip

Run Knip without configuration. If it reports false positives, you need a
configuration file. Please also read [configure project files][1].

:::

## Location

This is where Knip looks for a configuration file:

- `knip.json`
- `knip.jsonc`
- `.knip.json`
- `.knip.jsonc`
- `knip.ts`
- `knip.js`
- `knip.config.ts`
- `knip.config.js`
- `"knip"` property in `package.json`

To use a different file path:

```sh
knip --config path/to/knip.json
```

## Customize

Your project structure may not match the default `entry` and `project` files.
Here's an example custom configuration to include `.js` files in the `scripts`
folder:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts", "scripts/{build,create}.js"],
  "project": ["src/**/*.ts", "scripts/**/*.js"]
}
```

If you override the `entry` file patterns, you may also want to override
`project` file patterns. The set of project files is used to determine what
files are unused. The `project` patterns can also be negated to exclude files
from the analysis. Also see [configuring project files][1].

The values you set override the default values, they are not merged.

:::tip

Be specific with `entry` files. Minimize the number of entry files and wildcards
for better results.

Plugins set entry files for you, such as those for Next.js, Remix, Vitest, and
many more.

:::

Knip looks in many places for entry files. Learn more about this in the next
page about [entry files][2].

## What's next?

The best way to understand Knip and what it can do for you is to read the pages
in the "Understanding Knip" sections, starting with [entry files][2].

Want to learn more about some of the main features?

- Working with [monorepos & workspaces][3].
- Learn more about [production mode][4].

Having troubles configuring Knip?

- [Configuring project files][1]
- [Handling issues][5]

Search this website using the bar at the top (`Ctrl+K` or `⌘+K`).

[1]: ../guides/configuring-project-files.md
[2]: ../explanations/entry-files.md
[3]: ../features/monorepos-and-workspaces.md
[4]: ../features/production-mode.md
[5]: ../guides/handling-issues.md
