---
title: Issue Types
tableOfContents: false
---

Knip reports the following types of issues:

| Title                                | Description                                                |       | Key            |
| :----------------------------------- | :--------------------------------------------------------- | ----- | :------------- |
| Unused files                         | Unable to find a reference to this file                    | 🔧    | `files`        |
| Unused dependencies                  | Unable to find a reference to this dependency              | 🔧    | `dependencies` |
| Unused devDependencies               | Unable to find a reference to this devDependency           | 🔧    | `dependencies` |
| Referenced optional peerDependencies | Optional peer dependency is referenced                     |       | `dependencies` |
| Unlisted dependencies                | Used dependencies not listed in package.json               |       | `unlisted`     |
| Unlisted binaries                    | Binaries from dependencies not listed in package.json      |       | `binaries`     |
| Unresolved imports                   | Unable to resolve this (import) specifier                  |       | `unresolved`   |
| Unused exports                       | Unable to find a reference to this export                  | 🔧    | `exports`      |
| Unused exported types                | Unable to find a reference to this exported type           | 🔧    | `types`        |
| Exports in used namespace            | Namespace with export is referenced, but not export itself | 🔧 🟠 | `nsExports`    |
| Exported types in used namespace     | Namespace with type is referenced, but not type itself     | 🔧 🟠 | `nsTypes`      |
| Unused exported enum members         | Unable to find a reference to this enum member             | 🔧    | `enumMembers`  |
| Unused exported class members        | Unable to find a reference to this class member            | 🔧 🟠 | `classMembers` |
| Duplicate exports                    | This is exported more than once                            |       | `duplicates`   |

## Legend

|     | Description                                         |
| --- | :-------------------------------------------------- |
| 🔧  | [Auto-fixable][1] issue types                       |
| 🟠  | Not included by default (include with [filters][2]) |

## Notes

- When an issue type has zero issues, it is not shown.
- The `devDependencies` and `optionalPeerDependencies` are covered in a single
  key for all `dependencies`. In [strict production mode][3], `devDependencies`
  are not included.
- The `types` issue type includes `enum`, `interface` and `type` exports.

[1]: ../features/auto-fix.mdx
[2]: ../features/rules-and-filters.md#filters
[3]: ../features/production-mode.md#strict-mode
