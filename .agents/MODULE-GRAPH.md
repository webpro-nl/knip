# Module graph

How knip goes from CLI to report: build one graph of the project's files, then
query it for unused files, exports, and dependencies. Read this before touching
the core graph, the AST walk, or the CLI sequence.

## Mental model

One `ProjectPrincipal` coordinates a growing reachability queue for all
workspaces: read a file, parse it (oxc), collect imports/exports, resolve each
import, and enqueue newly reached files. Eligible plain JS/TS files are analyzed
in bounded native batches; host callbacks and graph ingestion follow queue
order.

There are two graph representations. Normal CLI runs retain a
`Map<filePath, FileNode>` for exports, dependencies, scripts, and reporting, but
ingest internal import edges into the reverse index in Rust's
`NativeProjectGraph`. Sessions, watch, trace, and cycle reporting retain the full
JavaScript graph, with both forward `imports.internal` and reverse `importedBy`
maps. Neither representation uses a type checker.

Two phases, clean split:

- **Build** populates the graph (parse + traverse + resolve). This is the
  expensive part.
- **Analyze** only _queries_ the graph: never re-parses. "Is this export used?"
  is answered by following the reverse import index.

Analysis is name-based. Export-usage matching details live in
[EXPORTS.md][exports].

## The run

Sequence from [`cli.ts`][cli]:

1. [Create options][opts]: parse argv, load + validate config.
2. [Run][run]:
   1. Normalize config; resolve workspaces.
   2. [Build the graph][build]:
      1. Per workspace: [run enabled plugins][worker] to collect entry points,
         config files, and referenced dependencies; [parse package scripts][bash]
         and glob entry/project files; seed the single shared
         [`ProjectPrincipal`][principal] (one for all workspaces; it owns the
         paths, resolver, and on-disk cache).
      2. Initialize the native resolver plan and analysis-cache context after
         workspace/plugin registration. `ProjectPrincipal.walkAndAnalyze`
         submits eligible files to [native batch analysis][batch], which reads,
         parses once, traverses, and resolves in Rust. Cached files and serial
         compiler/fallback paths join the same ordered host processing. The
         injected [per-file resolver API][gie] retains synchronous callbacks.
      3. Enrich each file with dependency, [script][bash], and glob results, then
         ingest its compact internal-edge prefix into the native graph or merge
         the full JavaScript maps. Both paths return imports to the reachability queue.
         Finalize the native graph with the complete entry set before querying.
   3. [Analyze the graph][analyze]:
      1. Unused exports: the [native usage kernel][usage] queries the finalized
         native graph, or a fresh snapshot of the full JavaScript graph's
         `importedBy` maps, respecting namespaces and members. The public
         explorer retains the TypeScript [reference operations][isref].
      2. Unused files (globbed project files never reached).
      3. [Unused / unlisted dependencies][deputy]; unused catalog entries.
3. [Report][report] (default `symbols` reporter).

## The graph (data structures)

The host records are defined in [`types/module-graph.ts`][types]. The full graph
is assembled in [`util/module-graph.ts`][graphutil]; the compact path is bridged
by [`native-graph.ts`][nativegraph] and assembled in Rust.

`FileNode` (analyzed files and imported/reference placeholders):

- `imports.internal`: **forward** edges. `Map<filePath, ImportMaps>`: which
  identifiers this file imports from each internal file, on the full-graph path.
- `importedBy`: **reverse** index. The aggregated `ImportMaps` of every file
  that imports this one, on the full-graph path.
- `exports`: `Map<identifier, Export>` for this file.
- `imports.external` / `unresolved` / `externalRefs`: npm + unresolved specifiers.
- `scripts`, `duplicates`, `internalImportCache` (watch-mode incremental rebuild).

`ImportMaps` is the per-edge usage record: `import` / `importAs` / `importNs` /
`reExport` / `reExportNs` / `reExportAs` (id → source file(s)), plus `refs`
(member / property-access usage like `NS.member`) and `enumerated` (id fully
consumed via `Object.keys`/`values`/`entries`).

On the full-graph path, `updateImportMap` folds each file's imports into both its
forward maps and its targets' reverse maps. `internalImportCache` supports
incremental removal/replacement of those edges.

On the compact path, [`decodeNativeFile`][wire] skips the internal-edge payload
when creating host records: `imports.internal` is empty, `importedBy` and
`internalImportCache` are unset. `NativeProjectGraph.addFile` reads only the
`skipExports`/internal-import prefix of the immutable string-table/`Uint32Array`
record, interns referenced UTF-16 strings, and merges reverse edges in Rust. It
returns internal paths for host placeholders, config-dependency tracking, and
reachability. Exports and other reporting data still decode in JavaScript. The
compact record is detached from the live `FileNode` after ingestion; a cache
entry may retain it independently.

Native ingestion is ordered and incremental, with one addition per file.
`finalize` installs entry paths and prepares usage indexes; queries before
finalization and additions afterward are rejected. This is a one-shot graph,
not the session/watch update model. Both paths require a complete reverse index
before analysis, but neither JavaScript assembly nor a full-graph transfer is
required for normal CLI runs.

## Scheduling and resolver ownership

- The queue takes at most 64 files per batch. Native requests require a project
  file with a default JS/TS extension, no registered compiler, no cached source
  text, and available analysis/workspace options. Cache hits can occupy queue
  slots without native work. Newly discovered paths append to the queue.
- A registered compiler is a serial barrier, even for a cached file. Other
  ineligible files also end a batch. Async compilers finish before later files
  are read; entry/export policy is rechecked before prepared results are used.
- Native batches use at most four execution lanes, bounded by available
  parallelism. Fewer than four requests and WASI use one lane. Resolver cores
  persist across batches; scoped worker threads are created for each parallel
  batch and joined before returning its results.
  Results retain input order; regex validation and graph callbacks run in that
  order on the host. Batch errors, unreadable inputs, and stale prepared policy fall back to
  serial loading/analysis. Cold-file analysis/callback failures remain isolated
  at the walk boundary. The direct per-file API preserves callback exceptions.
- Batching is disabled for sessions, watch, and debug. Debug source-mapping
  callbacks require serial resolution. Trace and cycle reporting select the
  full graph independently of batching.
- [`ResolverCore`][resolver] instances share an `Arc<ResolverPlan>` and native
  resolver backends. The module cache is shared under a mutex; each core has a
  local workspace lookup memo. The `Arc<WorkspacePlan>` owns a shared
  source-mapping memo, including misses, across serial and batch cores. Host
  callback handles stay outside worker cores.
- Resolution observations are recorded only when analysis caching is enabled.
  Each run explicitly resets observation mode. Store-name memos retain their
  original observations separately so reusing them cannot claim a new read or
  contaminate an unrelated run's dependency snapshot.

## Analysis cache

[`GraphCacheConsultant`][cache] stores immutable per-file analysis, before host
graph enrichment. Native entries retain compact records; full-record fallback
entries are cloned. Every hit creates fresh mutable host records, so graph
merges, unresolved-import filtering, external references, and script processing
cannot accumulate in the saved analysis. Unchanged immutable entries need no
rewrite.

Graph caches use one snapshot plus a bounded journal of changed entries and
removals. Checksummed, chained frames reject corrupt or divergent histories.
After 32 updates or the byte limit, an atomic replacement compacts the file.
Unchanged legacy envelopes remain untouched; generic file caches retain their
existing format. Reads still deserialize the complete cache. Failed writes keep
pending changes for retry.

The `root-analysis-v3` cache name is stable for a package version and production
mode. A context hash is stored inside its envelope, not in a new filename for
each configuration. It covers the resolver plan, analysis options, visitors,
workspace manifests/policies, compiler definitions, config paths, and initial
project/entry/program sets. Source entries use size/mtime validation. Separate
resolution-dependency fingerprints cover successful and missing path probes,
symlink targets, and content-bearing config/package files, including tracked
config imports and lockfiles. Context/dependency mismatches reject saved entries.
At reconciliation, incomplete tracking, unavailable fingerprints, or changes to
earlier dependency observations discard records and disable further
reuse/persistence for that cache run.

Normal CLI completion can close a restored, validated, clean cache without
rechecking dependencies. Closure leaves its entire envelope unchanged and
permanently disables reuse and persistence for that instance. Dirty caches,
sessions, and watch still reconcile dependencies before saving.

Custom compilers need an explicit `cacheKey` to reuse persistent analysis;
known source-only built-ins remain eligible. Transitive config dependency
discovery uses a private resolver cache so it cannot prepopulate traversal
memos before compiler barriers. Unknown dependency coverage disables custom
compiler reuse.

Cache representation and cross-file object identity are internal details, not
compatibility contracts. Preserve observable results, ordering, within-file tag
group semantics, and isolation between file analyses and cache restorations.

## Persistent sessions

`createPersistentSession(loadOptions)` serializes updates and recreates options
for structural or JSON configuration changes. The CLI watch adapter uses this
path, watches `options.cwd`, and suppresses repeated events with unchanged file
state. Closing drains the active update and discards queued work.

Eligible modified sources are reanalyzed and compared with their previous import
and export topology. Identical topology preserves reachability and reverse edges;
usage analysis still runs. All registered compilers must be recognized source-only
built-ins. Custom compilers, scripts, import globs, and discovered program or entry
files prevent this shortcut. Other changes rebuild
from fresh source without disk analysis reuse. Unknown paths remain relevant
because custom compilers may read inputs outside the module graph.

Executable configuration dependencies are followed independently of project-file
membership. Changes require a new process, including changes to imported data.
Restart takes precedence across an entire event batch and remains latched.
JSON configuration and manifests reload through the options factory. Rebuilds
invalidate resolver, glob, and persisted gitignore discovery before loading
options. Ordinary plugin entry files are not configuration dependencies merely
because their exports are excluded from reporting.

## Invariants & gotchas

- **One growing walk, ordered commits.** Entry/program seeds and discovered
  imports determine queue order. Bounded native work can run concurrently;
  compiler effects and host graph callbacks must respect the barriers above.
- **Reachable ≠ analyzed.** Project files are fully analyzed (exports + refs).
  Files reached only as bare or non-project imports are parsed _just_ to extract
  onward specifiers (`extractSpecifiers`), not analyzed. Three sets to keep
  straight: `projectPaths` (candidates, including entries), `resolvedFiles`
  (visited, including non-project and unreadable paths), and `analyzedFiles`
  (paths submitted to full analysis, not necessarily successful parses).
  `resolvedFiles` need not be a subset of `projectPaths`. Unused files are
  project candidates never reached, with the ambient-DTS check handled in build.
- **Cache short-circuits read+parse** for unchanged files (`CacheConsultant`).
  Warm runs decode or clone saved analysis and still perform host enrichment
  and graph ingestion. Measure cache and no-cache paths separately (see
  [PERFORMANCE.md][perf]).
- **Analyze never re-parses.** Usage queries walk reverse edges following
  re-export / alias / namespace chains, so a bug in the reverse-index assembly
  surfaces as wrong unused-export results, not a crash.
- **Refresh full-graph snapshots for each analysis.** Watch/session updates mutate
  nodes and reverse maps without changing the graph's identity or size. Build
  the snapshot after graph updates are complete inside each usage-analysis
  invocation.
- **Keep the oracle separate.** `test/reference` holds the original TypeScript
  file analyzer, source visitors, and resolver wrapper using the installed Oxc
  backend. Native differential tests compare complete ordered records, including
  optional fields, positions, fixes, exceptions, and within-file tag groups.
  A global empty-tag singleton across files is historical implementation detail;
  independent analyses now own independent tag sets.
- **Preserve resolver cache lifetimes.** The native backend owner is shared by
  module analysis, raw file resolution, and manifest lookup. Watch clears
  backend and module caches; source-map and package-name caches retain their
  existing lifetimes.

## Related docs

- [EXPORTS.md][exports]: answering "is this export used?": chain refs, shadowing,
  DTS correctness, `ignoreExportsUsedInFile`. Read it for anything touching
  `is-referenced` or the export visitors.
- [PLUGINS.md][plugins]: how plugins contribute entry points and config.
- [PERFORMANCE.md][perf]: historical cost map, native boundaries, measurement gates.

[analyze]: ../packages/knip/src/graph/analyze.ts
[bash]: ../packages/knip/src/binaries/bash-parser.ts
[batch]: ../packages/knip/native/src/resolver/batch.rs
[build]: ../packages/knip/src/graph/build.ts
[cache]: ../packages/knip/src/CacheConsultant.ts
[cli]: ../packages/knip/src/cli.ts
[deputy]: ../packages/knip/src/DependencyDeputy.ts
[exports]: ./EXPORTS.md
[gie]: ../packages/knip/src/native-analyzer.ts
[graphutil]: ../packages/knip/src/util/module-graph.ts
[isref]: ../packages/knip/src/graph-explorer/operations/is-referenced.ts
[nativegraph]: ../packages/knip/src/native-graph.ts
[opts]: ../packages/knip/src/util/create-options.ts
[perf]: ./PERFORMANCE.md
[plugins]: ./PLUGINS.md
[principal]: ../packages/knip/src/ProjectPrincipal.ts
[report]: ../packages/knip/src/reporters/symbols.ts
[resolver]: ../packages/knip/native/src/resolver/mod.rs
[run]: ../packages/knip/src/run.ts
[types]: ../packages/knip/src/types/module-graph.ts
[usage]: ../packages/knip/native/src/graph.rs
[wire]: ../packages/knip/src/native-analyzer-wire.ts
[worker]: ../packages/knip/src/WorkspaceWorker.ts
