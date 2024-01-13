---
title: Performance
---

This page describes a few topics around Knip's performance, and how you might
improve it.

Knip does not want to tell you how to structure files or how to write your code,
but it might still be good to understand inefficient patterns for Knip.

## Star Imports and Barrel Files

Knip builds up a simplified graph of imports and exports and can quickly match
them against each other to find unused exports. However, there might not be a
literal match for exports that are imported using the `import *` syntax. In this
case, Knip will ask the TypeScript compiler to find references, which is a lot
more work. More levels of re-exports and star imports are more expensive.

Barrel files with re-exports look like this:

```ts
export * from './model';
export * from './util';
```

Example of a star import:

```ts
import * as MyNamespace from './helpers';
```

Use the `--performance` flag to see how often [`findReferences`][1] is used and
how much time is spent there.

This article explains the issue in more detail: [Speeding up the JavaScript
ecosystem - The barrel file debacle][2]. The conclusion: "Get rid of all barrel
files".

## Workspace Sharing

Knip shares files from separate workspaces if the configuration in
`tsconfig.json` allows this. This reduces memory consumption and run duration.
The relevant compiler options are `baseUrl` and `paths`, and a workspace is
shared if the following is true:

- The `compilerOptions.baseUrl` is not set explicitly
- There are no conflicting keys in `compilerOptions.paths`

With the `--debug` flag you can see how many programs Knip uses. Look for
messages like this:

```sh
...
[*] Installed 2 programs for 29 workspaces
...
[*] Analyzing used resolved files [P1/1] (123)
...
[*] Analyzing used resolved files [P1/2] (8)
...
[*] Analyzing used resolved files [P2/1] (41)
...
```

The first number in `P1/1` is the number of the program, the second number
indicates additional entry files were found in the previous round so it does
another round of analysis on those files.

## findReferences

The `findReferences` function (from the TypeScript Language Service) is invoked
for exported class members. If finding unused class members is enabled, use the
`--performance` flag to see how many times this function is invoked and how much
time is spent there:

```sh
knip --include classMembers --performance
```

The first invocation (per program) is especially expensive, as TypeScript sets
up symbols and caching.

## A Last Resort

In case Knip is unbearable slow (or even crashes), you could resort to [lint
individual workspaces][4].

[1]: #findreferences
[2]: https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/
[3]: #star-imports-and-barrel-files
[4]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
