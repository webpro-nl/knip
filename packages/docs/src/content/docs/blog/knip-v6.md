---
title: Announcing Knip v6
date: 2026-03-20
sidebar:
  order: 1
---

_Published: 2026-03-20_

## Knip v6 is out!

This release is all about replacing the TypeScript backend entirely with
`oxc-parser` and `oxc-resolver`, and making Knip a whole lot faster!

## From TypeScript to oxc

Two years ago, the ["slim down to speed up"][1] and [Knip v4][2] work removed a
lot of overhead around TypeScript programs, made serialization and caching
practical, and improved memory efficiency a lot. But there was still a ceiling:
parsing and module resolution still depended on TypeScript APIs designed for
IDEs and language servers — not for the kind of single-pass static analysis Knip
does.

Starting today, Knip v6 parses your source files with [oxc-parser][3]. This is
more than just a parser swap for the sake of using the latest 'n greatest.

Knip has always been designed to parse each file only once, but the TypeScript
backend carried the overhead of wiring up an entire program along with the
typechecker. That's useful for IDEs keeping symbols connected, but much less so
when you only need to traverse an AST once to collect imports and exports.
The TypeScript backend made the setup as a whole harder and slower than it
needed to be, especially to keep large monorepos in check.

Now with TypeScript itself Go-ing places, replacing that backend was only a
matter of time.

Unsurprisingly, the search didn't take long: `oxc-parser` offers everything we
need and its (experimental) raw transfer is crazy fast. Massive props to
[overlookmotel][4], [Boshen][5] and all contributors for all the work on
[the oxc suite][6]!

## Performance tuning

Next to this major refactor, I've been having a ball tuning Knip's performance
further. One thing to highlight here is that a few more plugins have been
refactored to statically analyze configuration files directly, as opposed to
actually importing them (including transitive dependencies...). This includes
the ESLint ("flat config"), tsdown and tsup plugins.

## The numbers

Comparing v5 and v6 in some projects using Knip, all boosts are in the **2-4x** range:

[![venz-chart][8]][7]

Trust me, I could look at this chart all day long! The same numbers in a table:

| Project          | v5.88.0 | v6.0.0 |
| ---------------- | ------: | -----: |
| [astro][9]       |    4.0s |   2.0s |
| [query][10]      |    3.8s |   1.7s |
| [rolldown][11]   |    3.7s |   1.7s |
| [sentry][12]     |   11.0s |   4.0s |
| [TypeScript][13] |    3.7s |   0.9s |

## What's new

- Did I already mention Knip got 2-4x faster?
- Support for TS namespaces (and modules), new issue type `namespaceMembers`:

```ts
export namespace MyNamespace {
  export const myName = 'knip'; // we were ignored in v5,
  export type MyType = string; // yet in v6 we are included
}
```

## Breaking changes

Granted, most of you won't even notice. Here's the list:

- Dropped support for Node.js v18 → Knip v6 requires Node.js v20.19.0 or newer
- Dropped issue type `classMembers`
- Dropped `--include-libs` → this is now the default and only behavior
- Dropped `--isolate-workspaces` → this is now the default and only behavior
- Dropped `--experimental-tags` → use [`--tags`][14]
- In [reporter functions][15], `issues.files` is consistent with other issue shapes. Removed `issues._files`.
- In the [JSON reporter][16], issues are consistently arrays for any issue type. Removed root `files`.

## Editor Extensions

[Editor extensions][17] benefit from the core upgrades, for being faster and more
memory-efficient. Regardless of new extension releases, the local version of
Knip will be detected and used. Upgrade `knip` in your dependencies when you're
ready.

## What about classMembers?

I feel you. Even Knip itself was using it. Until today.

The problem is that the implementation relies on the JS-based `ts.LanguageService`
API that exposes the `findReferences` method. TypeScript v6 is the last JS-based
release, and TypeScript v7 is a full rewrite in Go. I am left wondering if it
ever will be feasible and practical to build such features using primitives
(i.e. not via LSP) in a JS-based CLI (references: [microsoft/typescript-go#455][18],
[@typescript/api][19]). Knip was already pretty unique for even trying this in
a CLI tool.

Not that many projects seem to be using it either:
[github.com search for "classMembers path\:knip.json"][20].

If your project relies on it, feel free to open an issue on GitHub or contact me
and maybe we can work something out. Maybe a separate dedicated tool could work,
or extended support for Knip v5.

## Upgrade today

```sh
npm install -D knip@latest
```

## Deep closing thoughts...

Remember, Knip it before you ship it! Have a great day ☀️

[1]: ./slim-down-to-speed-up.md
[2]: ./knip-v4.mdx
[3]: https://oxc.rs/docs/guide/usage/parser
[4]: https://github.com/overlookmotel
[5]: https://github.com/Boshen
[6]: https://oxc.rs
[7]: https://try.venz.dev/?type=bar&labelX=Knip&labelY=duration+(s)&label=astro&label=query&label=rolldown&label=sentry&label=typescript&l=v5.88.0&l=v6.0.0&data=4*2&data=3.8*1.7&data=3.7*1.7&data=11*4&data=3.7*0.9
[8]: https://cdn.venz.dev/i/chart.svg?pad=0&type=bar&labelX=Knip&labelY=duration+(s)&label=astro&label=query&label=rolldown&label=sentry&label=typescript&l=v5.88.0&l=v6.0.0&data=4*2&data=3.8*1.7&data=3.7*1.7&data=11*4&data=3.7*0.9&theme=dark
[9]: https://github.com/withastro/astro
[10]: https://github.com/TanStack/query
[11]: https://github.com/rolldown/rolldown
[12]: https://github.com/getsentry/sentry
[13]: https://github.com/microsoft/TypeScript
[14]: ../reference/configuration.md#tags
[15]: ../features/reporters.md#custom-reporters
[16]: ../features/reporters.md#json
[17]: ../reference/integrations.md
[18]: https://github.com/microsoft/typescript-go/discussions/455
[19]: https://github.com/microsoft/typescript-go/tree/main/_packages/api
[20]: https://github.com/search?q=classMembers%20path%3Aknip.json&type=code
