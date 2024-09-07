---
title: Known Issues
---

This page contains a list of known issues you might run into when using Knip.

## The CJS build of Vite's Node API is deprecated

```
The CJS build of Vite's Node API is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
```

Only a warning, but can be suppressed by setting the `VITE_CJS_IGNORE_WARNING`
environment variable:

```
VITE_CJS_IGNORE_WARNING=true knip
```

## Config files using ESM features

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
...
TypeError: Reflect.metadata is not a function
...
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in [...]/node_modules/estree-walker/package.json
```

This is caused by Knip using [jiti][1] to load and execute TypeScript
configuration files that contains ESM syntax (such as top-level await), which
may incorrectly consider it as CommonJS (instead of not transforming ESM).

Potential workarounds:

- Turn the configuration file from TS into JS (e.g. `vitest.config.ts` →
  `vitest.config.js`). Knip loads modules directly using native `import()`
  calls.
- Use Bun with [knip-bun][2].
- [Disable the plugin][3] (not recommended, try the other options first).

Use `knip --debug` in a monorepo to help locate where the error is coming from.

Issues like [#72][4] and [#194][5] are hopefully fixed in [jiti v2][6]. By the
way, nothing but love for jiti (it's awesome).

[GitHub Issue #565][7]

## Path aliases in config files

Loading the configuration file (e.g. `cypress.config.ts`) for one of Knip's
plugins may give an error:

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
- Use Bun with [knip-bun][2].
- [Disable the plugin][3] (not recommended, try the other options first).

## False positives with external libs

Knip may report false positives when exports are consumed by external libraries.

Please see [external libs][8].

## Definitely Typed packages in `dependencies`

Knip is strict in the divide between `dependencies` and `devDependencies`. Some
projects are published with one or more DT packages bundled. Knip does not make
exceptions for such DT packages (`@types/*`) listed in `dependencies`.

## Extensionless imports

Knip does not support extensionless imports for non-standard extensions, such as
for `.svg` files. Bundlers like Webpack may support this, but Knip does not.
Examples:

```ts title="App.vue"
import Component from './Component'; // → Should resolve to ./Component.vue
import ArrowIcon from '../icons/Arrow'; // → Does NOT resolve to ../icons/Arrow.svg
```

The recommendation is to add the extension when importing such files, similar to
how standard ES Modules work.

[1]: https://github.com/unjs/jiti
[2]: ./cli.md#knip-bun
[3]: ./configuration.md#plugins
[4]: https://github.com/unjs/jiti/issues/72
[5]: https://github.com/unjs/jiti/issues/194
[6]: https://github.com/unjs/jiti/issues/174
[7]: https://github.com/webpro-nl/knip/issues/565
[8]: ../guides/handling-issues.mdx#external-libraries
