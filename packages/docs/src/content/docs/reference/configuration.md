---
title: Configuration
---

This page lists all configuration file options.

## File Types

### JSON Schema

A `$schema` field is a URL that you put at the top of your JSON file. This
allows you to get red squiggly lines inside of your IDE when you make a typo or
provide an otherwise invalid configuration option.

In JSON, use the provided JSON schema:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@5/schema.json"
}
```

### JSONC

In JSONC, use the provided JSONC schema:

```json title="knip.jsonc"
{
  "$schema": "https://unpkg.com/knip@5/schema-jsonc.json"
}
```

Use JSONC if you want to use comments and/or trailing commas.

### TypeScript

See [dynamic configuration][1] about dynamic and typed configuration files.

## Project

### `entry`

Array of glob patterns to find entry files. Prefix with `!` for negation.
Example:

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts", "!scripts/except-this-one.ts"]
}
```

Also see [configuration][2] and [entry files][3].

### `project`

Array of glob patterns to find project files. Example:

```json title="knip.json"
{
  "project": ["src/**/*.ts", "scripts/**/*.ts"]
}
```

Also see [configuration][2] and [entry files][3].

### `workspaces`

Individual workspace configurations may contain all other options listed on this
page, except for the following root-only options:

- `exclude` / `include`
- `ignoreExportsUsedInFile`
- `ignoreWorkspaces`
- `workspaces`

Workspaces can't be nested in a Knip configuration, but they can be nested in a
monorepo folder structure.

Also see [Monorepos and workspaces][4].

### `paths`

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

### Plugins

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

## Rules & Filters

### `rules`

See [Rules & Filters][7].

### `include`

See [Rules & Filters][7].

### `exclude`

See [Rules & Filters][7].

## Ignore Issues

### `ignore`

:::tip

Please read [project files configuration][8] before using the `ignore` option,
because in many cases you'll want to **exclude project files** instead.

:::

Array of glob patterns to ignore issues from matching files. Example:

```json title="knip.json"
{
  "ignore": ["src/generated.ts", "fixtures/**"]
}
```

### `ignoreBinaries`

Exclude binaries that are used but not provided by any dependency from the
report. Value is an array of binary names or regular expressions. Example:

```json title="knip.json"
{
  "ignoreBinaries": ["zip", "docker-compose", "pm2-.+"]
}
```

Actual regular expressions can be used in dynamic configurations:

```ts title="knip.ts"
export default {
  ignoreBinaries: [/^pm2-.+/],
};
```

### `ignoreDependencies`

Array of package names to exclude from the report. Regular expressions allowed.
Example:

```json title="knip.json"
{
  "ignoreDependencies": ["hidden-package", "@org/.+"]
}
```

Actual regular expressions can be used in dynamic configurations:

```ts title="knip.ts"
export default {
  ignoreDependencies: [/@org\/.*/, /^lib-.+/],
};
```

### `ignoreMembers`

Array of class and enum members to exclude from the report. Regular expressions
allowed. Example:

```json title="knip.json"
{
  "ignoreMembers": ["render", "on.+"]
}
```

Actual regular expressions can be used in dynamic configurations.

### `ignoreUnresolved`

Array of specifiers to exclude from the report. Regular expressions allowed.
Example:

```json title="knip.json"
{
  "ignoreUnresolved": ["ignore-unresolved-import", "#virtual/.+"]
}
```

Actual regular expressions can be used in dynamic configurations:

```ts title="knip.ts"
export default {
  ignoreUnresolved: [/^#/.+/],
};
```

### `ignoreWorkspaces`

Array of workspaces to ignore, globs allowed. Example:

```json title="knip.json"
{
  "ignoreWorkspaces": [
    "packages/go-server",
    "packages/flat/*"
    "packages/deep/**"
  ]
}
```

## Exports

### `ignoreExportsUsedInFile`

In files with multiple exports, some of them might be used only internally. If
these exports should not be reported, there is a `ignoreExportsUsedInFile`
option available. With this option enabled, when something is also no longer
used internally, it will be reported as unused.

```json title="knip.json"
{
  "ignoreExportsUsedInFile": true
}
```

In a more fine-grained manner, to ignore only specific issue types:

```json title="knip.json"
{
  "ignoreExportsUsedInFile": {
    "interface": true,
    "type": true
  }
}
```

### `includeEntryExports`

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

[1]: ../reference/dynamic-configuration.mdx
[2]: ../overview/configuration.md
[3]: ../explanations/entry-files.md
[4]: ../features/monorepos-and-workspaces.md
[5]: ../explanations/plugins.md#entry-files
[6]: ../explanations/plugins.md
[7]: ../features/rules-and-filters.md#filters
[8]: ../guides/configuring-project-files.md
