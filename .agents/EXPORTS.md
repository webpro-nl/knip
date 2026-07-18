# Resolving export usage

How knip answers "is this export used?" across an AST. Matching is name-based, with no type checker.

## DTS correctness

For libraries that emit `.d.ts` (`declaration: true`), removing an `export`
keyword is only safe when tsc/tsgo can still produce a valid declaration.
Knip's chain-ref machinery approximates the rules `isolatedDeclarations`
enforces (TS 5.5+): types referenced from exported value signatures must be
nameable in the emitted `.d.ts`, else `tsc --declaration` errors. The
diagnostic varies by shape: TS4023 (cross-module, the common case),
TS4081/TS4082 (same-module private names), TS4060/TS4063 (return/parameter
positions). All trace to one problem: a type isn't nameable where the
declaration needs it. Unlike `isolatedDeclarations`, which requires explicit
annotations and rejects implicit forms, knip handles the implicit forms by
walking the chain name-based, without a type checker.

See:

- [`isolatedDeclarations` TSConfig reference][1]
- [TS 5.5 release notes: Isolated Declarations][2]
- [microsoft/TypeScript#5711][3] (TS4023 origin)

Operating model:

- Correctness floor: never strip an export tsc still needs. FNs (knip kept a
  type alive that could have been removed) are a reportable miss; FPs (knip
  removed an export tsc still needs) are a broken build.
- Approximate, don't infer. Chains follow what is _structurally_ visible.
  Don't capture from positions that demonstrably don't flow (e.g. `as` casts
  in body context).
- Escape hatch: when the heuristic is wrong, an explicit return type or value
  type annotation always wins.

The rest is the mechanical detail of how knip approximates this.

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

By default, an export only referenced in its own file is reported as unused,
matching what `tsc` would tolerate (structural inlining of type aliases,
`typeof X` in type aliases). Opting `true` is a code-organization preference,
not a correctness concern. Either way, types reachable from exported value
signatures stay alive unconditionally regardless of this config. That's the
DTS-correctness path covered above.

With the config on: `localRefsVisitorObject` populates `localRefs` during AST
traversal. Exports present in `localRefs` get `hasRefsInFile = true`.
`shouldCountRefs` gates eligible types. Computed member access
(`obj[EXPORTED_KEY]`) is handled.

`analyze.ts` reads this via `isReferencedInUsedExport` for exports not directly
imported: returns true when a containing export has `hasRefsInFile` and is a
type/interface (recursively checked). Alive-ness does not cascade through
external imports; chains stay in-file.

## Chain refs (`referencedInExport` + `_collectRefsInType`)

Maps exported identifier to set of export names whose declarations reference
it. Walked by `_collectRefsInType(node, exportName, signatureOnly, seen, inBody)`.

### Where chains are seeded

- **Type aliases** (`TSTypeAliasDeclaration.typeAnnotation`): full walk.
- **Interfaces** (`TSInterfaceDeclaration.body` plus `extends`): full walk;
  `extends` clauses captured via `addRefInExport`.
- **Variable export with type annotation**: walks `id.typeAnnotation` only. The
  annotation already names everything visible to declaration emit; the init's
  signature is dead work.
- **Variable export without type annotation**: walks the init.
  `signatureOnly = hasExplicitFunctionReturnType(init)`.
- **Function declarations** (named, default, declare): walks the function node
  with `signatureOnly = hasExplicitFunctionReturnType(decl)`.
- **Class declarations** (named, default): walks with `signatureOnly = true`
  (param types of methods captured; method bodies skipped).
- **Destructured exports** (`export const { a } = factory()`): walks the init
  with `signatureOnly = false` so types inside the factory's return shape are
  captured.

### `signatureOnly` semantics

- `true`: skip `BlockStatement` / `FunctionBody`. Walk only signature-shaped
  nodes (params, return types, type parameters, type annotations, type
  references, type queries).
- `false`: enter blocks. Used for inferred-return functions where the body
  itself defines the inferred shape (and for type alias / interface bodies,
  which never contain blocks anyway).

### Helper-call following (deferred resolution)

When the walker sees a `CallExpression` it does not resolve the helper inline.
Source order is unreliable: a helper declared after an export wouldn't yet be
in `localDeclarations` at the call site. Instead, three queues collect
references and are drained after the visitor pass:

- `pendingCallRefs`: `callee` is an `Identifier` (always), or an argument is an
  `Identifier` _and_ `inBody` is false. The body restriction prevents the
  `useReducer(localReducer, …)` over-capture: a helper passed as an argument
  inside a body usually has its signature types consumed locally, not surfaced
  in the outer inferred return. Top-level `wrap(inner)` and expression-body
  `() => wrap(inner)` still follow (`inBody` stays false).
- `pendingMemberCallRefs`: `callee` is a non-computed `MemberExpression` whose
  object is an `Identifier` resolving to a local `const`-initialized
  `ObjectExpression` and whose property name maps to a function-typed value.
  Covers the `helpers.recurse()` / handler-bag pattern, one level deep.

Drain logic walks the resolved decl with `signatureOnly = true` (helper's
public surface is the signature, never the body). The `seen` set is per-chain
and prevents cycles. New entries pushed during drain are processed in the
same loop until both queues are empty.

This deferred pattern mirrors `memberRefsInFile`.

### `inBody` flag (cast-skip heuristic)

Tracks whether the walker is currently descending through a function body.
Set to `true` when entering a non-skipped `BlockStatement` / `FunctionBody`;
propagates to children.

When `inBody` is true:

- `TSAsExpression` / `TSTypeAssertion` / `TSSatisfiesExpression` are walked
  through their `expression` only. The type annotation is treated as a local
  hint that doesn't flow into declaration emit. `JSON.parse('{}') as T` is the
  motivating case.
- `VariableDeclarator` is walked through its `init` only. A body-local binding's
  own annotation (`let x: T`) is a local hint that doesn't flow into the inferred
  return.

When `inBody` is false (signature mode, top-level inits, type alias targets):

- The same nodes are walked normally; their type annotations are captured.
  `export const x = parse() as T` and similar top-level cast inits keep T
  alive correctly.

Edge case: `() => { return x as T; }` (block body, cast as return value, no
explicit return type) loses T. Mitigation: add an explicit return type. The
trade prefers fixing the common FN (internal-hint casts) over preserving an
uncommon shape that has a clean user-visible workaround.

### Chain consumption

`isReferencedInUsedExport` walks the chain from a non-imported export upward,
classifying each hop:

- **Type→type hop** (containing export is `type` / `interface` / `enum`):
  propagates only when `ignoreExportsUsedInFile` is on. Otherwise the chain
  breaks here, since tsc structurally inlines the inner type and its export
  is removable.
- **Type→value hop** (containing export is a function/class/variable):
  propagates unconditionally. Needed for `tsc --declaration`; removing the
  inner type's export would error in declaration emit (TS4023 / TS4081 / etc.).

## Namespace/enum member `hasRefsInFile`

`ExportMember.hasRefsInFile` (separate from export-level `Export.hasRefsInFile`)
is set via deferred resolution. During the walk, same-file member references
(e.g. `Bar.value`) are pushed as interleaved pairs to a flat
`memberRefsInFile: string[]` on `WalkState`. After the walk, pairs are resolved
against the final `exports` map.

Deferred because the AST visitor walks source-order; forward references to
namespace members defined later in the file would miss inline resolution.
Same pattern as `pendingCallRefs` and `bareExprRefs`.

Collection: `handleMemberExpression` (3 depth levels) and
`coreVisitorObject.TSQualifiedName` push pairs to `memberRefsInFile`.
`localRefsVisitorObject.TSQualifiedName` only adds the namespace name to
`localRefs` (no member push, core handler covers it). Resolution happens in
`walkAST` post-walk.

In `analyze.ts`: for referenced namespace/enum exports, members without
`hasRefsInFile` are checked via `explorer.isReferenced(filePath, "Ns.member")`.
If neither, reported as unused.

`isReferenced` returns reference usage and entry exposure independently. If the
namespace/enum is exposed by an entry and `includeEntryExports` is off, all of
its members stay public even when other workspace files reference only some of
them. Imports used by an entry without a re-export do not qualify. `nsExports`
and `nsTypes` refine namespace analysis after this public-entry boundary and do
not override it.

**Edge case:** when a namespace/enum has export-level `hasRefsInFile = true`
but is NOT externally imported, `analyze.ts` skips the member check entirely.
Unused members silently pass. By design: the export itself is considered "used".

## E2E

`packages/knip/test/e2e/fix-tsgo.test.ts` covers the resolution paths above.
Each fixture builds clean under tsgo, gets `knip --fix`, then must build clean
again. A failing post-fix build means knip removed something tsc/tsgo still
needs: a false positive in one of these mechanisms.

`e2e-lib-*` fixtures extend the round-trip to a consumer with
`declaration: true` so type-visibility regressions (any TS4xxx code) also fail.
FP-direction (knip must NOT strip a name tsc still needs) is caught by the
post-fix tsgo emit on `pkg/`. FN-direction (knip must FLAG a name tsc
doesn't need) is caught by per-fixture `remove` regexes in
`libFixtureRemovals`. The two checks are orthogonal; neither is redundant.

FP-direction:

- `e2e-lib-typed-exports`: explicit return-type annotations on exported values
- `e2e-lib-export-star-as`: `export * as Ns from '…'` namespace re-export
- `e2e-lib-arrow-inferred-return`: arrow with block body, no return type;
  body walked for chain refs (the `createHandler` shape)
- `e2e-lib-call-forward-decl`: Identifier callee resolving to a forward-declared
  local (deferred-resolution path)
- `e2e-lib-member-call`: `obj.method()` MemberExpression callee
- `e2e-lib-call-arg`: Identifier as call argument at top level (`wrap(inner)`)

FN-direction:

- `e2e-lib-as-cast-in-body`: `as T` cast inside a function body must NOT
  keep T alive (inBody cast-skip)
- `e2e-lib-call-arg-in-body`: Identifier as call argument inside a body must
  NOT keep the helper's signature types alive (the `useReducer(reducer, …)`
  case; `pendingCallRefs` arg-follow is gated on `!inBody`)

When adding a value-to-type-visibility fixture, don't also re-export the
type explicitly from the public entry. That masks type-chain bugs because
the type stays alive via the re-export regardless of whether knip tracks
the value's signature. Test the implicit case so the chain is the only
thing keeping the export alive.

[1]: https://www.typescriptlang.org/tsconfig#isolatedDeclarations
[2]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#isolated-declarations
[3]: https://github.com/microsoft/TypeScript/issues/5711
