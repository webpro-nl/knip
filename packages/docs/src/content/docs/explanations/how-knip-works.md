---
title: How Knip works
description: The mental model behind Knip. How entry files, the module graph and reachability decide what counts as unused, and why surprising results trace back to them.
---

Knip finds and removes unused code and dependencies. It starts at your entry
files, follows every import to the files they reach, and builds a graph of
everything connected. Anything left out is reported as unused: a file no entry
reaches, an export no file imports, a dependency no file uses.

This page explains how Knip produces its results.

## Build and analyze

Knip runs in two phases.

The build phase starts from the entry files. Knip reads a file, parses it,
collects its imports and exports, resolves each import to another file, and
repeats for every newly reached file. The result is a graph of the project:
every reachable file, what it imports, and what imports it.

Resolution is broad by design. Knip follows custom path aliases and extensions,
reads references out of config files and [shell scripts][1], and "[compiles][2]"
non-standard files like `.vue` and `.svelte` so their imports are in the graph
too.

The analysis phase queries that graph. It never re-parses anything. It walks the
edges already recorded:

- a **file** is unused when no entry reaches it
- an **export** is unused when no other file imports it
- a **dependency** is unused when no file imports it (and _unlisted_ when a file
  imports it but `package.json` doesn't list it)

Analysis happens by quering the graph. Your results are only as accurate as the
graph is complete. And the graph depends on your entry files.

## Entry files decide what Knip can see

The graph contains only what's reachable from an entry file. Miss one entry, and
everything reachable _only_ from it looks unused.

Ideally you don't need to list entries by hand. Knip starts from sensible
[defaults][3] like `src/index.ts`, and [plugins][4] automatically add the entry
points specific to your frameworks and libraries. The Vitest plugin adds your
test files, the Astro plugin adds your pages, and so on. This is why plugins are
important: each one tells Knip about a whole class of files it might otherwise
never reach.

## Findings come in chains

Unused results cascade. They don't appear in isolation. Say a tool generates an
entry file Knip doesn't know about:

- that file looks unused, because nothing reaches it
- every file it imports looks unused too, because nothing else reaches them
- every export in those files looks unused
- every dependency only those files used looks unused

One unreached entry can turn into dozens of findings. The chain also runs in
reverse: add the entry, and the whole cascade collapses at once.

So read the output from the root down: **unused files first, then exports, then
dependencies.** A single unused file usually explains a long list of results
below it. Fix causes at the root and the rest disappears.

## A surprising result might be a gap, not a bug

When Knip flags something you're sure is used, it's based on the graph: it
couldn't reach that code from an entry. The cause is usually one of:

- a missing entry for a tool or convention Knip doesn't know yet
- a dynamic import Knip can't follow statically, or a path it can't resolve
- a transitive dependency of a package that resolves only because something else
  installs it

In each case the fix is to teach Knip: add the entry, configure the plugin, list
the dependency. Don't hide the result. [Configuring project files][5] and
[resolving reported issues][6] cover how, issue type by issue type.

[1]: ../features/script-parser.md
[2]: ../features/compilers.md
[3]: ./entry-files.md
[4]: ./plugins.md
[5]: ../guides/configuring-project-files.md
[6]: ../guides/handling-issues.mdx
