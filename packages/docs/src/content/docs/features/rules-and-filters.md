---
title: Rules & Filters
sidebar:
  order: 4
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

Also see the [list of issue types][2].

### Shorthands

Knip has shortcuts to include only specific issue types.

1. The `--dependencies` flag includes:

   - `dependencies` (and `devDependencies` + `optionalPeerDependencies`)
   - `unlisted`
   - `binaries`
   - `unresolved`

2. The `--exports` flag includes:

   - `exports`
   - `types`
   - `enumMembers`
   - `duplicates`

3. The `--files` flag is a shortcut for `--include files`

## Rules

Use `rules` in the configuration to customize the issue types that count towards
the total error count, or to exclude them altogether.

| Value     | Default | Printed | Counted | Description                       |
| :-------- | :-----: | :-----: | :-----: | :-------------------------------- |
| `"error"` |    ✓    |    ✓    |    ✓    | Similar to the `--include` filter |
| `"warn"`  |    -    |    ✓    |    -    | Printed in faded/gray color       |
| `"off"`   |    -    |    -    |    -    | Similar to the `--exclude` filter |

Example:

```json title="knip.json"
{
  "rules": {
    "files": "warn",
    "classMembers": "off",
    "duplicates": "off"
  }
}
```

Also see the [issue types overview][2].

NOTE: If the `dependencies` issue type is included, the `devDependencies` and
`optionalPeerDependencies` types can still be set to `"warn"` separately.

The rules are modeled after the ESLint `rules` configuration, and could be
extended in the future.

## Rules or filters?

Filters are meant to be used as command-line flags, rules allow for more
fine-grained configuration.

- Rules are more fine-grained since they also have "warn".
- Rules could be extended in the future.
- Filters can be set in configuration and from CLI (rules only in
  configuration).
- Filters have shorthands (rules don't have this).

[1]: ../reference/jsdoc-tsdoc-tags.md
[2]: ../reference/issue-types.md
