# Export usage and declaration safety

Knip answers "is this export used?" by matching names from syntax and the
module graph. It does not run a type checker. Export analysis must therefore
stay conservative when removing an `export` could break declaration emit.

## Safety contract

A report is also a promise about `knip --fix`. Keeping a redundant export is a
missed report; removing a required export can break a build or a downstream
consumer. Prefer the missed report whenever syntax alone cannot prove removal
safe.

Types in exported value signatures are the main risk. TypeScript may need an
apparently unused type name while emitting a `.d.ts`, including from a different
module or package. Typical failures include TS4023, TS4081/TS4082,
TS4060/TS4063, TS2742, and TS2883. The exact diagnostic depends on the
TypeScript version and syntax.

Knip applies this conservative protection even when its selected
`tsconfig.json` does not set `declaration: true`. A package may use another
build config or declaration tool, and consumers may infer the type into their
own public declarations. Absence from the selected config is not proof that
`tsc --declaration` or another declaration tool can remove the export safely.

### `isolatedDeclarations` does not make removal safe

`isolatedDeclarations` requires enough annotations to emit each source file
without cross-file inference. It says nothing about whether another package
can name a type after its `export` modifier is removed.

For example, an isolated library can emit this file with `Hook` private:

```ts
const brand: unique symbol = Symbol('hook');

type Hook = { readonly [brand]: true };
export const createHook = (): Hook => ({ [brand]: true });
```

A non-isolated consumer may still fail after that change:

```ts
import { createHook } from 'library';

export const wrap = () => createHook();
```

The library's own emit succeeds, but the consumer can fail with TS4023 because
its inferred return type cannot name the private brand. External consumers do
not inherit the library's compiler options.

Do not gate `isReferencedInUsedExport` on the defining workspace's
`isolatedDeclarations` setting. Such a change is safe only if the analysis can
also prove every downstream declaration shape nameable. Knip cannot currently
prove that.

Explicit annotations can narrow the syntax Knip must walk, but they do not
prove that a referenced type export is removable.

See:

- [`isolatedDeclarations` TSConfig reference][1]
- [TypeScript 5.5 release notes][2]
- [microsoft/TypeScript#5711][3]
- [Knip #1722: declaration export regression][4]
- [Knip #1903: internal return type report][5]

## Ownership of graph facts

Cross-file imports and re-exports belong to `ImportMaps`. Signature containment
belongs to the defining file:

- `referencedInExport` is built while walking one AST. It maps a local
  identifier to the exports whose declarations reference it.
- The map is copied to `Export.referencedIn` after the walk.
- `isReferencedInUsedExport` follows that local chain, then asks the module
  graph whether each containing export is live.

The containment chain never crosses a file boundary. Do not add a partial
`referencedInExport` relation to `ImportMaps`; calls, wrappers, nested values,
spreads, aliases, barrels, and entry exposure would all need complete semantics.
An incomplete edge creates declaration-breaking reports.

Every correctness-critical graph fact needs one canonical owner, complete
producer coverage, and a total meaning at its consumer. Optionality may encode
genuine absence; it must not hide incomplete assembly.

## `ignoreExportsUsedInFile`

This option defaults to `false`. By default, a same-file reference does not
keep an export alive. Setting the option to `true` is a code-organization
preference that lets selected local references count.

`localRefsVisitorObject` collects names in `localRefs` when the option is
enabled. After the walk, matching exports receive `hasRefsInFile = true`.
`shouldCountRefs` selects the eligible symbol types. Computed access such as
`obj[EXPORTED_KEY]` is included.

The signature-containment path is evaluated independently of this option and
protects declaration emit. By contrast, a reference such as `typeof X` inside
another exported type follows the configured same-file rules.

`isReferencedInUsedExport` remains local while walking `Export.referencedIn`.
For each containing export, it checks `hasRefsInFile`, runtime registration,
and external liveness through `explorer.isReferenced`. Only the liveness query
crosses the module graph.

## Chain collection

The `_collectRefsInType` walker records local identifiers that may affect an
exported declaration. Its full call shape is
`_collectRefsInType(node, exportName, signatureOnly, seen, inBody)`.

### Seeds

- Type aliases: walk `TSTypeAliasDeclaration.typeAnnotation`.
- Interfaces: walk `TSInterfaceDeclaration.body` and record direct `extends`
  identifiers with `addRefInExport`.
- Variables with a type annotation: walk `id.typeAnnotation`, not the
  initializer.
- Variables without a type annotation: walk the initializer with
  `signatureOnly = hasExplicitFunctionReturnType(init)`.
- Named, default, and declared functions: walk the function with
  `signatureOnly = hasExplicitFunctionReturnType(decl)`.
- Classes: use `signatureOnly = true` so method bodies are skipped.
- Destructured exports such as `export const { a } = factory()`: walk the
  initializer with `signatureOnly = false`.

### `signatureOnly`

With `signatureOnly = true`, the walker stops at `BlockStatement` and
`FunctionBody`. Parameters, return types, type parameters, annotations,
references, and queries remain visible.

With `signatureOnly = false`, the walker enters bodies because an inferred
return may depend on their syntax. Type aliases and interface bodies also use
the full walk.

### Deferred calls

When `_collectRefsInType` sees a `CallExpression`, it defers resolution until
forward-declared helpers exist in `localDeclarations`. There are two queues:

- `pendingCallRefs` follows a `callee` or argument that is an `Identifier`. It
  follows arguments only outside a function body, covering `wrap(inner)` and
  `() => wrap(inner)`.
- `pendingMemberCallRefs` follows a non-computed `MemberExpression` when its
  object is a local `Identifier` whose declaration contains an
  `ObjectExpression`. Resolution requires the selected property to contain a
  function and covers one-level patterns such as `helpers.recurse()`.

The drain walks each resolved helper with `signatureOnly = true`. A per-chain
`seen` set terminates cycles. Items queued during the drain are processed
before it ends.

Member-call resolution checks the initializer shape, not the declaration kind;
it does not require `const`.

Identifier arguments inside a function body are deliberately ignored. Following
`useReducer(localReducer, …)`, for example, would usually keep types that do not
appear in the outer inferred return.

### Body-local annotations

`inBody` becomes `true` below a `BlockStatement` or `FunctionBody`. In that
context:

- `TSAsExpression`, `TSTypeAssertion`, and `TSSatisfiesExpression` walk only
  their runtime `expression`.
- `VariableDeclarator` walks only its `init`.

This excludes the type side of an `as` cast such as
`JSON.parse('{}') as T`, along with local annotations such as `let x: T`.
Outside a body, the same annotations count; `export const x = parse() as T`
can determine the exported declaration.

Known limitation: an unannotated block body such as
`() => { return x as T; }` loses the `T` edge. Naming `T` in an explicit return
type makes the dependency visible. The annotation improves collection but does
not make `T` safe to de-export.

## Chain consumption

`isReferencedInUsedExport` walks from a candidate export toward the local
exports that contain it:

- For a type-to-type hop, the chain is eligible only when
  `ignoreExportsUsedInFile` counts the containing `type`, `interface`, or
  `enum`. Otherwise TypeScript can often inline the inner structural type.
- For a type-to-value hop, `ignoreExportsUsedInFile` does not stop the chain.
  A live containing value keeps the candidate alive. Some shapes can be
  inlined, but Knip cannot prove that from names alone; a nominal member,
  unique symbol, inferred wrapper, or downstream declaration can still require
  the export.

This is a conservative boundary, not a claim that every retained type is
required by TypeScript.

## Shadow detection

A local binding can shadow an exported name. `isShadowed(name, pos)` checks
whether `pos` falls inside a shadow range for `name`.

Ranges come from:

- `_addShadow` for block-scoped variables and nested functions, using the
  current `scopeDepth` range from `BlockStatement`
- `_addParamShadows` for function, arrow, and method parameters, using the
  function body because parameters are visited before its `BlockStatement`
- `CatchClause` bindings
- `ForInStatement` and `ForOfStatement` bindings, using the loop body because
  its `VariableDeclaration` is visited before the body block

`_collectBindingNames` handles object and array destructuring, assignment
patterns, and rest elements.

## Namespace and enum members

`ExportMember.hasRefsInFile` is separate from `Export.hasRefsInFile`. During
the AST walk, the flat `memberRefsInFile: string[]` field on `WalkState` stores
same-file references such as `Bar.value` as name/member pairs. Resolving
`memberRefsInFile` against `exports` after `walkAST` preserves forward
references. This is the same deferred-resolution pattern used by
`pendingCallRefs` and `bareExprRefs`.

`handleMemberExpression` and `coreVisitorObject.TSQualifiedName` queue those
pairs, while `localRefsVisitorObject.TSQualifiedName` records only the
namespace name in `localRefs`. The core visitor owns the member relation.

For a referenced namespace or enum, `analyze.ts` checks members without
`hasRefsInFile` through
`explorer.isReferenced(filePath, "Ns.member")`. `isReferenced` reports ordinary
reference usage and entry exposure separately. A namespace re-exported by an
entry stays public when `includeEntryExports` is off, while a plain entry import
does not.
`nsExports` and `nsTypes` refine member analysis after that public boundary;
they do not override it.

When an unimported namespace or enum has export-level
`hasRefsInFile = true`, member analysis is skipped because the whole export is
already considered live.

## Verification requirements

`packages/knip/test/e2e/fix-tsc.test.ts` is the declaration-safety harness. Each
fixture builds with `tsc` before `knip --fix`, runs the fix, and builds again.
The `e2e-lib-*` fixtures are copied to a temporary `pkg/` and compile a
downstream consumer before and after the fix.

The harness proves two separate directions:

- Keep fixtures catch names that Knip must not remove. The post-fix package or
  consumer build fails if a required export was stripped.
- Removal fixtures in `libFixtureRemovals` catch names Knip must report. Their
  source assertions fail if Knip becomes too conservative.

Keep coverage:

- `e2e-lib-typed-exports`: explicit return annotations on exported values
- `e2e-lib-export-star-as`: `export * as Ns from '…'`
- `e2e-lib-arrow-inferred-return`: inferred block return (`createHandler`)
- `e2e-lib-call-forward-decl`: forward-declared identifier callee
- `e2e-lib-member-call`: member callee such as `obj.method()`
- `e2e-lib-call-arg`: top-level identifier argument such as `wrap(inner)`

Removal coverage:

- `e2e-lib-as-cast-in-body`: body-local `as T`, type assertion, and
  `satisfies T`
- `e2e-lib-call-arg-in-body`: body-local call argument such as
  `useReducer(reducer, …)`, gated by `!inBody`

Before changing export liveness:

1. Add a focused fixture that fails for the intended reason before editing the
   graph.
2. Keep existing fixtures and assertions unchanged unless the old contract is
   independently proven wrong. In particular, a type-only issue must not alter
   class, function, or other value-export results. Preserve
   `packages/knip/test/ignore-exports-used-in-file/typeof-class.test.ts`.
3. Run `knip --fix`, then compile both the defining package and a downstream
   declaration consumer. A library-only emit is insufficient.
4. Include a nominal or non-inlineable shape when the proposal relies on
   structural inlining. A private `unique symbol` is a useful check.
5. Test the TypeScript version from the report when behavior may differ from the
   repository version.
6. Use integration snapshots only as supporting evidence. Investigate every new
   report and stop on broad or cross-category deltas.
7. Keep test-harness types and shared fixture tables stable.
   `libFixtureRemovals: Record<string, RegExp[]>` has one purpose: assert
   expected removals from the shared `src/handler.ts` shape. Use a focused
   assertion for a fixture with a different path instead of weakening that
   contract.

The #1903 pass-through return type remains intentionally protected. The
defining library's `isolatedDeclarations` setting is not enough to relax the
type-to-value edge. Revisit that decision only with a complete nameability
model and two-sided declaration-consumer tests.

[1]: https://www.typescriptlang.org/tsconfig#isolatedDeclarations
[2]: https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#isolated-declarations
[3]: https://github.com/microsoft/TypeScript/issues/5711
[4]: https://github.com/webpro-nl/knip/issues/1722
[5]: https://github.com/webpro-nl/knip/issues/1903
