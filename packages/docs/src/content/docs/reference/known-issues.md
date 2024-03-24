---
title: Known Issues
---

This page contains a list of known issues when running Knip.

## TS config files using ESM features

Knip may fail when a plugin tries to load a TypeScript configuration file (e.g.
`vite.config.ts`) with an error message like one of these:

```
SyntaxError: Cannot use 'import.meta' outside a module
...
SyntaxError: await is only valid in async functions and the top level bodies of modules
...
SyntaxError: missing ) after argument list
...
SyntaxError: Unexpected identifier 'Promise'
```

This is caused by Knip using [jiti][1] to load and execute TypeScript
configuration files that contains ESM syntax (such as top-level await), which
may incorrectly consider it as CommonJS (instead of not transforming ESM).

Potential workarounds:

- Turn the configuration file from TS into JS (e.g. `vitest.config.ts` →
  `vitest.config.js`). Knip loads modules directly using native `import()`
  calls. This is the recommended workaround.
- Use Bun: `bunx --bun knip` (Bun will execute the scripts instead of jiti)
- [Disable the plugin][2].

Use `knip --debug` in a monorepo to help locate where the error is coming from.

Issues like [#72][3] and [#194][4] are hopefully fixed in [jiti v2][5]. By the
way, nothing but love for jiti (it's awesome).

[GitHub Issue #346][6]

## Reflect.metadata is not a function

Similar to the previous known issue, this is caused through (not by) jiti:

```sh
TypeError: Reflect.metadata is not a function
```

[GitHub Issue #355][7]

## Path aliases in config files

```
Analyzing workspace ....
Error loading .../cypress.config.ts
Reason: Cannot find module '@alias/name'
Require stack:
- .../cypress.config.ts
```

Some tools (such as Cypress and Jest) support using TypeScript path aliases in
the configuration file. Unfortunately jiti does not seem to support this.

Potential workarounds:

- Rewrite the import the configuration to a relative import.
- Use Bun: `bunx --bun knip` (Bun will execute the scripts instead of jiti)

## False positives with external libs

Knip can report false positives when exports are consumed by external libraries.

Please see [external libs](../guides/handling-issues.mdx#external-libs).

## Definitely Typed packages in `dependencies`

Knip is strict in the divide between `dependencies` and `devDependencies`. Some
projects are published with one or more Definitely Typed packages (`@types/*`)
bundled. Knip does not detect/report such DT packages that are expected to be
listed in `dependencies`.

[1]: https://github.com/unjs/jiti
[2]: ./configuration.md#plugins
[3]: https://github.com/unjs/jiti/issues/72
[4]: https://github.com/unjs/jiti/issues/194
[5]: https://github.com/unjs/jiti/issues/174
[6]: https://github.com/webpro/knip/issues/346
[7]: https://github.com/webpro/knip/issues/355
