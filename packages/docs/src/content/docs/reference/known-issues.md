---
title: Known Issues
---

This page contains a list of known issues you might run into when using Knip:

- [Exceptions from config files][1]
- [False positives with external libs][2]
- [DefinitelyTyped packages in dependencies][3]
- [Extensionless imports][4]

## Exceptions from config files

An exception may be thrown when a Knip plugin loads a JavaScript or TypeScript
configuration file such as `webpack.config.js` or `vite.config.ts`. Knip may
load such files differently, in a different environment, or without certain
environment variables set.

If it isn't clear what's throwing the exception, try another run with `--debug`
to locate the cause of the issue with more details.

### The CJS build of Vite's Node API is deprecated

```
The CJS build of Vite's Node API is deprecated. See https://vitejs.dev/guide/troubleshooting.html#vite-cjs-node-api-deprecated for more details.
```

Only a warning, but can be suppressed by setting the `VITE_CJS_IGNORE_WARNING`
environment variable:

```
VITE_CJS_IGNORE_WARNING=1 knip
```

### Config files using ESM features

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

This is caused by Knip using [jiti][5] to load and execute TypeScript
configuration files that contains ESM syntax (such as top-level await), which
may incorrectly consider it as CommonJS (instead of not transforming ESM).

Potential workarounds:

- Turn the configuration file from TS into JS (e.g. `vitest.config.ts` →
  `vitest.config.js`). Knip loads modules directly using native `import()`
  calls.
- Use Bun with [knip-bun][6].
- [Disable the plugin][7] (not recommended, try the other options first).

Use `knip --debug` in a monorepo to help locate where the error is coming from.

Issues like [#72][8] and [#194][9] are hopefully fixed in [jiti v2][10]. By the
way, nothing but love for jiti (it's awesome).

[GitHub Issue #565][11]

### Path aliases in config files

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

- Rewrite the import in the configuration file to a relative import.
- Use Bun with [knip-bun][6].
- [Disable the plugin][7] (not recommended, try the other options first).

## False positives with external libs

Knip may report false positives when exports are consumed by external libraries.

Please see [external libs][12].

## Definitely Typed packages in `dependencies`

Knip is strict in the divide between `dependencies` and `devDependencies`. Some
packages are published with one or more DT packages bundled (i.e. listed in
`dependencies`). Knip does not make exceptions for such type packages
(`@types/*`) and expects them in `devDependencies`.

## Extensionless imports

Knip does not support extensionless imports for some non-standard extensions,
such as for `.svg` files. Bundlers like Webpack may support this, but Knip does
not. Examples:

```ts title="App.vue"
import Component from './Component'; // → Should resolve to ./Component.vue
import ArrowIcon from '../icons/Arrow'; // → Does NOT resolve to ../icons/Arrow.svg
```

The recommendation is to always add the extension when importing such files,
similar to how standard ES Modules work.

[1]: #exceptions-from-config-files
[2]: #false-positives-with-external-libs
[3]: #definitely-typed-packages-in-dependencies
[4]: #extensionless-imports
[5]: https://github.com/unjs/jiti
[6]: ./cli.md#knip-bun
[7]: ./configuration.md#plugins
[8]: https://github.com/unjs/jiti/issues/72
[9]: https://github.com/unjs/jiti/issues/194
[10]: https://github.com/unjs/jiti/issues/174
[11]: https://github.com/webpro-nl/knip/issues/565
[12]: ../guides/handling-issues.mdx#external-libraries
