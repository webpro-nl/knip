---
title: Configuration File
---

This page lists all configuration options (in alphabetical order).

Also see [dynamic configurations][1] in case you need more flexibility to
configure Knip.

## JSON Schema

A `$schema` field is a URL that you put at the top of your JSON file. This
allows you to get red squiggly lines inside of your IDE when you make a typo or
provide an otherwise invalid configuration option.

In JSON, you can use the provided JSON schema:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@4/schema.json"
}
```

In JSONC, you can use the provided JSONC schema:

```json title="knip.jsonc"
{
  "$schema": "https://unpkg.com/knip@4/schema-jsonc.json"
}
```

Use JSONC if you want to use comments and/or trailing commas.

## Types

In TypeScript, you can use the `KnipConfig` type:

```ts title="knip.ts"
import type { KnipConfig } from 'knip';

const config: KnipConfig = {};

export default config;
```

## `entry`

Array of glob patterns to find entry files. Prefix with `!` for negation.
Example:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts", "!scripts/except-this-one.ts"]
}
```

See [configuration][2] and [entry files][3].

## `exclude`

See [Rules & Filters][4].

## `ignore`

Array of glob patterns to ignore issues from matching files. Example:

```json title="knip.json"
{
  "ignore": ["src/generated.ts", "fixtures/**"]
}
```

- Use negated patterns in `entry` and `project` glob patterns to prevent
  matching files from being added to the analysis.
- Use `ignore` patterns to exclude issues in matching files from being reported.

## `ignoreBinaries`

Array of binaries to exclude from the report. Regular expressions allowed.
Example:

```json title="knip.json"
{
  "ignoreBinaries": ["zip", "docker-compose"]
}
```

Actual regular expressions can be used in dynamic configurations.

## `ignoreDependencies`

Array of package names to exclude from the report. Regular expressions allowed.
Example:

```json title="knip.json"
{
  "ignoreDependencies": ["hidden-package", "@org/.*"]
}
```

Actual regular expressions can be used in dynamic configurations:

```ts title="knip.ts"
export default {
  ignoreDependencies: [/@org\/.*/, /^lib-.*/],
};
```

## `ignoreExportsUsedInFile`

In files with multiple exports, some of them might be used only internally. If
these exports should not be reported, there is a `ignoreExportsUsedInFile`
option available. With this option enabled, you don't need to mark everything
`@public` separately and when something is no longer used internally, it will
still be reported.

```json title="knip.json"
{
  "ignoreExportsUsedInFile": true
}
```

In a more fine-grained manner, you can also ignore only specific issue types:

```json title="knip.json"
{
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

## `ignoreWorkspaces`

Array of workspaces to ignore, globs allowed. Example:

```json title="knip.json"
{
  "ignoreWorkspaces": ["packages/ignore", "packages/examples/**"]
}
```

## `include`

See [Rules & Filters][4].

## `includeEntryExports`

By default, Knip does not report unused exports in entry files. When a
repository (or workspace) is self-contained or private, you may want to include
entry files when reporting unused exports:

```json title="knip.json"
{
  "includeEntryExports": true
}
```

If enabled, Knip will report unused exports in entry source files and scripts
such as those referenced in `package.json`. But not in entry and configuration
files as configured by plugins, such as `next.config.js` or
`src/routes/+page.svelte`.

This will also enable reporting unused members of exported classes and enums.

Set this option at root level to enable this globally, or within workspace
configurations individually.

## `paths`

Tools like TypeScript, webpack and Babel support import aliases in various ways.
Knip automatically includes `compilerOptions.paths` from the TypeScript
configuration, but does not automatically use other types of import aliases.
They can be configured manually:

```json title="knip.json"
{
  "paths": {
    "@lib": ["./lib/index.ts"],
    "@lib/*": ["./lib/*"]
  }
}
```

Each workspace can have its own `paths` configured. Knip `paths` follow the
TypeScript semantics:

- Path values are an array of relative paths.
- Paths without an `*` are exact matches.

## Plugins

There are a few options to modify the behavior of a plugin:

- Override a plugin's `config` or `entry` location
- Force-enable a plugin by setting its value to `true`
- Disable a plugin by setting its value to `false`

```json title="knip.json"
{
  "mocha": {
    "config": "config/mocha.config.js",
    "entry": ["**/*.spec.js"]
  },
  "playwright": true,
  "webpack": false
}
```

It should be rarely necessary to override the `entry` patterns, since plugins
also read custom entry file patterns from the tooling configuration (see
[Plugins → entry files][5]).

Plugin configuration can be set on root and on a per-workspace level. If enabled
on root level, it can be disabled on workspace level by setting it to `false`
there, and vice versa.

Also see [Plugins][6].

## `project`

Array of glob patterns to find project files. Example:

```json title="knip.json"
{
  "project": ["src/**/*.ts", "scripts/**/*.ts"]
}
```

See [configuration][2] and [entry files][3].

## `rules`

See [Rules & Filters][4].

## `workspaces`

Workspaces may contain the options listed on this page, except for the following
root-only options:

- `exclude` / `include`
- `ignoreExportsUsedInFile`
- `ignoreWorkspaces`
- `workspaces`

Workspaces can't be nested in configuration, but they can be nested in folder
structure.

See [Monorepos and workspaces][7].

[1]: ../reference/dynamic-configuration.mdx
[2]: ../overview/configuration.md
[3]: ../explanations/entry-files.md
[4]: ../features/rules-and-filters.md#filters
[5]: ../explanations/plugins.md#entry-files
[6]: ../explanations/plugins.md
[7]: ../features/monorepos-and-workspaces.md
