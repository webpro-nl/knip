---
title: Issue Types
description: Every issue type Knip reports, from unused files and dependencies to unused exports, enum and namespace members, with their filter keys.
tableOfContents: false
---

Knip reports the following types of issues:

| Title                                | Description                                                |       | Key                |
| :----------------------------------- | :--------------------------------------------------------- | ----- | :----------------- |
| Unused files                         | Unable to find a reference to this file                    | 🔧    | `files`            |
| Unused dependencies                  | Unable to find a reference to this dependency              | 🔧    | `dependencies`     |
| Unused devDependencies               | Unable to find a reference to this devDependency           | 🔧    | `dependencies`²    |
| Referenced optional peerDependencies | Optional peer dependency is referenced                     |       | `dependencies`²    |
| Unlisted dependencies                | Used dependencies not listed in package.json               |       | `unlisted`         |
| Unlisted binaries                    | Binaries from dependencies not listed in package.json      |       | `binaries`         |
| Unused catalog entries               | Unable to find a reference to this catalog entry           | 🔧    | `catalog`          |
| Unresolved imports                   | Unable to resolve this (import) specifier                  |       | `unresolved`       |
| Unused exports                       | Unable to find a reference to this export                  | 🔧    | `exports`          |
| Unused exported types                | Unable to find a reference to this exported type           | 🔧    | `types`            |
| Exports in used namespace            | Namespace with export is referenced, but not export itself | 🔧 🟠 | `nsExports`        |
| Exported types in used namespace     | Namespace with type is referenced, but not type itself     | 🔧 🟠 | `nsTypes`          |
| Unused exported enum members         | Unable to find a reference to this enum member             | 🔧    | `enumMembers`      |
| Unused exported namespace members    | Unable to find a reference to this namespace member        | 🔧    | `namespaceMembers` |
| Duplicate exports                    | This is exported more than once                            |       | `duplicates`       |
| Circular dependencies                | These files (in)directly import each other at runtime      | 🟠    | `cycles`           |

## Legend

|     | Description                                         |
| --- | :-------------------------------------------------- |
| 🔧  | [Auto-fixable][1] issue types                       |
| 🟠  | Not included by default (include with [filters][2]) |

## Notes

1. When an issue type has zero issues, it is not shown.
2. Including or excluding `dependencies` (via CLI or configuration)
   automatically includes or excludes `devDependencies` and
   `optionalPeerDependencies`. In [rules][3], each key can be set individually.
3. In [strict production mode][4], `devDependencies` are not included.
4. The `types` issue type includes `enum`, `interface` and `type` exports.
5. `cycles` defaults to the `warn` [rule][3] (reported, but not counted as an
   error). Set `rules.cycles` to `error` to fail on circular dependencies.

[1]: ../features/auto-fix.mdx
[2]: ../features/rules-and-filters.md#filters
[3]: ../features/rules-and-filters.md#rules
[4]: ../features/production-mode.md#strict-mode
