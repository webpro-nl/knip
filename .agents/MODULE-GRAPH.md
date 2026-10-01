# Module graph

How knip goes from CLI to report: build one graph of the project's files, then
query it for unused files, exports, and dependencies. Read this before touching
the core graph, the AST walk, or the CLI sequence.

## Mental model

The module graph is a `Map<filePath, FileNode>`. It's built in **one
reachability walk** starting from entry points: read a file, parse it (oxc),
collect its imports/exports, resolve each import to another file, repeat for
newly-reached files. Each node records **forward** edges (what it imports),
**reverse** edges (`importedBy`, who imports it), and its own exports.

Two phases, clean split:

- **Build** populates the graph (parse + traverse + resolve). This is the
  expensive part.
- **Analyze** only _queries_ the graph: never re-parses. "Is this export used?"
  is answered by walking the reverse `importedBy` edges.

It's single-threaded, name-based, and has **no type checker** (oxc only, since
the TypeScript-compiler migration). Export-usage matching details live in
[EXPORTS.md][exports].

## The run

Sequence from [`cli.ts`][cli]:

1. [Create options][opts]: parse argv, load + validate config.
2. [Run][run]:
   1. Normalize config; resolve workspaces.
   2. [Build the graph][build]:
      1. Per workspace: [run enabled plugins][worker] to collect entry points,
         config files, and referenced dependencies; glob entry/project files;
         seed the single shared [`ProjectPrincipal`][principal] (one for all
         workspaces; it owns the paths, resolver, and on-disk cache).
      2. One reachability walk (`ProjectPrincipal.walkAndAnalyze`): per file
         read → oxc parse → [get imports & exports][gie] (oxc visitors) →
         resolve imports → fold into the graph. The cache short-circuits
         read+parse for unchanged files.
      3. [Parse package/shell scripts][bash] for binaries and dependencies.
   3. [Analyze the graph][analyze]:
      1. Unused exports: [`is-referenced`][isref] over `importedBy`, respecting
         [namespaces & members][ns].
      2. Unused files (globbed project files never reached).
      3. [Unused / unlisted dependencies][deputy]; unused catalog entries.
3. [Report][report] (default `symbols` reporter).

## The graph (data structures)

Defined in [`types/module-graph.ts`][types]; assembled in
[`util/module-graph.ts`][graphutil].

`FileNode` (one per reached file):

- `imports.internal`: **forward** edges. `Map<filePath, ImportMaps>`: which
  identifiers this file imports from each internal file.
- `importedBy`: **reverse** index. The aggregated `ImportMaps` of every file
  that imports this one. What the analyze phase walks.
- `exports`: `Map<identifier, Export>` for this file.
- `imports.external` / `unresolved` / `externalRefs`: npm + unresolved specifiers.
- `scripts`, `duplicates`, `internalImportCache` (watch-mode incremental rebuild).

`ImportMaps` is the per-edge usage record: `import` / `importAs` / `importNs` /
`reExport` / `reExportNs` / `reExportAs` (id → source file(s)), plus `refs`
(member / property-access usage like `NS.member`) and `enumerated` (id fully
consumed via `Object.keys`/`values`/`entries`).

`updateImportMap` is the heart of it: as each file is analyzed, it folds that
file's internal imports into **both** the source node's `internal` (forward)
**and** each imported node's `importedBy` (reverse), in a single pass. So the
reverse index is built incrementally during the walk, not in a later step: and
analyze depends on it being complete by the time build finishes.

## Invariants & gotchas

- **One serial walk, one shared `ProjectPrincipal`.** The BFS seeds from entry +
  program paths and grows its `visited`/`resolvedFiles` set _mid-loop_ as imports
  resolve. A worker can't know its full input upfront (relevant to any
  parallelism attempt; see [PERFORMANCE.md][perf]).
- **Reachable ≠ analyzed.** Project files are fully analyzed (exports + refs).
  Files reached only as bare or non-project imports are parsed _just_ to extract
  onward specifiers (`extractSpecifiers`), not analyzed. Three sets to keep
  straight: `projectPaths` (globbed candidates) ⊇ `resolvedFiles` (reached +
  parsed) vs `analyzedFiles` (fully analyzed). Unused files = `projectPaths`
  minus reached.
- **Cache short-circuits read+parse** for unchanged files (`CacheConsultant`).
  Warm runs jump straight to the cached `FileNode`; cold and warm timings differ
  a lot, so benchmark warm runs (see [PERFORMANCE.md][perf]).
- **Analyze never re-parses.** `is-referenced` walks `importedBy` following
  re-export / alias / namespace chains, so a bug in the reverse-index assembly
  surfaces as wrong unused-export results, not a crash.

## Related docs

- [EXPORTS.md][exports]: answering "is this export used?": chain refs, shadowing,
  DTS correctness, `ignoreExportsUsedInFile`. Read it for anything touching
  `is-referenced` or the export visitors.
- [PLUGINS.md][plugins]: how plugins contribute entry points and config.
- [PERFORMANCE.md][perf]: cost map, why the walk is serial, what's load-bearing.

[analyze]: ./packages/knip/src/graph/analyze.ts
[bash]: ./packages/knip/src/binaries/bash-parser.ts
[build]: ./packages/knip/src/graph/build.ts
[cli]: ./packages/knip/src/cli.ts
[deputy]: ./packages/knip/src/DependencyDeputy.ts
[exports]: ./EXPORTS.md
[gie]: ./packages/knip/src/typescript/get-imports-and-exports.ts
[graphutil]: ./packages/knip/src/util/module-graph.ts
[isref]: ./packages/knip/src/graph-explorer/operations/is-referenced.ts
[ns]: ./packages/knip/src/graph-explorer/operations/has-strictly-ns-references.ts
[opts]: ./packages/knip/src/util/create-options.ts
[perf]: ./PERFORMANCE.md
[plugins]: ./PLUGINS.md
[principal]: ./packages/knip/src/ProjectPrincipal.ts
[report]: ./packages/knip/src/reporters/symbols.ts
[run]: ./packages/knip/src/run.ts
[types]: ./packages/knip/src/types/module-graph.ts
[worker]: ./packages/knip/src/WorkspaceWorker.ts
