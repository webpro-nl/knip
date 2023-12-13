---
title: Issue Types
tableOfContents: false
---

Knip reports the following types of issues:

| Title                                | Description                                   |     | Key            |
| :----------------------------------- | :-------------------------------------------- | --- | :------------- |
| Unused files                         | Unable to find a ref to this file             |     | `files`        |
| Unused dependencies                  | Unable to find a ref to this dependency       | 🔧  | `dependencies` |
| Unused devDependencies               | Unable to find a ref to this devDependency    | 🔧  | `dependencies` |
| Referenced optional peerDependencies | Optional peer dependency is referenced        |     | `dependencies` |
| Unlisted dependencies                | Used dependencies not listed in package.json  |     | `unlisted`     |
| Unlisted binaries                    | Binaries from deps not listed in package.json |     | `binaries`     |
| Unresolved imports                   | Unable to resolve this (import) specifier     |     | `unresolved`   |
| Unused exports                       | Unable to find a ref to this export           | 🔧  | `exports`      |
| Unused exports in namespaces         | Unable to find direct a ref to this export    |     | `nsExports`    |
| Unused exported types                | Unable to find a ref to this exported type    | 🔧  | `types`        |
| Unused exported types in namespaces  | Unable to find direct a ref to this export    |     | `nsTypes`      |
| Unused exported enum members         | Unable to find a ref to this enum member      |     | `enumMembers`  |
| Unused exported class members        | Unable to find a ref to this class member     |     | `classMembers` |
| Duplicate exports                    | This is exported more than once               |     | `duplicates`   |

- ref = reference

When an issue type has zero issues, it is not shown.

🔧 Issue types are [auto-fixable][1].

The `devDependencies` and `optionalPeerDependencies` are covered in a single key
for all `dependencies`. In [strict production mode][2], `devDependencies` are
not included.

The `types` issue type includes `enum`, `interface` and `type` exports.

[1]: ../features/auto-fix.mdx
[2]: ../features/production-mode.md#strict-mode
