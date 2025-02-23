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
to locate the cause of the issue with more details. Sometimes the issue is a
missing environment variable. As a last resort, the [plugin can be disabled][5].

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
- Use Bun with [knip-bun][6].
- [Disable the plugin][5] (not recommended, try the other options first).

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [disable the Nx Daemon][7]:

```sh
NX_DAEMON=false knip
```

[1]: #exceptions-from-config-files
[2]: #false-positives-with-external-libs
[3]: #definitely-typed-packages-in-dependencies
[4]: #extensionless-imports
[5]: ./configuration.md#plugins
[6]: ./cli.md#knip-bun
[7]: https://nx.dev/concepts/nx-daemon#turning-it-off
