import ts from 'typescript';
import type { Export, ExportMember } from '../types/dependency-graph.js';
import { isIdChar } from '../util/regex.js';

const isType = (item: Export | ExportMember) =>
  item.type === 'type' || item.type === 'interface' || item.type === 'member';

// Find internal references to export item for `ignoreExportsUsedInFile`
// Also detect usage of non-types within types (e.g. class or typeof within interface), as those should be exported as well
export const findInternalReferences = (
  item: Export | ExportMember,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  referencedSymbolsInExportedTypes: Set<ts.Symbol>
): [number, boolean] => {
  if (!item.symbol) return [0, false];
  if (item.identifier === '') return [1, false]; // not pretty, ideally we'd find ref(s) to empty-string enum key

  if (item.symbol.flags & ts.SymbolFlags.AliasExcludes) return [1, false];

  const text = sourceFile.text;
  const id = item.identifier;
  const symbols = new Set<ts.Symbol>();

  let refCount = 0;
  let isSymbolInExportedType = false;
  let index = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
  while (index < text.length && (index = text.indexOf(id, index)) !== -1) {
    if (!isIdChar(text.charAt(index - 1)) && !isIdChar(text.charAt(index + id.length))) {
      const isExportDeclaration = index === item.pos || index === item.pos + 1; // off-by-one from `stripQuotes`
      if (!isExportDeclaration) {
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        const symbol = typeChecker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, index));
        if (symbol) {
          const isInExportedType = referencedSymbolsInExportedTypes.has(symbol);

          if (isInExportedType) isSymbolInExportedType = true;

          if (item.symbol === symbol) {
            refCount++;
            if (isInExportedType || isType(item)) return [refCount, isSymbolInExportedType];
          }

          // @ts-expect-error Keep it cheap
          const declaration = symbol.declarations?.[0];
          if (declaration) {
            // Pattern: export { identifier }
            if (item.symbol === declaration.name?.flowNode?.node?.symbol) {
              return [++refCount, isSymbolInExportedType];
            }

            if (ts.isImportSpecifier(declaration) && symbols.has(symbol)) {
              // Consider re-exports referenced
              return [++refCount, isSymbolInExportedType];
            }
          }

          symbols.add(symbol);
        }
      }
    }
    index += id.length;
  }

  return [refCount, isSymbolInExportedType];
};
