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
the configuration file. Jiti does support aliases, but in a different format
compared to `tsconfig.json#compilerOptions.paths` and `knip.json#paths` (e.g.
the target values are not arrays).

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
