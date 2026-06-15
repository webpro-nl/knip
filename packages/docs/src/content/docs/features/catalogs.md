---
title: Catalogs
description: How Knip finds unused pnpm, Yarn and Bun catalog entries referenced through the `catalog:` protocol, and removes them with auto-fix.
---

Catalogs let you define dependency version ranges once and reference them across
workspaces in a monorepo. Knip reports catalog entries that are defined but no
longer referenced, and can remove them with [auto-fix][1].

## Supported catalogs

Knip reads catalogs from the first applicable location:

- `pnpm-workspace.yaml` — the `catalog` (default) and `catalogs` (named) keys
- `.yarnrc.yml` — the `catalog` and `catalogs` keys
- `package.json` — the `catalog` and `catalogs` keys
- `package.json#workspaces` — the `catalog` and `catalogs` keys (Bun)

## Unused catalog entries

A catalog entry is reported as unused when no workspace references it through
the `catalog:` protocol in its `package.json`:

```json title="packages/app/package.json"
{
  "dependencies": {
    "react": "catalog:",
    "zod": "catalog:validation"
  }
}
```

`catalog:` references the `default` catalog, while `catalog:validation`
references the named `validation` catalog. References are resolved from
`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`,
`resolutions` and `pnpm.overrides`.

Entries defined in a catalog but not referenced anywhere are reported as [unused
catalog entries][2].

## Filter and fix

The `catalog` issue type is included by the [`--dependencies`][3] shortcut.
Focus on it (or exclude it) like any other issue type:

```sh
knip --include catalog
knip --exclude catalog
```

[Auto-fix][1] removes unused catalog entries from the catalog file:

```sh
knip --fix --fix-type catalog
```

[1]: ./auto-fix.mdx#catalog-entries
[2]: ../reference/issue-types.md
[3]: ./rules-and-filters.md#shorthands
