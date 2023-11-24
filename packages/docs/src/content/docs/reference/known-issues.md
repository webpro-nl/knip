---
title: Known Issues
---

This page contains a list of known issues when running Knip.

## TS config files using ESM features

Knip may fail when a plugin tries to load a configuration file written in
TypeScript with an error message like one of these:

```sh
SyntaxError: Cannot use 'import.meta' outside a module
...
SyntaxError: await is only valid in async functions and the top level bodies of modules
...
SyntaxError: missing ) after argument list
```

This is caused by Knip using [jiti][1] to load and execute your configuration
files with the `.ts` (or `.mts` or `.cts`) extension, which may incorrectly
consider it as CommonJS (instead of ESM).

Potential workarounds:

- Turn the configuration file from TS into JS (e.g. `vitest.config.ts` →
  `vitest.config.js`). Knip loads modules directly using native `import()`
  calls. This is the recommended workaround.
- Add the config file to the list of [ignore][2] patterns.
- [Disable the plugin][3].

If necessary, you can use `knip --debug` to locate where the error is coming
from.

The issue is hopefully fixed in [jiti v2][4]. By the way, nothing but love for
jiti (it's awesome).

## Reflect.metadata is not a function

Similar to the previous known issue, this is caused through (not by) jiti:

```sh
TypeError: Reflect.metadata is not a function
```

[GitHub Issue #355](https://github.com/webpro/knip/issues/355)

[1]: https://github.com/unjs/jiti
[2]: ./configuration.md#ignore
[3]: ./configuration.md#plugins
[4]: https://github.com/unjs/jiti/issues/174
