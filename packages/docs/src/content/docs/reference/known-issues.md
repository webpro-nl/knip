---
title: Known Issues
---

This page contains a list of known issues you might run into when using Knip.

## Exceptions from config files

An exception may be thrown when a Knip plugin loads a JavaScript or TypeScript
configuration file such as `webpack.config.js` or `vite.config.ts`. Knip may
load such files differently, in a different environment, or without certain
environment variables set.

If it isn't clear what's throwing the exception, try another run with `--debug`
to locate the cause of the issue with more details. Sometimes the issue is a
missing environment variable. As a last resort, the [plugin can be disabled][1].

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
- Use Bun with [knip-bun][2].
- [Disable the plugin][1] (not recommended, try the other options first).

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [disable the Nx Daemon][3]:

```sh
cross-env NX_DAEMON=false knip
```

[1]: ./configuration.md#plugins
[2]: ./cli.md#knip-bun
[3]: https://nx.dev/concepts/nx-daemon#turning-it-off
