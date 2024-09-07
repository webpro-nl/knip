---
title: Unsupported
---

This page is an overview of related features Knip does not support.

## Unused variables

Knip doesn't look for unused variables within a file. It looks for exported and
imported values and types.

Use [ESLint][1], [Biome][2] or [oxc][3] to find unused variables within files.

## Unused properties

Knip does not yet support finding unused members of types, interfaces and
objects. This includes returned objects from exported functions and objects
passed as React component props.

Knip does support finding unused members of enums and classes.

## Circular dependencies

Knip has no issues with circular dependencies, and does not report them. Tools
that do support this include [DPDM][4], [Madge][5] and [skott][6].

[1]: https://eslint.org
[2]: https://biomejs.dev
[3]: https://oxc.rs
[4]: https://github.com/acrazing/dpdm
[5]: https://github.com/pahen/madge
[6]: https://github.com/antoine-coulon/skott
