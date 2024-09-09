---
title: Unused dependencies
description: Find and remove unused dependencies with Knip
prev: false
next: false
---

One of Knip's core features is finding unused dependencies in your JavaScript
and TypeScript projects. And it comes with many more features to remove clutter
and keep your projects in great shape.

## Why are unused dependencies a problem?

Having unused dependencies in your `package.json` is an issue for various
reasons:

- They might end up in the final production bundle, increasing size and load
  times for end users.
- They waste space in `node_modules` and add to the installation time of the
  project.
- They slow down tooling such as linters and bundlers that analyze dependencies.
- They are confusing and noisy in `package.json`.
- They cause unnecessary extra work when managing and upgrading dependencies.
- They can cause version conflicts with other dependencies in use.
- They can cause false security alerts.
- They might have restrictive licenses and make your project subject to theirs.
- They usually come with transitive dependencies that have the same issues.

## How do I find unused dependencies?

Use Knip to find and remove unused dependencies. It also finds dependencies that
are missing in `package.json` and has a lot more features to keep your
JavaScript and TypeScript projects tidy.

It's easy to [get started][1] and make package management easier and more fun!

<div style="display: flex; justify-content: center; margin: 4rem auto;">
  <img src="/logo.svg" alt="Logo of Knip, to find unused files, dependencies and exports" class="logo-border" />
</div>

## How does Knip identify unused dependencies?

Knip works by analyzing `package.json` files, source code and configuration
files for other tooling in the project to find unused and missing dependencies.
Knip has many heuristics, [plugins][2] and [compilers][3] to fully automate the
process.

## Can Knip remove unused dependencies?

Yes, Knip can automatically remove unused dependencies installed by a package
manager like npm or pnpm for you. Add the `--fix` argument to [auto-fix][4] and
remove unused dependencies from `package.json`.

## Can Knip detect missing dependencies?

Yes, Knip detects missing dependencies. It analyzes `package.json` files, and
reports packages that are missing. They should be added to `package.json` to
avoid relying on transitive dependencies that can cause version mismatches and
breakage.

## Does Knip work with monorepos?

Yes, Knip has first-class support for [monorepos and workspaces][5]. It analyzes
all workspaces in the project and understands their relationship.

For instance, if a dependency is listed in the root `package.json` it does not
need to be listed in other workspaces. Except if you enable `--strict` checking.

## Does Knip separate dependencies and devDependencies?

Yes, Knip understands the difference between dependencies and devDependencies.
It has a [production mode][6] to focus on production code only and find dead
code and dependencies that would otherwise only be referenced by tests and other
tooling. This allows you to remove both unused exported code and their tests.

## Does Knip work with my package manager?

Yes, Knip works with any package manager: npm, pnpm, Bun and Yarn are all
supported. It's easy to [get started][1] with any package manager.

[1]: ../overview/getting-started.mdx
[2]: ../reference/plugins.md
[3]: ../features/compilers.md
[4]: ../features/auto-fix.mdx
[5]: ../features/monorepos-and-workspaces.md
[6]: ../features/production-mode.md
