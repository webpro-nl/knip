# Identifiers, Symbols & Matching

## The v5→v6 shift

v5 used TypeScript's typechecker for binding/symbol identity — two identifiers
with the same name in different scopes were distinct symbols. v6 migrated to OXC
(no typechecker), so matching is name-based. This creates false negatives when
local bindings shadow exported names.

## Shadow detection

`isShadowed(name, pos)` checks whether a reference at a given position falls
inside a scope that shadows that name. Shadows are registered via:

- `_addShadow`: block-scoped variables and nested function declarations
  (uses current `scopeDepth` range from `BlockStatement`)
- `_addParamShadows`: function/arrow/method parameters (uses function body
  range directly, since params are visited before the body's `BlockStatement`)
- `CatchClause` handler: catch binding (uses catch body range)
- `ForInStatement`/`ForOfStatement` handlers: loop variable (uses loop body
  range, since the `VariableDeclaration` fires before the body's `BlockStatement`)

`_collectBindingNames` recurses into destructuring patterns (ObjectPattern,
ArrayPattern, AssignmentPattern, RestElement) to extract all bound Identifiers.

## `referencedInExport`

Maps exported identifier → set of export names whose type annotations reference
it. Only for type-level exports, NOT function signatures. Type→type chains are
followed; type→function chains do not keep types alive. Interface `extends`
clauses captured via `addRefInExport`.

## `isReferencedInUsedExport`

Called in `analyze.ts` for exports NOT directly imported. Returns true if alive
through type→type chains (containing export referenced, or has `hasRefsInFile`
and is type/interface, checked recursively).

## `ignoreExportsUsedInFile`

Opt-in config. When enabled, `localRefsVisitorObject` populates `localRefs`
during AST traversal. Exports in `localRefs` get `hasRefsInFile = true`.
`shouldCountRefs` gates eligible types. Handles computed member access
(`obj[EXPORTED_KEY]`).

Note: when a namespace/enum has export-level `hasRefsInFile = true` but is NOT
externally imported, `analyze.ts` skips the member check entirely — unused
members silently pass. This is by design (the export is considered "used").

## Namespace/enum member `hasRefsInFile`

`ExportMember.hasRefsInFile` (separate from export-level `Export.hasRefsInFile`)
is set via deferred resolution: during the walk, same-file member references
(e.g. `Bar.value`) are pushed as interleaved pairs to a flat
`memberRefsInFile: string[]` on `WalkState`. After the walk, pairs are resolved
against the final `exports` map.

Deferred because the AST visitor walks source-order — forward references to
namespace members defined later in the file would miss inline resolution. Same
pattern as `bareExprRefs`.

Collection: `handleMemberExpression` (3 depth levels) and
`coreVisitorObject.TSQualifiedName` push pairs to `memberRefsInFile`.
`localRefsVisitorObject.TSQualifiedName` only adds the namespace name to
`localRefs` (no member push — core handler covers it). Resolution in `walkAST`
post-walk.

In `analyze.ts`: for referenced namespace/enum exports, members without
`hasRefsInFile` are checked via `explorer.isReferenced(filePath, "Ns.member")`.
If neither, reported as unused.
