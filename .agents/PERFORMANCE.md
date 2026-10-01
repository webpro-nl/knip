# Knip performance reference

What the performance work on knip core has established: where time goes, what
shipped, what's a proven dead end, what's load-bearing, the architectural
constraints, and the levers worth pursuing. Kept generic; for exact numbers and
commits, see the source docs in §10.

## 0. Current state

Knip core sits at its practical cold-run optimization floor on the obvious
levers. The easy and medium wins are banked: warm runs are roughly 2× faster
than early 2026, mostly from caching. Every remaining cold-run lever has been
measured, and each one either fails its bar or regresses:

- Parallelism (worker threads and child-process forks): a proven dead end.
- Moving AST analysis to Rust (`oxc_semantic`): tried, regressed.
- Glob fan-out consolidation: falsified. Resolution dedup: near-floor.

The wins left need one of two big bets: the hard Rust path (a fused
parse+semantic native crate, weeks of work) or a different axis (daemon mode for
repeat-run latency). There's no quick large-repo wall-clock win without one of
those.

## 1. Where time goes

On large repos, in rough order of cost:

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

**On GC:** single-threaded GC pause is small, smaller than the profiler's tick
attribution implies. But per-file JS allocation (Sets, Maps, closures) is what
caps parallelism, through allocator and GC contention across V8 isolates. So
reducing allocations helps throughput-per-core (by unblocking parallelism) far
more than it helps single-thread wall time.

## 2. Instrumentation

`--performance` times a hand-picked set of functions. `--performance-fn <name>`
filters to one and is repeatable. `--memory` samples heap at phase marks. `-u`
prints total wall time only. Add `-n` and `NO_COLOR=1` for clean output.

Don't trust the table blindly. Its blind spots:

- Native oxc parse is invisible; only the thin JS parse wrapper is timed.
- The unused-detection analysis phase isn't instrumented at all.
- Parent and child timings overlap (the walk loop contains parse, visitor, and
  imports/exports), so percentages sum well past 100%.
- GC, I/O wait, reporting, and fixing aren't captured separately.

## 3. Benchmark methodology

- **Use 5-run warm means, minimum.** Small-repo variance swings 5–10% or more,
  so a 1–2% effect needs many samples. Reject anything under the noise floor:
  roughly 3% on mid and large repos, 10% on small ones.
- **Discard the cold run** (jiti, disk, and JIT warmup). Compare two builds
  back-to-back in one session, since system state drifts between sessions.
- **On macOS:** warm runs drift slowly upward from thermal and disk effects, so
  an identical baseline and change read as noise. `--prof` mis-symbolizes JIT
  frames to the nearest C++ symbol; read the bottom-up profile, or use
  `--cpu-prof` with speedscope.
- **Correctness gate for every change:** output byte-identical to main (cold and
  warm, cache and no-cache), smoke suite green, tsc clean. Run the full suite for
  fix, format, or reporter changes.
- **Fixture repos** live under `~/p/knip/exercises/` (real installed projects).
  Cover both shapes: large single-package and many-workspace monorepo.

## 4. Shipped wins

The wins that landed were almost all caching, not hot-loop micro-opts: a
module-resolution cache (keyed by directory and specifier), skip-read-and-parse
on a cache hit, a glob-result cache, a parsed-gitignore cache, and cache-I/O
surgery. The fdir migration dropped several transitive deps for a modest
speedup. Together these roughly halved warm runs and cut peak heap substantially.

## 5. Dead ends (measured; don't re-chase)

- **Parallelism (workers and forks).** The per-file pipeline caps at about 2× and
  plateaus around four cores, while pure parsing scales about 6×. The cause is
  JS-side per-file allocation contention across isolates, a property of the
  workload rather than the dispatch. Net gains land below the worth-shipping bar
  and regress small repos. Revisit only after allocations are reduced.
- **Moving AST analysis to Rust (an `oxc_semantic` sidecar).** It regressed
  instead of helping. The sidecar re-parses every file (a double parse), and most
  of the JS walk and per-file allocations stay, so GC never drops. Extending
  oxc's raw-transfer buffer with scope data is a dead end (the Rust structures
  aren't flat), and the upstream request to expose semantics was closed. If
  revived, the only viable shape is a fused native crate that parses once and
  returns both AST and scope data, which is weeks of work plus native-binary
  maintenance.
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
- **A hand-written AST walk switch** is obsolete: oxc-parser already ships a
  generated switch-based walker.

## 6. Load-bearing (don't "simplify")

Much of the glob and gitignore intricacy exists for a specific, tested reason.
Each of these looks removable but isn't:

- Workspace-relevance pruning of the gitignore walk, which prevents a large RSS
  and time blowup on big monorepos.
- The incremental gitignore matcher and its asymmetry: a new un-ignore forces a
  full rebuild, a new ignore only appends. Un-ignores are global to the matcher.
- The un-ignore shadow filter, which reconciles knip's un-ignore-aware model with
  the underlying glob library that can't express un-ignores.
- Expanding a directory ignore so it also matches the directory's contents.
- Git worktree handling (`.git` as a file), `info/exclude` rooting,
  ancestor-gitignore handling, and the gitignore comment and escaping rules.
- Platform and fast-path details: the directory-walk slicing assumptions, the
  Windows basename check, and not following symlinks (circular workspaces).
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

## 7. Architectural constraints (for any parallelism or restructure)

- One thread, one shared analyzer for all workspaces. The traversal is a serial
  BFS whose work-list grows mid-loop as files are discovered while parsing, so a
  worker can't know its full input upfront.
- The reverse import index is built incrementally as files merge, mutating other
  files' nodes, so graph assembly must stay serial. Workers can only return
  compact per-file records to merge on the main thread.
- The resolver isn't shareable across threads; each worker needs its own.
- Config evaluation needs a real working-directory change for some plugins, which
  is process-global and so mutually exclusive with in-process parallel config
  eval. It's currently scoped and sequential, so it's safe, but it forecloses
  that parallelism.
- Ordering: config and plugin files first (they affect plugin enablement), and
  ancestor gitignores before the walk.

## 8. Levers worth pursuing (ranked, with honest cost)

1. **A fused parse+semantic native crate.** The only path that both cuts
   single-thread cold time and unblocks parallelism: parse once, return AST and
   scope data together. Weeks of work plus ongoing native-binary maintenance.
2. **Daemon mode.** A different axis. Big speedup on repeat runs (CI, pre-commit,
   IDE, watch), where startup, module load, and globbing are paid once. The
   biggest user-facing win. About a week.
3. **Bundle knip into one file.** A small cold-run win that also unlocks the V8
   code cache and single-binary distribution.
4. **Demand-driven two-pass** (an imports-only pass to skip dead-file analysis).
   Project-dependent, and limited because there's no cheap imports-only lexer.
5. **Re-measure parallelism, but only after allocations are reduced.** That's the
   one condition under which it might revive.

## 9. Open follow-ups (lower stakes)

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
