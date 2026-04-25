# Identifiers, Symbols & Matching

How knip resolves "is this export used?" across an AST. Matching is name-based;
the sections below cover the cases that need extra care.

## Shadow detection

Name-based matching produces false negatives when a local binding shadows an
exported name of the same spelling. `isShadowed(name, pos)` returns true if the
reference at `pos` falls inside a scope that shadows `name`. Shadows are
registered via:

- `_addShadow`: block-scoped variables and nested function declarations
  (uses current `scopeDepth` range from `BlockStatement`)
- `_addParamShadows`: function/arrow/method parameters (uses function body
  range directly, since params are visited before the body's `BlockStatement`)
- `CatchClause` handler: catch binding (uses catch body range)
- `ForInStatement`/`ForOfStatement` handlers: loop variable (uses loop body
  range, since the `VariableDeclaration` fires before the body's `BlockStatement`)

`_collectBindingNames` recurses into destructuring patterns (ObjectPattern,
ArrayPattern, AssignmentPattern, RestElement) to extract all bound Identifiers.

## `ignoreExportsUsedInFile`

Opt-in config (default `false`).

**Default semantics match tsc/tsgo.** An export only referenced in its own file
is reported as unused, because removing the `export` keyword leaves the program
and `.d.ts` valid. Types are structurally inlined: a consumer importing
`UserInfo = { address: Address }` does not require `Address` to be exported.
Same for `typeof X` references inside type aliases. So `Address` is correctly
flagged. Opting `true` is a code-organization preference, not a correctness
concern.

**With the config on.** `localRefsVisitorObject` populates `localRefs` during
AST traversal. Exports present in `localRefs` get `hasRefsInFile = true`.
`shouldCountRefs` gates eligible types. Computed member access
(`obj[EXPORTED_KEY]`) is handled.

`analyze.ts` reads this via `isReferencedInUsedExport` for exports not directly
imported: returns true only when a containing export has `hasRefsInFile` and is
a type/interface (recursively checked). Alive-ness does not cascade through
external imports; inner refs stay scoped to the in-file relationship.

## `referencedInExport` (type-chain refs)

Maps exported identifier → set of export names whose type annotations reference
it. Type-level only, not function signatures. Type→type chains are followed;
type→function chains do not keep types alive. Interface `extends` clauses
captured via `addRefInExport`. Feeds the recursive type/interface check in
`isReferencedInUsedExport` above.

## Namespace/enum member `hasRefsInFile`

`ExportMember.hasRefsInFile` (separate from export-level `Export.hasRefsInFile`)
is set via deferred resolution. During the walk, same-file member references
(e.g. `Bar.value`) are pushed as interleaved pairs to a flat
`memberRefsInFile: string[]` on `WalkState`. After the walk, pairs are resolved
against the final `exports` map.

Deferred because the AST visitor walks source-order; forward references to
namespace members defined later in the file would miss inline resolution. Same
pattern as `bareExprRefs`.

Collection: `handleMemberExpression` (3 depth levels) and
`coreVisitorObject.TSQualifiedName` push pairs to `memberRefsInFile`.
`localRefsVisitorObject.TSQualifiedName` only adds the namespace name to
`localRefs` (no member push, core handler covers it). Resolution happens in
`walkAST` post-walk.

In `analyze.ts`: for referenced namespace/enum exports, members without
`hasRefsInFile` are checked via `explorer.isReferenced(filePath, "Ns.member")`.
If neither, reported as unused.

**Edge case:** when a namespace/enum has export-level `hasRefsInFile = true`
but is NOT externally imported, `analyze.ts` skips the member check entirely.
Unused members silently pass. By design (the export itself is considered
"used").

## E2E

`packages/knip/test/e2e/fix-tsgo.test.ts` is the safety net for the resolution
paths above. Each fixture builds clean under tsgo, has `knip --fix` run on it,
then must build clean under tsgo again. A failing post-fix build means knip
removed something tsc/tsgo still needs: a false positive in one of these
mechanisms. The `e2e-lib-*` variants extend the round-trip to a consumer so
type-visibility regressions also fail.
