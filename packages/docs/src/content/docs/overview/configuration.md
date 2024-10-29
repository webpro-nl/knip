---
title: Configuration
description: config
---

## Defaults

Knip has good defaults and aims for "zero config". Here's a simplified version
of the default configuration:

```json
{
  "entry": ["index.{js,ts}", "src/index.{js,ts}"],
  "project": ["**/*.{js,ts}"]
}
```

Entry files are the starting point for Knip to find more source files and
external dependencies.

:::tip

Run Knip without configuration. If it reports false positives, you need a
configuration file. Please also read [configure project files][1].

:::

## Location

By default, Knip will look for a configuration file with the following names:

- `knip.json`
- `knip.jsonc`
- `.knip.json`
- `.knip.jsonc`
- `knip.ts`
- `knip.js`
- `knip.config.ts`
- `knip.config.js`
- `package.json` (in the `"knip"` property)

If you want to use a custom file name or path, use the `--config` flag:

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

## Configuration Options

See the [configuration reference documentation][3].

## What's next?

The best way to understand Knip and what it can do for you is to read the pages
in the "Understanding Knip" sections, starting with [entry files][2].

Want to learn more about some of the main features?

- Working with [monorepos & workspaces][4].
- Learn more about [production mode][5].

Having troubles configuring Knip?

- [Configuring project files][1]
- [Handling issues][6]

Search this website using the bar at the top (`Ctrl+K` or `⌘+K`).

[1]: ../guides/configuring-project-files.md
[2]: ../explanations/entry-files.md
[3]: ../reference/configuration.md
[4]: ../features/monorepos-and-workspaces.md
[5]: ../features/production-mode.md
[6]: ../guides/handling-issues.md
