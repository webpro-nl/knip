---
title: Unused exports
description: Find and remove unused exports with Knip
prev: false
next: false
---

Finding unused exports in your JavaScript and TypeScript projects is one of
Knip's core features. And it comes with even more features to identify and
remove clutter to keep your projects in great shape.

## Why are unused exports a problem?

Having unused exports in your codebase is problematic for several reasons:

- They increase bundle sizes if not properly eliminated by tree-shaking.
- They clutter the codebase and make it harder to navigate and understand.
- They mislead developers into thinking certain code is used when it's not.
- They make refactoring and maintaining the codebase more difficult.
- They slow down tooling that analyze the codebase, such as bundlers, linters
  and type checkers.
- They may represent dead code that is no longer needed but hasn't been cleaned
  up.

## How do I find unused exports?

Knip is a powerful tool that can help you find and remove unused exports in your
JavaScript and TypeScript projects. It analyzes the codebase, identifies exports
that are not imported anywhere, and reports them.

[Get started and install Knip][1] to run it on your project. Knip will scan your
files and provide a detailed report of unused exports, and much more.

<div style="display: flex; justify-content: center; margin: 4rem auto;">
  <img src="/logo.svg" alt="Logo of Knip, to find unused files, dependencies and exports" class="logo-border" />
</div>

## How does Knip identify unused exports?

Knip performs both static and dynamic analysis to determine which exports are
actually being used in your codebase. It looks at import statements, export
usage, and [a lot more code patterns][2] to identify unused exports.

Knip supports JavaScript and TypeScript projects, and handles both [CommonJS][3]
and ES Modules syntax.

## Can Knip remove unused exports?

Yes, Knip not only finds unused exports but can also remove them for you. Run
Knip with the `--fix` flag to enable [the auto-fix feature][4], and it will
modify your source code and remove the unused exports.

It's always recommended to review the changes made by Knip before committing
them to ensure no unintended modifications were made.

## Can Knip handle large codebases?

Absolutely. Knip supports [monorepos with workspaces][5] and utilizes [workspace
sharing][6] to efficiently analyze large monorepos. This makes it easier and
more fun to manage and optimize large multi-package projects.

## Does Knip work with my favorite editor or IDE?

Knip is a command-line tool that runs independently of your editor or IDE.
However, if you run Knip inside an integrated IDE terminal, the report contains
file names and positions in a format IDEs like VS Code and WebStorm understand
to easily navigate around.

## How is Knip different from ESLint for finding unused exports?

While linters like ESLint can find unused variables and imports within
individual files, Knip analyzes the entire project to determine which exports
are actually unused. By building [a comprehensive module graph][7], Knip
identifies exports that are not imported or used anywhere in the codebase. This
allows Knip to catch unused exports and dead code that ESLint and other linters
would miss.

Also see [Why isn't Knip an ESLint plugin?][8]

[1]: ../overview/getting-started.mdx
[2]: ../reference/faq.md#what-does-knip-look-for-in-source-files
[3]: ../guides/working-with-commonjs.md
[4]: ../features/auto-fix.mdx
[5]: ../features/monorepos-and-workspaces.md
[6]: ../guides/performance.md#workspace-sharing
[7]: ../reference/faq.md#whats-in-the-graphs
[8]: ../reference/faq.md#why-isnt-knip-an-eslint-plugin
