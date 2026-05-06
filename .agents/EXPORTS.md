# Identifiers, Symbols & Matching

How knip resolves "is this export used?" across an AST. Matching is name-based.

## Shadow detection

A local binding can shadow an exported name, producing false negatives.
`isShadowed(name, pos)` returns true if the reference at `pos` falls inside a
scope that shadows `name`. Shadows registered via:

- `_addShadow`: block-scoped variables and nested function declarations (uses
  current `scopeDepth` range from `BlockStatement`)
- `_addParamShadows`: function/arrow/method parameters (uses function body
  range directly, since params are visited before the body's `BlockStatement`)
- `CatchClause` handler: catch binding (uses catch body range)
- `ForInStatement`/`ForOfStatement` handlers: loop variable (uses loop body
  range, since the `VariableDeclaration` fires before the body's `BlockStatement`)

`_collectBindingNames` recurses into destructuring patterns (ObjectPattern,
ArrayPattern, AssignmentPattern, RestElement) to extract bound Identifiers.

## `ignoreExportsUsedInFile`

Opt-in config (default `false`).

**Default semantics match tsc/tsgo.** An export only referenced in its own file
is reported as unused; removing the `export` keyword leaves the program and
`.d.ts` valid. Type aliases inline structurally: a consumer importing
`UserInfo = { address: Address }` does not require `Address` to be exported.
Same for `typeof X` references inside type aliases. Opting `true` is a
code-organization preference, not a correctness concern.

**Does not apply to types in value signatures.** Types referenced in exported
value signatures (function params/returns, variable annotations, `typeof` of an
exported value) stay alive unconditionally. `tsc --declaration` cannot inline
an interface or class type into a `.d.ts` and errors TS4023 if the name is not
exported. That path is intentionally not gated by `ignoreExportsUsedInFile`.

**With the config on.** `localRefsVisitorObject` populates `localRefs` during
AST traversal. Exports present in `localRefs` get `hasRefsInFile = true`.
`shouldCountRefs` gates eligible types. Computed member access
(`obj[EXPORTED_KEY]`) is handled.

`analyze.ts` reads this via `isReferencedInUsedExport` for exports not directly
imported: returns true when a containing export has `hasRefsInFile` and is a
type/interface (recursively checked). Alive-ness does not cascade through
external imports; chains stay in-file.

## `referencedInExport` (chain refs)

Maps exported identifier to set of export names whose declarations reference
it. Populated for type aliases, interfaces (body and `extends`), and the
signature parts of exported values: variable type annotations, function/arrow
expression params and return types, function/method declarations.
Function/arrow bodies are skipped via `signatureOnly`.

`isReferencedInUsedExport` walks the chain, classifying each hop:

- **Type→type hop** (containing export is `type`/`interface`/`enum`):
  propagates only when `ignoreExportsUsedInFile` is on. Otherwise the chain
  breaks here, since tsc structurally inlines the inner type and its export is
  removable.
- **Type→value hop** (containing export is a function/class/variable):
  propagates unconditionally. Needed for `tsc --declaration`; removing the
  inner type's export would TS4023.

Interface `extends` clauses captured via `addRefInExport`.

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
Unused members silently pass. By design: the export itself is considered "used".

## E2E

`packages/knip/test/e2e/fix-tsgo.test.ts` covers the resolution paths above.
Each fixture builds clean under tsgo, has `knip --fix` run on it, then must
build clean under tsgo again. A failing post-fix build means knip removed
something tsc/tsgo still needs: a false positive in one of these mechanisms.
The `e2e-lib-*` variants extend the round-trip to a consumer with
`declaration: true` so type-visibility regressions (TS4023 etc.) also fail.

When adding a fixture for a value-to-type-visibility scenario, do not also
re-export the type explicitly from the public entry. That path masks
type-chain bugs: the type stays alive via the re-export regardless of whether
knip tracks the value's signature. Test the implicit case (type only
referenced in a function signature, never named at the entry) so the chain is
the only thing keeping the export alive.
