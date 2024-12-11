---
title: Comparison & Migration
---

First of all, Knip owes a lot to the projects on this page that exist longer and
they've all been inspirational in their own way. For best results, Knip has [a
vision embracing comprehensiveness][1] which is larger in scope than any of the
alternatives. So if any of those tools has the right scope for your
requirements, then by all means, use what suits you best.

All tools have in common that they have less features and don't support the
concept of [monorepos/workspaces][2]. Feel free to send in projects that Knip
does not handle better, Knip loves to be challenged!

## Migration

A migration consists of deleting the dependency and its configuration file and
[getting started with Knip][3]. You should end up with less configuration.

## Comparison

### depcheck

> [Depcheck][4] is a tool for analyzing the dependencies in a project to see:
> how each dependency is used, which dependencies are useless, and which
> dependencies are missing from package.json.

The project has plugins (specials), yet not as many as Knip has and they're not
as advanced. It also supports compilers (parsers) for non-standard files.

The following commands are similar:

```sh
depcheck
knip --dependencies
```

### unimported

> Find and fix dangling files and unused dependencies in your JavaScript
> projects.

[unimported][5] is fast and works well. It works in what Knip calls "production
mode" exclusively. If you're fine with a little bit of configuration and don't
want or need to deal with non-production items (such as `devDependencies` and
test files), then this might work well for you.

The following commands are similar:

```sh
unimported
knip --production --dependencies --files
```

**Project status**: The project is archived and recommends Knip.

### ts-prune

> Find unused exports in a typescript project. 🛀

[ts-prune][6] aims to find potentially unused exports in your TypeScript project
with zero configuration.

The following commands are similar:

```sh
ts-prune
knip --include exports,types,nsExports,nsTypes
```

Use `knip --exports` to also include class and enum members.

**Project status**: The project is archived and recommends Knip.

### ts-unused-exports

> [ts-unused-exports][7] finds unused exported symbols in your Typescript
> project

The following commands are similar:

```sh
ts-unused-exports
knip --include exports,types,nsExports,nsTypes
```

Use `knip --exports` to also include class and enum members.

### tsr

> Remove unused code from your TypeScript Project

[tsr][8] (previously `ts-remove-unused`) removes unused exports, and works based
on a single `tsconfig.json` file (`includes` and `excludes`) and requires no
configuration. It removes the `export` keyword or the whole export declaration.

## Related projects

Additional alternative and related projects include:

- [deadfile][9]
- [DepClean][10]
- [dependency-check][11]
- [find-unused-exports][12]
- [next-unused][13]
- [npm-check][14]
- [renoma][15]

[1]: ./why-use-knip.md#comprehensive
[2]: ../features/monorepos-and-workspaces.md
[3]: ../overview/getting-started.mdx
[4]: https://github.com/depcheck/depcheck
[5]: https://github.com/smeijer/unimported
[6]: https://github.com/nadeesha/ts-prune
[7]: https://github.com/pzavolinsky/ts-unused-exports
[8]: https://github.com/line/tsr
[9]: https://github.com/M-Izadmehr/deadfile
[10]: https://github.com/mysteryven/depclean
[11]: https://github.com/dependency-check-team/dependency-check
[12]: https://github.com/jaydenseric/find-unused-exports
[13]: https://github.com/pacocoursey/next-unused
[14]: https://github.com/dylang/npm-check
[15]: https://github.com/bluwy/renoma
