---
title: Rules & Filters
sidebar:
  order: 4
---

Use rules or filters to customize Knip's output. This has various use cases, a
few examples:

- Temporarily focus on a specific issue type.
- You don't want to see `type`, `interface` and `enum` exports reported.
- Specific issue types should be printed, but not counted against the total
  error count.

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
knip --include files --exclude classMembers,enumMembers
```

Also see the [list of issue types][1].

### Shorthands

Use the `--dependencies` or `--exports` flag to combine groups of related types:

- The `--dependencies` includes (dev) `dependencies`, `unlisted`, `binaries` and
  `unresolved`
- The `--exports` flag has`exports`, `nsExports`, `classMembers`, `types`,
  `nsTypes`, `enumMembers` and `duplicates`

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

Also see the [issue types overview][1].

The rules are modeled after the ESLint `rules` configuration, and could be
extended in the future.

## Rules or Filters?

Filters are meant to be used as command-line flags, rules allow for more
fine-grained configuration.

- Rules are more fine-grained since they also have "warn".
- Rules could be extended in the future.
- Filters can be set in configuration and from CLI (rules only in
  configuration).
- Filters have shorthands (rules don't have this).

[1]: ../reference/issue-types.md
