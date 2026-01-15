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
environment variables, missing path aliases, etcetera. Use `--debug` to locate
the cause of the issue with more details.

Potential workarounds:

- [Set path aliases][2] for "Cannot find module" errors
- Set missing environment variable(s)
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
- Inject support with a module like `tsx`: `NODE_OPTIONS="--import tsx" knip`
- Or `tsconfig-paths`: `NODE_OPTIONS="--import tsconfig-paths/register.js" knip`
- Use Bun with [knip-bun][3].
- See [exceptions from config files][4] for more potential workarounds.

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [disable the Nx Daemon][5]:

```sh
NX_DAEMON=false knip
```

[1]: ../guides/handling-issues.mdx
[2]: #path-aliases-in-config-files
[3]: ./cli.md#knip-bun
[4]: #exceptions-from-config-files
[5]: https://nx.dev/concepts/nx-daemon#turning-it-off
