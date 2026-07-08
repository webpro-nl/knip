---
title: Rules & Filters
description: Customize Knip's output with `--include`/`--exclude` filters, shorthand flags and `rules` to set issue types to error, warn or off.
---

Use rules or filters to customize Knip's output. This has various use cases, a
few examples:

- Temporarily focus on a specific issue type.
- You don't want to see unused `type`, `interface` and `enum` exports reported.
- Specific issue types should be printed, but not counted against the total
  error count.

If you're looking to handle one-off exceptions, also see [JSDoc tags][1].

## Filters

You can `--include` or `--exclude` any of the reported issue types to slice &
dice the report to your needs. Alternatively, they can be added to the
configuration (e.g. `"exclude": ["dependencies"]`).

Use `--include` to report only specific issue types. The following example
commands do the same:

```sh
knip --include files --include dependencies
knip --include files,dependencies
```

Or the other way around, use `--exclude` to ignore the types you're not
interested in:

```sh
knip --include files --exclude enumMembers,duplicates
```

The `nsExports` and `nsTypes` types are [off by default][2]. Including only
those _adds_ them to the default report, rather than narrowing it to just those.

Also see the [list of issue types][3].

### Shorthands

Knip has shortcuts to report only specific issue types.

1. The `--dependencies` flag includes:
   - `dependencies` (and `devDependencies` + `optionalPeerDependencies`)
   - `unlisted`
   - `binaries`
   - `unresolved`
   - `catalog`

2. The `--exports` flag includes:
   - `exports`
   - `types`
   - `enumMembers`
   - `namespaceMembers`
   - `duplicates`

3. The `--files` flag is a shortcut to report only unused files.

4. The `--cycles` flag is a shortcut to report only circular dependencies.

## Rules

Use `rules` in the configuration to customize the issue types that count towards
the total error count, or to exclude them altogether.

| Value     | Default | Printed | Counted | Description                       |
| :-------- | :-----: | :-----: | :-----: | :-------------------------------- |
| `"error"` |   ✓ ¹   |    ✓    |    ✓    | Similar to the `--include` filter |
| `"warn"`  |    -    |    ✓    |    -    | Printed in faded/gray color       |
| `"off"`   |    -    |    -    |    -    | Similar to the `--exclude` filter |

Example:

```json title="knip.json"
{
  "rules": {
    "files": "warn",
    "duplicates": "off"
  }
}
```

Notes:

- ¹ Exception: the `cycles` issue type is a warning by default.
- If the `dependencies` issue type is included, the `devDependencies` and
  `optionalPeerDependencies` types can still be set to `"warn"` separately.
- The rules are modeled after the ESLint `rules` configuration, and could be
  extended in the future.

Also see the [issue types overview][3].

## Rules or filters?

Filters are meant to be used as command-line flags, rules allow for more
fine-grained configuration.

- Rules are more fine-grained since they also have "warn".
- Rules could be extended in the future.
- Filters can be set in configuration and from CLI (rules only in
  configuration).
- Filters have shorthands (rules don't have this).

[1]: ../reference/jsdoc-tsdoc-tags.md
[2]: ../guides/namespace-imports.md
[3]: ../reference/issue-types.md
