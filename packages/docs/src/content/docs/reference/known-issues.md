---
title: Known Issues
---

List of known issues and workarounds for exceptions thrown during a Knip run.

See [handling issues][1] to learn more about dealing with lint issues.

## Exceptions from config files

An exception may be thrown when a Knip plugin loads a JavaScript or TypeScript
configuration file such as `webpack.config.js` or `vite.config.ts`:

```sh
$ knip
Error loading .../vite.config.ts
```

Knip may load such files differently, in a different environment, with missing
environment variables, etcetera. Use `--debug` to locate the cause of the issue
with more details.

Potential workarounds:

- Disable loading the file by overriding the default `config` for that plugin.
  - Example: `vite: { config: [] }`
  - In a monorepo, be more specific like so:
    `workspaces: { "packages/lib": { vite: { config: [] } } }`
  - If this helps, add the file as an `entry` file for static analysis.
- Disable the related plugin.
  - Example: `eslint: false`
  - In a monorepo, be more specific like so:
    `workspaces: { "packages/lib": { eslint: false } }`
  - If this helps, add the file as an `entry` file for static analysis.
- As a last resort, ignore the workspace: `ignoreWorkspaces: ["packages/lib"]`.

## Path aliases in config files

Loading the configuration file (e.g. `cypress.config.ts`) for one of Knip's
plugins may give an error:

```sh
$ knip
Analyzing workspace ....
Error loading .../cypress.config.ts
Reason: Cannot find module '@alias/name'
Require stack:
- .../cypress.config.ts
```

Some tools (such as Cypress and Jest) support using TypeScript path aliases in
the configuration file.

Potential workarounds:

- Rewrite the import in the configuration file to a relative import.
- Use Bun with [knip-bun][2].
- See [exceptions from config files][3] for more potential workarounds.

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [disable the Nx Daemon][4]:

```sh
NX_DAEMON=false knip
```

[1]: ../guides/handling-issues.mdx
[2]: ./cli.md#knip-bun
[3]: #exceptions-from-config-files
[4]: https://nx.dev/concepts/nx-daemon#turning-it-off
