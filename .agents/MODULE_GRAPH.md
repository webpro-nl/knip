# Module Graph

Concise walk-through from CLI to reporter output.

Core module graph and AST traversal.

## Implementation walk-through

The sequence from [CLI][1]:

1. [Create options][2]
2. [Run][3]
   1. Normalize user config
   2. Get workspaces
   3. [Build module graph][4]
      1. [Run enabled plugins][5] in each workspace
      2. Store entry points and referenced dependencies
      3. [Create TS programs][6]
      4. [Get imports and exports][7] using TS AST traversal/visitors
      5. [Get dependencies/binaries from scripts][8]
   4. [Analyze module graph][9]
      1. Find [unused exports][10] (respecting [namespaces & members][11])
      2. Settle unused files
      3. [Settle unused/unlisted dependencies][12]
      4. Settle unused catalog entries
3. [Run default reporter][13]

[1]: ./packages/knip/src/cli.ts
[2]: ./packages/knip/src/util/create-options.ts
[3]: ./packages/knip/src/run.ts
[4]: ./packages/knip/src/graph/build.ts
[5]: ./packages/knip/src/WorkspaceWorker.ts
[6]: ./packages/knip/src/ProjectPrincipal.ts
[7]: ./packages/knip/src/typescript/get-imports-and-exports.ts
[8]: ./packages/knip/src/binaries/bash-parser.ts
[9]: ./packages/knip/src/graph/analyze.ts
[10]: ./packages/knip/src/graph-explorer/operations/is-referenced.ts
[11]:
  ./packages/knip/src/graph-explorer/operations/has-strictly-ns-references.ts
[12]: ./packages/knip/src/DependencyDeputy.ts
[13]: ./packages/knip/src/reporters/symbols.ts
