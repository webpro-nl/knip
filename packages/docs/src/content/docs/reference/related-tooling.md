---
title: Related Tooling
description: Tools that complement Knip for things it does not cover, like unused imports and variables, and unused properties of objects and types.
---

This is an overview of related tooling for features Knip does not support.

## Unused imports & variables

Knip doesn't look for unused imports and variables within a file. The focus is
on exported values and types across files.

Use [ESLint][1], [Biome][2] or [oxlint][3] to find unused variables within
files.

Use [remove-unused-vars][4] to remove unused code within files, but in a more
valiant way. Using input from any of the above linters, it actually removes a
lot more unused code. This pairs great with Knip.

## Unused properties

Knip does not yet support finding unused members of types, interfaces and
objects. This includes returned objects from exported functions and objects
passed as React component props.

Knip does support finding unused members of enums and classes, and exported
values and types on imported namespaces.

## Circular dependencies

Knip reports circular dependencies as an opt-in [`cycles`][5] issue type. The
[editor integrations][6] show cyclic paths directly in IDE.

Other dedicated tools include [DPDM][7], [Madge][8] and [skott][9]. Linters such
as ESLint have similar plugins and rules, e.g. the `eslint-plugin-import-x`
plugin has the [import-x/no-cycle][10] and oxlint has the [import/no-cycle][11]
rule.

## Cleanup

The [e18e.dev][12] website and in particular the [Cleanup][13] section is a
great resource when dealing with technical debt.

[1]: https://eslint.org
[2]: https://biomejs.dev/linter/
[3]: https://oxc.rs/docs/guide/usage/linter.html
[4]: https://github.com/webpro-nl/remove-unused-vars
[5]: ./issue-types.md
[6]: ./integrations.md#circular-dependencies
[7]: https://github.com/acrazing/dpdm
[8]: https://github.com/pahen/madge
[9]: https://github.com/antoine-coulon/skott
[10]: https://github.com/un-ts/eslint-plugin-import-x/blob/master/docs/rules/no-cycle.md
[11]: https://oxc.rs/docs/guide/usage/linter/rules/import/no-cycle.html
[12]: https://e18e.dev
[13]: https://e18e.dev/guide/cleanup.html
