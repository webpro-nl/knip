# Knip performance reference

Current architecture and historical performance work on knip core: native
boundaries, measured experiments, correctness constraints, and measurement
requirements. Historical results below describe their original implementations;
they do not establish the performance of the current checkout. For the earlier
numbers and commits, see the source docs in §10.

## 0. Current state

The native rewrite performs parsing, traversal, source-plugin analysis, module
resolution, and export-usage queries in Rust. Normal CLI runs batch eligible
plain JS/TS source reads and analysis in Rust and ingest compact import records
directly into a native reverse graph. They skip JavaScript internal-edge maps
and the later full-graph snapshot transfer. Configuration, compiler execution,
ordered host enrichment, export/dependency records, and reporting remain in the
host. Sessions, watch, trace, and cycle reporting retain the full JavaScript
graph. See [MODULE-GRAPH.md](./MODULE-GRAPH.md) for the exact mode boundaries.

Internal representation and ownership changes are allowed. Design the Rust path
around the work and data it needs; preserve observable behavior and meaningful
performance gains, rather than accidental JavaScript object topology. Measure
the delivered path, including queue preparation, native reads and analysis,
result decoding, host callbacks, graph ingestion, cache validation, and reporting.
Faster native kernels alone do not establish a CLI speedup. The original file
analyzer and resolver in `test/reference` are independent differential oracles.

The graph cache stores immutable compact per-file analysis in a stable
`root-analysis-v3` file per version/mode. Context and resolution-dependency
fingerprints live in its envelope; hits decode fresh host records before graph
enrichment. Config, project, entry, and program membership is sorted only for
the cache key, so discovery order cannot invalidate otherwise reusable records.
Execution order and reporting order remain unchanged. Unchanged entries avoid rewrites. At normal CLI completion, a clean
cache restored with validated dependencies closes without another dependency
scan or fingerprint. It preserves the old envelope byte-for-byte and cannot
reopen; dirty caches, sessions, and watch retain full reconciliation. Large
observation sets validate with up to four native lanes inside each separately
locked file and probe phase; small sets and WASI remain serial. Bun uses
its direct serializer for this buffer-free payload; generic caches retain
`node:v8` serialization to preserve Buffer restoration. Serializer
byte/shared-record tests describe that
specific serialization boundary, not a requirement to preserve old graph-cache
layout or cross-file tag identities.

Small dirty updates append changed records to a bounded graph-cache journal
instead of serializing every entry. Compaction and initial population remain
whole-cache writes; reads still deserialize the full snapshot and its updates.
Measure unchanged hits, one-file edits, and compaction separately. Byte and
serialization savings do not establish a CLI speedup.

Persistent sessions can retain reachability and reverse edges for eligible
source edits with unchanged import/export topology. Built-in compilers known to
depend only on source text permit this reuse. Custom compilers and structural
edits require fresh rebuilding. Measure edit latency separately from
initialization and CLI startup, and compare each updated result against a fresh
analysis. CLI watch uses the same session path.

Async globs with `gitignore: false` can reuse validated empty results. The first
empty crawl stores only a hint; the next crawl fingerprints directories before
reading and validates them afterward. Later hits revalidate directory identity
and timestamps, including canonical paths, without using the positive-result
mtime memo. Failed reads and noncanonical paths remain ineligible. Empty cache
hits return fresh arrays because plugins may append paths. Watch resets clear
both hints and entries. The extra validation is deferred to avoid slowing the
first cached run.

Before the rewrite, the measured implementations exhausted several obvious
cold-run levers. Earlier reports put warm runs at roughly 2× faster than early
2026, mostly from caching. Those experiments failed their bar or regressed:

- JavaScript worker threads and child-process forks with per-file JS allocation.
- An `oxc_semantic` sidecar that reparsed files while retaining the JS walk.
- Glob fan-out consolidation: falsified. Resolution dedup: near-floor.

These results motivated the fused native implementation; they do not rule out
native batching, shared resolver plans, or compact graph ingestion. Remeasure
the current phase breakdown before selecting another optimization. This guide
records no new timing result for those changes.

## 1. Where time goes

Before the native rewrite, large-repository profiles showed these costs in
rough order. These explain the original design decisions; they are not a
current native phase breakdown:

1. **Parse + traverse + module-graph build** (the `walkAndAnalyze` loop). The
   dominant phase. Per file: read, native oxc parse, JS visitor walk, resolve
   each import. It's serial and single-threaded, and peak memory lives here. On
   a big monorepo the time splits roughly evenly across native parse, module
   resolution, the JS visitor walk, and per-file record building.
2. **Unused-detection analysis** (walking the reverse import graph per export).
   Second-heaviest, and it can go super-linear on barrel-heavy or
   re-export-heavy code. This phase isn't instrumented, so `--performance`
   doesn't show it.
3. **gitignore tree walk.** O(everything on disk). Historically the OOM source;
   now pruned to workspace-relevant directories.
4. **Per-workspace plugin pass.** Config-file globbing plus dynamically
   importing real tool configs (vite, jest, eslint, and so on). Scales with
   workspaces × plugins.

Shape matters. Many-workspace monorepos are glob- and resolution-heavy. Large
single-package repos are parse- and traverse-heavy. Small repos are dominated by
fixed startup and config load.

**Historical GC findings:** the worker experiments attributed their scaling
limit to per-file JS allocation (Sets, Maps, closures) and contention across V8
isolates. Single-thread pauses were smaller than profiler attribution suggested.
Those findings motivated reducing host allocations; they are not measurements
of the current Rust workers or their shared caches.

## 2. Instrumentation

`--performance` times a hand-picked set of functions. `--performance-fn <name>`
filters to one and is repeatable. `--memory` samples heap at phase marks. `-u`
prints total wall time only. Add `-n` and `NO_COLOR=1` for clean output.

Don't trust the table blindly. Its blind spots:

- Native parse, worker scheduling, and resolver work are not individually timed
  by the host table. Batched work bypasses the per-file host analyzer wrapper.
- The unused-detection analysis phase isn't instrumented at all.
- Parent and child timings overlap (the walk contains source analysis and cache
  work), so percentages can sum well past 100%.
- GC, I/O wait, reporting, and fixing aren't captured separately.

## 3. Benchmark methodology

- **Use 5-run warm means, minimum.** Small-repo variance swings 5–10% or more,
  so a 1–2% effect needs many samples. Reject anything under the noise floor:
  roughly 3% on mid and large repos, 10% on small ones.
- **Discard the cold run** (jiti, disk, and JIT warmup). Compare two builds
  back-to-back in one session, since system state drifts between sessions.
  Distinguish runtime/filesystem warmup from the analysis cache: measure repeated
  no-cache runs, cache population, and warm cache hits separately. Keep startup
  samples separately labeled if startup is the change under study.
- **On macOS:** warm runs drift slowly upward from thermal and disk effects, so
  an identical baseline and change read as noise. `--prof` mis-symbolizes JIT
  frames to the nearest C++ symbol; read the bottom-up profile, or use
  `--cpu-prof` with speedscope.
- **Correctness gate:** output byte-identical to the reference baseline (cold
  and warm, cache and no-cache), focused regressions and smoke suite green, tsc
  clean. For this Rust architecture rewrite, require the full suite and the
  installed Rip workload as well; smoke or native differential tests alone do
  not cover the delivered CLI. Fix, format, and reporter changes also require
  the full suite. Preserve issue ordering, exit status, and fixes; exclude only
  explicitly variable timing/diagnostic output from comparisons.
- **Performance gate:** use paired CLI runs on the same workload and runtime,
  record revision, command, cache state, output comparison, and dispersion.
  Cover Node and Bun and both repository shapes. Require a repeatable gain
  above measured noise without material regressions in other modes; report
  kernel/replay measurements separately. Current numbers belong in the
  measurement report, not as inferred promises in this architecture guide.
- **Fixture repos** live under `~/p/knip/exercises/` (real installed projects).
  Cover both shapes: large single-package and many-workspace monorepo.

## 4. Historical shipped wins

The wins that landed were almost all caching, not hot-loop micro-opts: a
module-resolution cache (keyed by directory and specifier), skip-read-and-parse
on a cache hit, a glob-result cache, a parsed-gitignore cache, and cache-I/O
surgery. The fdir migration dropped several transitive deps for a modest
speedup. Together these roughly halved warm runs and cut peak heap substantially.

## 5. Historical experiments and their limits

Keep these measurements attached to the implementation that produced them.
A rejected design is evidence against repeating that design, not a prohibition
on changing the boundary that made it expensive.

- **JavaScript parallelism (workers and forks).** The tested pipeline capped at
  about 2× and plateaued around four cores, while pure parsing scaled about 6×.
  The cause was JS-side per-file allocation contention across isolates, a property
  of the workload rather than the dispatch. Net gains landed below the
  worth-shipping bar and regressed small repos. Revisit only after allocations
  are reduced.
- **Moving AST analysis to Rust (an `oxc_semantic` sidecar).** It regressed
  instead of helping. The sidecar re-parses every file (a double parse), and most
  of the JS walk and per-file allocations stay, so GC never drops. Extending
  oxc's raw-transfer buffer with scope data is a dead end (the Rust structures
  aren't flat), and the upstream request to expose semantics was closed. The
  subsequent fused implementation parses once and returns compact analysis
  rather than transferring a full AST and scope graph. Its costs need separate
  measurement; native-binary maintenance remains part of delivery.
- **Glob fan-out consolidation.** Recon flagged globbing as a big share on
  many-workspace monorepos, but consolidating per-workspace and per-plugin globs
  either regressed or only helped the no-cache path while regressing the cached
  path. The cost is mostly irreducible crawl work plus already-cached results,
  not per-call overhead.
- **Resolution dedup beyond the existing cache.** Negative-caching is already
  done, the error-path fallback resolver almost never helps, and the big
  redundancy (the same bare package re-resolved from many directories) can't be
  safely deduped, because resolution is genuinely directory-dependent (nearest
  tsconfig and node_modules). A prior resolution shortcut already caused a
  correctness divergence.
- **Allocation and hot-loop micro-opts.** These repeatedly netted noise or worse:
  inlining blew V8's inline budget, object pooling can't help stored objects, and
  visitor-dispatch tweaks don't move the needle. Optimize at the call-graph level
  (the redundant work), not the function body. Measure; don't theorize.
- **Replacing only source reads with a native bridge.** An isolated reader
  matched every source string but showed no diagnostic advantage in the CLI.
  Reversing Node/Rust read order moved the first-read penalty to whichever reader
  ran first. A large source-loading profile bucket therefore does not establish
  removable JavaScript overhead. No reader change was retained; this does not
  measure a fused read-and-analysis implementation.
- **Bundling an earlier native CLI.** A private bundle preserved output, but
  paired gains on the Rip workload were about 2.3% uncached and 1.8% cached on
  Node. Bun was flat uncached and slightly slower cached. This did not clear
  the CLI acceptance threshold; the module layout was retained.
- **Decoding directly into final graph records.** The private decoder matched
  all 7,343 captured Rip records, including ordering and shared tag identities,
  but saved only about 15ms on Node and 11ms on Bun in replay. No production
  decoder change was retained in that experiment. The current compact graph
  path changes which fields decode; the replay result does not measure it.
- **Skipping forward-map self-merges.** That Rip capture had 33,145 identity-equal
  merges, but instrumentation attributed only 5–13ms to them across Node/Bun and
  cold and cached runs. This is a small affected-work budget, not a demonstrated
  CLI improvement. A reverse index remains necessary, but normal CLI runs now
  build it in Rust without JavaScript forward-map self-merges.
- **ASCII conversion and containing-directory reuse.** A private native
  candidate preserved CLI output, but a repeated ten-pair Rip campaign showed
  median paired gains of about 0.6% on Node and 1.8% on Bun, below the CLI
  acceptance threshold. Bun aggregate timings were slightly worse. Neither
  change was retained in that experiment.
- **Usage-query memoization.** Private Rip diagnostics measured snapshot
  construction, native transfer, queries, and return adaptation together at
  about 39–44ms. Only 116 of 9,152 reference queries repeated an exact key;
  those repeats consumed under 0.15ms of native work. A query cache would add
  validation and ownership complexity for no meaningful CLI saving on that
  measured path. Those snapshot timings are not a compact-ingestion profile.
- **A hand-written AST walk switch** is obsolete: oxc-parser already ships a
  generated switch-based walker.

## 6. Load-bearing (don't "simplify")

Much of the glob and gitignore intricacy exists for a specific, tested reason.
Preserve these behaviors when changing their implementation:

- Workspace-relevance pruning of the gitignore walk, which prevents a large RSS
  and time blowup on big monorepos.
- The incremental gitignore matcher: ignores and un-ignores are separate
  append-only matchers. Picomatch's `ignore` option recompiles un-ignores per
  ignore pattern.
- The un-ignore shadow filter, which reconciles knip's un-ignore-aware model with
  the underlying glob library that can't express un-ignores.
- Expanding a directory ignore so it also matches the directory's contents.
- Git worktree handling (`.git` as a file), `info/exclude` rooting,
  ancestor-gitignore handling, and the gitignore comment and escaping rules.
- Platform and fast-path details: the directory-walk slicing assumptions,
  reading a directory's `.gitignore` before its subdirectories (readdir order
  varies by runtime), and not following symlinks (circular workspaces).
- Cache-invalidation keys: a workspace-set-dependent gitignore cache, and always
  tracking the base directory to catch new top-level entries.
- Outside glob: char-code constants in hot string scanning (named beats magic
  numbers), the production-suffix `!` convention (modeling it structurally is a
  cross-cutting config-contract change), and the precomputed workspace-directory
  lookup used per file.

Two engines explain most of the apparent glob redundancy. One matcher can express
un-ignores (used for the per-file gitignore predicate and the walk); the glob
crawler can't, so knip bridges down to it. Most of the "redundant" code is that
bridge.

## 7. Current scheduling and ownership constraints

- One shared `ProjectPrincipal` owns the growing reachability queue. It prepares
  at most 64 queue slots at a time, mixing cache hits with eligible plain JS/TS
  requests. Rust uses up to four lanes, bounded by available parallelism; small
  batches and WASI stay on one lane. This does not require knowing the entire
  reachable graph upfront.
- Compilers are serial barriers, including cached compiler files. Preloaded
  source and other ineligible files use the serial path. Host callbacks and
  graph ingestion retain queue order; failed native requests fall back through
  serial analysis. Prepared cache/results must still match current entry/export
  policy. Watch, sessions, and debug disable batching.
- Resolver cores share an `Arc<ResolverPlan>`, backends, synchronized module
  cache, and source-mapping hit/miss memo. Per-core workspace lookup state stays
  local; JavaScript callback handles never move into worker cores. Cache
  lifetimes and failed probes remain part of resolution semantics.
- Normal CLI graph ingestion is ordered but runs in Rust over compact prefixes.
  It does not need JavaScript internal maps or a final graph snapshot. The full
  JavaScript graph and fresh usage snapshots remain necessary for the current
  session/watch/trace/cycle paths. Native finalization is a one-shot boundary.
- The immutable analysis cache must validate both configuration context and
  resolver dependencies. Missing candidates, config/package contents, symlink
  changes, and incomplete observations matter. A stable cache filename prevents
  configuration churn from accumulating obsolete cache files.
- Config evaluation needs a real working-directory change for some plugins, which
  is process-global and so mutually exclusive with in-process parallel config
  eval. It's currently scoped and sequential, so it's safe, but it forecloses
  that parallelism.
- Ordering: config and plugin files first (they affect plugin enablement), and
  ancestor gitignores before the walk.

## 8. Architectural options and current status

1. **Fused native analysis, bounded batches, and compact ingestion are
   implemented.** Measure the complete CLI and cache paths before declaring a
   performance win. The old double-parse sidecar and JS worker results do not
   describe these boundaries.
2. **Daemon mode.** A separate repeat-run option that could amortize startup,
   module loading, and discovery. It needs explicit invalidation and lifecycle
   design plus its own measurements; there is no current speedup or delivery
   estimate here.
3. **Bundle knip into one file.** Still a packaging option, but the earlier
   native implementation's paired CLI experiment did not justify it for speed.
4. **Demand-driven two-pass** (an imports-only pass to skip dead-file analysis).
   Project-dependent, and limited because there's no cheap imports-only lexer.
5. **Measure native batch scaling and remaining transfers.** Compact ingestion
   removes host internal-edge decoding, but host exports/dependencies, compiler
   work, synchronization, and native/host transfers remain. Use current profiles
   to decide whether another boundary change is worthwhile.

## 9. Historical follow-ups (revalidate before pursuing)

These notes predate the current rewrite and are not confirmed blockers:

- An oxc-resolver upgrade makes a local rootDirs workaround redundant, but it's
  blocked on an npm release and a nested-paths regression. Fix branches exist.
- AST-visitor de-duplication is real but fiddly because of oxc's AST types, and
  needs someone fluent in them. Graph-explorer control-flow cleanups sit in
  reachability-critical code and want careful review.

## 10. Source docs (where the detail and numbers live)

In `.agents/tasks/`: `todo-perf-architecture.md` (the master: profiles, shipped
and dropped tables, the worker and fork abort data, the tiered roadmap),
`todo-perf-session-2026-05.md` (caching wins), `todo-perf-glob-fanout.md` (glob
falsification and resolution floor), `todo-glob-simplify.md` (glob load-bearing
map), `todo-oxc-fuse.md` and `todo-oxc-semantic.md` (Rust offload),
`todo-fdir-migration*.md` (walk migration and the load-bearing prune matrix), and
`todo-oxc-resolver-rootdirs.md`. In memory: the glob/resolution floor, the
config-cwd constraint, the cold-run-discard rule, and the exercises-repo
locations.
