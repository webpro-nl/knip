# Identifiers, Symbols & Matching

## The v5→v6 shift

v5 used TypeScript's typechecker for binding/symbol identity — two identifiers
with the same name in different scopes were distinct symbols. v6 migrated to OXC
(no typechecker), so matching is name-based. This creates false negatives when
local bindings shadow exported names.

## Shadow detection

Name-based matching means any identifier resolution can be fooled by shadowing:
local refs, bare expression refs, import tracking, type refs. A local
`const serialize = ...` inside a nested scope could incorrectly match the
exported `serialize` anywhere identifiers are resolved by name.

Scope-aware shadow detection in `walk.ts` tracks `BlockStatement` ranges and
variable declarations. `isShadowed(name, pos)` checks whether a reference at a
given position falls inside a scope that shadows that name. Used by
`_addLocalRef`, `coreVisitorObject` handlers, and `TSQualifiedName` resolution.

## `referencedInExport`

Maps exported identifier → set of export names whose type annotations reference
it. Populated by `_collectRefsInType` during AST traversal.

Only populated for type-level exports (type aliases, interfaces). NOT for
function signatures — a type appearing in a function's parameter/return type
does not make the type export "used". TypeScript inlines non-exported types in
`.d.ts` output, so the export is not required for declaration correctness.

Chains: type→type references are followed (e.g. `SuccessResult` in
`type Result = SuccessResult | Error` keeps `SuccessResult` alive when `Result`
is imported). Type→function chains do not keep types alive.

Interface `extends` clauses are captured separately via `addRefInExport` (not
inside the interface body node).

## `isReferencedInUsedExport`

Called in `analyze.ts` for exports that are NOT directly imported. Returns true
if the export is indirectly alive through type→type chains:

1. Containing export is externally referenced → alive
2. Containing export has `hasRefsInFile` AND is type/interface → alive
3. Recursive check through further `referencedIn` chains

## `ignoreExportsUsedInFile`

Opt-in config (`boolean | { type, interface, enum, class, function }`). When
enabled, the `localRefsVisitorObject` runs during AST traversal, populating
`localRefs` with identifier usage in expressions and type annotations. Exports
found in `localRefs` get `hasRefsInFile = true` and are not reported as unused.

`shouldCountRefs` gates which export types are eligible based on the config
shape. E.g. `{ type: true, interface: true }` only counts refs for those types.

The `localRefsVisitorObject` handles computed member access
(`obj[EXPORTED_KEY]`) — without this, exports used only as computed keys would
be false positives when `ignoreExportsUsedInFile` is enabled.
