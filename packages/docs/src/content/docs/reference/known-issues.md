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
the configuration file. Jiti does support aliases, but in a different format
compared to `tsconfig.json#compilerOptions.paths` and `knip.json#paths` (e.g.
the target values are not arrays).

Potential workarounds:

- Rewrite the import in the configuration file to a relative import.
- Use Bun with [knip-bun][5].
- [Disable the plugin][6] (not recommended, try the other options first).

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [turn off the Nx Daemon][7]:

```sh
NX_DAEMON=false knip
```

## False positives with external libs

Knip may report false positives when exports are consumed by external libraries.

Please see [external libs][8].

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

## `unplugin-icons` imports

[unplugin-icons][9] uses aliased imports to import icons from icon sets as
components. Knip cannot resolve these imports and will report them as unused.
Use the [`paths` configuration option][10] to tell Knip where to find the icon
types. For example:

```json title="knip.json"
{
  "paths": {
    "~icons/*": ["node_modules/unplugin-icons/types/[framework].d.ts"]
  }
}
```

Where `[framework]` is the name of the framework you're using (see [available
types][11]).

[1]: #exceptions-from-config-files
[2]: #false-positives-with-external-libs
[3]: #definitely-typed-packages-in-dependencies
[4]: #extensionless-imports
[5]: ./cli.md#knip-bun
[6]: ./configuration.md#plugins
[7]: https://nx.dev/concepts/nx-daemon#turning-it-off
[8]: ../guides/handling-issues.mdx#external-libraries
[9]: https://github.com/antfu/unplugin-icons
[10]: ./configuration.md#paths
[11]: https://github.com/unplugin/unplugin-icons/tree/main/types
