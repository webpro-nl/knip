---
title: Configuration
description: config
---

## Defaults

Knip has good defaults and aims for no or minimal configuration. This is a
simplified version of the default configuration:

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

Run Knip without any configuration to see if a configuration file with custom
`entry` and `project` file patterns is necessary.

:::

## Location

This is where Knip looks for a configuration file:

- `knip.json`
- `knip.jsonc`
- `.knip.json`
- `.knip.jsonc`
- `knip.ts`
- `knip.js`
- `knip` in `package.json`

Use `--config path/to/knip.config.json` for a different file path.

## Customize

If your project structure does not match the default `entry` and `project`
files, you can customize them. Here's an example configuration to include `.js`
files in the `scripts` folder:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@3/schema.json",
  "entry": ["src/index.ts", "scripts/{build,create}.js"],
  "project": ["src/**/*.ts", "scripts/**/*.js"]
}
```

If you override the `entry` file patterns, you may also want to override
`project` file patterns. Project files are used to determine what files are
unused.

The values you set override the default values, they are not merged.

:::tip

Be specific with `entry` files. Minimize the number of entry files and wildcards
for better results.

:::

In the example above, the file `scripts/build.js` might be referenced like so:

```json title="package.json"
{
  "name": "my-package",
  "scripts": {
    "build": "node scripts/build.js"
  }
}
```

In that case, Knip will automatically add it as an entry file. Learn more about
this in the next page about [entry files][1].

## What's Next?

The best way to understand Knip and what it can do for you is to read the pages
in the "Understanding Knip" sections, starting with [entry files][1]. Otherwise,
here's what you might be looking for:

- Find [more options to configure Knip][2].
- Learn more about [production mode][3].
- Read about working with [monorepos & workspaces][4].

:::caution[Too much output?]

In large codebases, Knip may give a lot of output and it feels daunting to start
configuration. In that case, you can jump straight to [handling issues][5].

:::

[1]: ../explanations/entry-files.md
[2]: ../reference/configuration.md
[3]: ../features/production-mode.md
[4]: ../features/monorepos-and-workspaces.md
[5]: ../guides/handling-issues.md
