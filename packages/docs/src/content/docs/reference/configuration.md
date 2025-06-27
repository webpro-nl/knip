---
title: Configuration
tableOfContents:
  maxHeadingLevel: 4
---

This page lists all configuration file options.

## FileTypes

### JSON and JSONC

Knip supports a JSON or JSONC (JSON with comments) configuration file. Add the [\`$schema\`](#schema)
to the top of your JSON file to enable validation in your IDE.

### TypeScript

Knip can also use [dynamic and typed configuration files.](https://knip.dev/reference/dynamic-configuration)

### See

[Dynamic Configuration](https://knip.dev/reference/dynamic-configuration)

### Extends

- `TypeOf`\<*typeof* `fileTypesSchema`\>

### Properties

#### $schema?

> `optional` **$schema**: `string`

A `$schema` field is a URL that you put at the top of your JSON file. This
allows you to get red squiggly lines inside of your IDE when you make a typo or
provide an otherwise invalid configuration option.

##### Default

```ts
undefined
```

##### Examples

In JSON, use the provided JSON schema:

```json title="knip.json"
{
  "$schema": "https://unpkg.com/knip@5/schema.json"
}
```

In JSONC, use the provided JSONC schema:
```jsonc title="knip.jsonc"
{
  "$schema": "https://unpkg.com/knip@5/schema-jsonc.json"
}
```

##### Remarks

Use JSONC if you want to use comments and/or trailing commas.

##### Inherited from

`z.TypeOf.$schema`

***

## Project

### Extends

- `TypeOf`\<*typeof* `projectSchema`\>

### Properties

#### entry?

> `optional` **entry**: `string` \| `string`[]

Array of glob patterns to find entry files. Prefix with `!` for negation.

##### Example

```json title="knip.json"
{
  "entry": ["src/index.ts", "scripts/*.ts", "!scripts/except-this-one.ts"]
}
```

##### See

[configuration](https://knip.dev/overview/configuration) and [entry files](https://knip.dev/explanations/entry-files)

##### Inherited from

`z.TypeOf.entry`

#### project?

> `optional` **project**: `string` \| `string`[]

Array of glob patterns to find project files.

##### Example

```json title="knip.json"
{
  "project": ["src/**/*.ts", "scripts/**/*.ts"]
}
```

##### See

[configuration](https://knip.dev/overview/configuration) and [entry files](https://knip.dev/explanations/entry-files)

##### Inherited from

`z.TypeOf.project`

#### paths?

> `optional` **paths**: `Record`\<`string`, `string`[]\>

Tools like TypeScript, webpack and Babel support import aliases in various ways.
Knip automatically includes `compilerOptions.paths` from the TypeScript
configuration, but does not automatically use other types of import aliases.
They can be configured manually:

##### Example

```json title="knip.json"
{
  "paths": {
    "@lib": ["./lib/index.ts"],
    "@lib/*": ["./lib/*"]
  }
}
```

##### Remarks

Each workspace can have its own `paths` configured. Knip `paths` follow the
TypeScript semantics:

- Path values are an array of relative paths
- Paths without an `*` are exact matches

##### Inherited from

`z.TypeOf.paths`

***

## Workspaces

> **Workspaces** = `z.infer`\<*typeof* `workspacesSchema`\>

Individual workspace configurations may contain all other options listed on this
page, except for the following root-only options:

- `exclude` / `include`
- `ignoreExportsUsedInFile`
- `ignoreWorkspaces`
- `workspaces`

Workspaces can't be nested in a Knip configuration, but they can be nested in a
monorepo folder structure.

### See

[Monorepos and workspaces](https://knip.dev/features/monorepos-and-workspaces)

***

## Plugins

> **Plugins** = `z.infer`\<*typeof* `pluginsSchema`\>

There are a few options to modify the behavior of a plugin:

- Override a plugin's `config` or `entry` location
- Force-enable a plugin by setting its value to `true`
- Disable a plugin by setting its value to `false`

### Example

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

### Remarks

It should be rarely necessary to override the `entry` patterns, since plugins
also read custom entry file patterns from the tooling configuration ([Plugins → entry files](https://knip.dev/explanations/plugins#entry-files)).

Plugin configuration can be set on root and on a per-workspace level. If enabled
on root level, it can be disabled on workspace level by setting it to `false`
there, and vice versa.

### See

[Plugins](https://knip.dev/explanations/plugins)

***

## RulesAndFilters

### Extends

- `TypeOf`\<*typeof* `rulesAndFiltersSchema`\>

### Properties

#### rules?

> `optional` **rules**: `Partial`\<`Record`\<`"dependencies"` \| `"exports"` \| `"files"` \| `"devDependencies"` \| `"optionalPeerDependencies"` \| `"unlisted"` \| `"binaries"` \| `"unresolved"` \| `"types"` \| `"nsExports"` \| `"nsTypes"` \| `"duplicates"` \| `"enumMembers"` \| `"classMembers"`, `"error"` \| `"warn"` \| `"off"`\>\>

##### Default

```ts
{}
```

##### See

[Rules & Filters](https://knip.dev/features/rules-and-filters)

##### Inherited from

`z.TypeOf.rules`

#### include?

> `optional` **include**: (`"dependencies"` \| `"exports"` \| `"files"` \| `"devDependencies"` \| `"optionalPeerDependencies"` \| `"unlisted"` \| `"binaries"` \| `"unresolved"` \| `"types"` \| `"nsExports"` \| `"nsTypes"` \| `"duplicates"` \| `"enumMembers"` \| `"classMembers"`)[]

##### Default

```ts
[]
```

##### See

[Rules & Filters](https://knip.dev/features/rules-and-filters)

##### Inherited from

`z.TypeOf.include`

#### exclude?

> `optional` **exclude**: (`"dependencies"` \| `"exports"` \| `"files"` \| `"devDependencies"` \| `"optionalPeerDependencies"` \| `"unlisted"` \| `"binaries"` \| `"unresolved"` \| `"types"` \| `"nsExports"` \| `"nsTypes"` \| `"duplicates"` \| `"enumMembers"` \| `"classMembers"`)[]

##### Default

```ts
[]
```

##### See

[Rules & Filters](https://knip.dev/features/rules-and-filters)

##### Inherited from

`z.TypeOf.exclude`

#### tags?

> `optional` **tags**: `string`[]

Exports can be tagged with known or arbitrary JSDoc/TSDoc tags.

##### Default

```ts
[]
```

##### Examples

```ts
// \**
//  * Description of my exported value
//  *
//  * \@type number
//  * \@internal Important matters
//  * \@lintignore
//  */
export const myExport = 1;
```

And then include (`+`) or exclude (`-`) these tagged exports from the report
like so:

```json
{
  "tags": ["-lintignore"]
}
```

This way, you can either focus on or ignore specific tagged exports with tags
you define yourself. This also works for individual class or enum members.

The default directive is `+` (include) and the `@` prefix is ignored, so the
notation below is valid and will report only exports tagged `@lintignore` or
`@internal`:

```json
{
  "tags": ["@lintignore", "@internal"]
}
```

##### See

[JSDoc & TSDoc Tags](https://knip.dev/reference/jsdoc-tsdoc-tags)

##### Inherited from

`z.TypeOf.tags`

#### treatConfigHintsAsErrors?

> `optional` **treatConfigHintsAsErrors**: `boolean`

Exit with non-zero code (1) if there are any configuration hints.

##### Default

```ts
false
```

##### Example

```json title="knip.json"
{
  "treatConfigHintsAsErrors": true
}
```

##### Inherited from

`z.TypeOf.treatConfigHintsAsErrors`

***

## IgnoreIssues

### Extends

- `TypeOf`\<*typeof* `ignoreIssuesSchema`\>

### Properties

#### ignore?

> `optional` **ignore**: `string` \| `string`[]

:::tip

Please read [project files configuration](https://knip.dev/guides/configuring-project-files) before using the `ignore` option,
because in many cases you'll want to **fine-tune project files** instead.

:::

Array of glob patterns to ignore issues from matching files.

##### Example

```json title="knip.json"
{
  "ignore": ["src/generated.ts", "fixtures/**"]
}
```

##### Inherited from

`z.TypeOf.ignore`

#### ignoreBinaries?

> `optional` **ignoreBinaries**: (`string` \| `RegExp`)[]

Exclude binaries that are used but not provided by any dependency from the
report. Value is an array of binary names or regular expressions.

##### Examples

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

##### Inherited from

`z.TypeOf.ignoreBinaries`

#### ignoreDependencies?

> `optional` **ignoreDependencies**: (`string` \| `RegExp`)[]

Array of package names to exclude from the report. Regular expressions allowed.

##### Examples

```json title="knip.json"
{
  "ignoreDependencies": ["hidden-package", "@org/.+"]
}
```

Actual regular expressions can be used in dynamic configurations.
```ts title="knip.ts"
export default {
  ignoreDependencies: [/@org/.*/, /^lib-.+/],
};
```

##### Inherited from

`z.TypeOf.ignoreDependencies`

#### ignoreMembers?

> `optional` **ignoreMembers**: (`string` \| `RegExp`)[]

Array of class and enum members to exclude from the report. Regular expressions
allowed.

##### Example

```json title="knip.json"
{
  "ignoreMembers": ["render", "on.+"]
}
```

Actual regular expressions can be used in dynamic configurations.

##### Inherited from

`z.TypeOf.ignoreMembers`

#### ignoreUnresolved?

> `optional` **ignoreUnresolved**: (`string` \| `RegExp`)[]

Array of specifiers to exclude from the report. Regular expressions allowed.

##### Examples

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

##### Inherited from

`z.TypeOf.ignoreUnresolved`

#### ignoreWorkspaces?

> `optional` **ignoreWorkspaces**: `string`[]

Array of workspaces to ignore, globs allowed.

##### Example

```json title="knip.json"
{
  "ignoreWorkspaces": [
    "packages/go-server",
    "packages/flat/*",
    "packages/deep/**"
  ]
}
```

##### Inherited from

`z.TypeOf.ignoreWorkspaces`

***

## Exports

### Extends

- `TypeOf`\<*typeof* `exportsSchema`\>

### Properties

#### ignoreExportsUsedInFile?

> `optional` **ignoreExportsUsedInFile**: `boolean` \| `Partial`\<`Record`\<`"function"` \| `"type"` \| `"enum"` \| `"class"` \| `"interface"` \| `"member"`, `boolean`\>\>

In files with multiple exports, some of them might be used only internally. If
these exports should not be reported, there is a `ignoreExportsUsedInFile`
option available. With this option enabled, when something is also no longer
used internally, it will be reported as unused.

##### Default

```ts
false
```

##### Examples

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

##### Inherited from

`z.TypeOf.ignoreExportsUsedInFile`

#### includeEntryExports?

> `optional` **includeEntryExports**: `boolean`

By default, Knip does not report unused exports in entry files. When a
repository (or workspace) is self-contained or private, you may want to include
entry files when reporting unused exports:

##### Default

```ts
false
```

##### Example

```json title="knip.json"
{
  "includeEntryExports": true
}
```

##### Remarks

If enabled, Knip will report unused exports in entry source files. But not in
entry and configuration files as configured by plugins, such as `next.config.js`
or `src/routes/+page.svelte`.

This will also enable reporting unused members of exported classes and enums.

Set this option at root level to enable this globally, or within workspace
configurations individually.

##### Inherited from

`z.TypeOf.includeEntryExports`

***

## Compilers

Knip supports custom compilers to transform files before analysis.

:::note

Since compilers are functions, they can only be used in dynamic configuration
files (`.js` or `.ts`), not in JSON configuration files.

:::

### Extends

- `TypeOf`\<*typeof* `compilersConfigSchema`\>

### Properties

#### compilers?

> `optional` **compilers**: `Record`\<`string`, `true` \| (...`args`) => `string` \| (...`args`) => `Promise`\<`string`\>\>

Override built-in compilers or add custom compilers for additional file types.

##### See

[Compilers](https://knip.dev/features/compilers)

##### Inherited from

`z.TypeOf.compilers`
