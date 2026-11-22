---
title: Known Issues
description: Known limitations and workarounds for caching, config file errors, path aliases in config files, and the Nx daemon.
---

Known limitations and workarounds for errors during a Knip run.

See [handling issues][1] to learn more about dealing with lint issues.

## Exceptions from config files

Knip plugins may fail to load a JavaScript or TypeScript configuration file such
as `webpack.config.js` or `vite.config.ts`:

```sh
$ knip
ERROR: Error loading vite.config.ts
```

Knip exits with code `2` when a plugin config file fails to load.
`--no-exit-code` does not suppress this error.

Knip may load such files differently, in a different environment, with missing
environment variables, missing path aliases, etcetera. Use `--debug` to locate
the cause of the issue with more details.

Potential workarounds:

- For "Cannot find module" and "ENOENT: no such file/dir, open './file'" errors:
  - Install dependencies
  - Use absolute paths, e.g. with `path.join()` or `path.resolve()`
  - [Set path aliases][2]
- Set missing environment variable(s), potential solutions:
  - Use a helper package like [dotenvx][3]
  - `KEY=VAL knip`
  - `node --env-file .env $(which knip)`
- Run the build script to generate required files.
- Disable loading the file by overriding the default `config` for that plugin.
  - Example: `vite: { config: [] }`
  - In a monorepo, be more specific like so: `workspaces: { "packages/lib": {
vite: { config: [] } } }`
  - If this helps, add the file as an `entry` file for static analysis.
- Disable the related plugin.
  - Example: `eslint: false`
  - In a monorepo, be more specific like so: `workspaces: { "packages/lib": {
eslint: false } }`
  - If this helps, add the file as an `entry` file for static analysis.
- As a last resort, ignore the workspace: `ignoreWorkspaces: ["packages/lib"]`.

## Unhandled rejections from config files

A configuration file may start asynchronous work that fails without a `catch` or
`await`. Knip reports the rejection, still prints its results and exits with
code `2`:

```sh
$ knip
ERROR: Unhandled rejection, likely from apps/docs/next.config.mjs (Build failed with 1 error:)
ERROR: Please fix or visit https://knip.dev/reference/known-issues
```

The named file is the one Knip was loading or whose work was still running. When
a dependency shared between config files causes the rejection, another file may
be named.

Sometimes updating the dependency that causes the rejection might help. For
example, upgrading `fumadocs-mdx` to v15.2.1 or later resolved the reported
case.

See [exceptions from config files][4] for more potential workarounds.

Note that `--no-exit-code` does not suppress this error.

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
- Use Bun with [knip-bun][5].
- See [exceptions from config files][4] for more potential workarounds.

## Nx Daemon

In Nx projects you might encounter this error:

```sh
NX   Daemon process terminated and closed the connection
```

The solution is to [disable the Nx Daemon][6]:

```sh
NX_DAEMON=false knip
```

## Raw transfer memory errors

On machines with low RAM or Windows with Node.js >=22, oxc-parser raw transfer
may fail under memory pressure:

```sh
RangeError: Array buffer allocation failed
```

Disable raw transfer to use the normal parser path:

```sh
KNIP_DISABLE_RAW_TRANSFER=1 knip
```

## Stale cache results

With `--cache`, configuration or path alias changes may leave results stale. An
import may still be reported as unresolved after the missing file is added.
Newly added `.gitignore` files are also not detected automatically.

Run without `--cache` for fresh results, or delete the cache directory
(`node_modules/.cache/knip` by default, configurable with `--cache-location`)
before running with `--cache` again.

[1]: ../guides/handling-issues.mdx
[2]: #path-aliases-in-config-files
[3]: https://dotenvx.com/
[4]: #exceptions-from-config-files
[5]: ./cli.md#knip-bun
[6]: https://nx.dev/concepts/nx-daemon#turning-it-off
