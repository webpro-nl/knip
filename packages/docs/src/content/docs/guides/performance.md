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

Use the [`--performance` flag](../reference/cli.md#--performance) to see how
often `findReferences` is used and how much time is spent there.

This article explains the issue in more detail: [Speeding up the JavaScript
ecosystem - The barrel file debacle][1]. The conclusion: "Get rid of all barrel
files".

## Workspace Sharing

Knip "bundles" files from separate workspaces into a single TypeScript program
if the configuration in `tsconfig.json` allows. This saves memory and time. The
relevant compiler options are `baseUrl` and `paths`:

- If the `compilerOptions.baseUrl` is not set explicitly
- If there are no conflicting keys in `compilerOptions.paths`

With the `--debug` flag you can see how many programs Knip uses. Look for
messages like this:

```sh
...
[*] Installed 2 principals for 29 workspaces
...
[*] Analyzing used resolved files [P1/1] (123)
...
[*] Analyzing used resolved files [P1/2] (8)
...
[*] Analyzing used resolved files [P2/1] (41)
...
```

The first number in `P1/1` is the number of the program, the second number
indicates additional entry files were found in and added to the same program
during the first round.

## GitIgnore

Knip looks up `.gitignore` files and uses them to filter out matching entry and
project files. This increases correctness. Your project may have multiple
`.gitignore` files across all folders. It slows down finding files using glob
patterns and in some cases significantly.

You might want see if it's possible to disable that with `--no-gitignore` and
enjoy a performance boost.

To help determine whether this trade-off might be worth it for you, first check
the difference in unused files:

```sh
diff <(knip --no-gitignore --include files) <(knip --include files)
```

And to measure the difference of this flag in seconds:

```sh
SECONDS=0; knip > /dev/null; t1=$SECONDS; SECONDS=0; knip --no-gitignore > /dev/null; t2=$SECONDS; echo "Difference: $((t1 - t2)) seconds"
```

Analysis on a sample large project went down from 33 to 9 seconds (that's >70%
faster).

## A Last Resort

In case Knip is unbearable slow (or even crashes), you could resort to [lint
individual workspaces][2].

[1]: https://marvinh.dev/blog/speeding-up-javascript-ecosystem-part-7/
[2]: ../features/monorepos-and-workspaces.md#lint-a-single-workspace
