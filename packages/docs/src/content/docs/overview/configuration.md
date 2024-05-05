---
title: Configuration
description: config
---

## Defaults

Knip has good defaults and aims for "zero config". But sometimes Knip will need
some help to not report incorrect things.

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

Run Knip without any configuration to see if a configuration file with custom
`entry` and `project` file patterns is necessary. You might need to [configure
project files][1].

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

Use `--config path/to/knip.json` for a different file path.

## Customize

Maybe your project structure does not match the default `entry` and `project`
files. Here's an example custom configuration to include `.js` files in the
`scripts` folder:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/index.ts", "scripts/{build,create}.js"],
  "project": ["src/**/*.ts", "scripts/**/*.js"]
}
```

If you override the `entry` file patterns, you may also want to override
`project` file patterns. The set of project files is used to determine what
files are unused.

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
- Using a framework like Astro, Svelte or Nuxt? See [compilers][4] to include
  `.astro` or `.vue` files.
- Learn more about [production mode][5].

Having troubles configuring Knip?

- [Configuring project files][1]
- [Handling issues][6]

This website can be searched using the search bar at the top (`Ctrl+/` or
`Ctrl+K`)

[1]: ../guides/configuring-project-files.md
[2]: ../explanations/entry-files.md
[3]: ../features/monorepos-and-workspaces.md
[4]: ../features/compilers.md
[5]: ../features/production-mode.md
[6]: ../guides/handling-issues.md
