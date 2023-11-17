---
title: Configuration File
---

This page lists all configuration options (in alphabetical order).

Also see [dynamic configurations](../reference/dynamic-configuration.mdx) in
case you need more flexibility to configure Knip.

## JSON Schema

In JSON, you can use the provided JSON Schema:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@canary/schema.json"
}
```

## Types

In TypeScript, you can use the `KnipConfig` type:

```ts title="knip.ts"
import type { KnipConfig } from 'knip';

const config: KnipConfig = {};

export default config;
```

## `entry`

See [configuration][1] and [entry files][2].

## `exclude`

See [Rules & Filters][3].

## `ignore`

Array of glob patterns to ignore files. Example:

```json title="knip.json"
{
  "ignore": ["**/fixtures"]
}
```

## `ignoreBinaries`

Array of binaries to ignore, no wildcards allowed. Example:

```json title="knip.json"
{
  "ignoreBinaries": ["zip", "docker-compose"]
}
```

## `ignoreDependencies`

Array of package names to ignore, no wildcards allowed. Example:

```json title="knip.json"
{
  "ignoreDependencies": ["hidden-package"]
}
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

See [Rules & Filters][3].

## `includeEntryExports`

By default, Knip does not report unused exports in entry files. Use this option
to enable this globally, or per workspace.

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
[Plugins → entry files][4]).

Plugin configuration can be set on root and on a per-workspace level. If enabled
on root level, it can be disabled on workspace level by setting it to `false`
there, and vice versa.

Also see [Plugins][5].

## `project`

See [configuration][1] and [entry files][2].

## `workspaces`

Workspaces may contain the options listed on this page, except for the following
root-only options:

- `exclude` / `include`
- `ignoreExportsUsedInFile`
- `ignoreWorkspaces`
- `workspaces`

Workspaces can't be nested in configuration, but they can be nested in folder
structure.

See [Monorepos and workspaces][6].

[1]: ../overview/configuration.md
[2]: ../explanations/entry-files.md
[3]: ../features/rules-and-filters.md#filters
[4]: ../explanations/plugins.md#entry-files
[5]: ../explanations/plugins.md
[6]: ../features/monorepos-and-workspaces.md
