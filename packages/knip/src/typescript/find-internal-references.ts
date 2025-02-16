import ts from 'typescript';
import type { Export, ExportMember } from '../types/module-graph.js';
import { isIdChar } from '../util/regex.js';

export const isType = (item: Export | ExportMember) =>
  item.type === 'type' || item.type === 'interface' || item.type === 'enum';

// Find internal references to export item
// Detect usage of non-types within types (e.g. class or typeof within interface/type) to keep those exported
export const findInternalReferences = (
  item: Export | ExportMember,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker,
  referencedSymbolsInExport: Set<ts.Symbol>,
  isBindingElement?: boolean
): [number, boolean] => {
  if (!item.symbol) return [0, false];
  if (item.identifier === '') return [1, false]; // not pretty, ideally we'd find ref(s) to empty-string enum key

  if (item.symbol.flags & ts.SymbolFlags.AliasExcludes) return [1, false];

  const text = sourceFile.text;
  const id = item.identifier;
  const symbols = new Set<ts.Symbol>();

  let refCount = 0;
  let isSymbolInExport = false;
  let index = 0;

  // biome-ignore lint/suspicious/noAssignInExpressions: deal with it
  while (index < text.length && (index = text.indexOf(id, index)) !== -1) {
    if (!isIdChar(text.charAt(index - 1)) && !isIdChar(text.charAt(index + id.length))) {
      const isExportDeclaration = index === item.pos || index === item.pos + 1; // off-by-one from `stripQuotes`
      if (!isExportDeclaration) {
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        const symbol = typeChecker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, index));
        if (symbol) {
          const isInExport = referencedSymbolsInExport.has(symbol);

          if (isInExport) isSymbolInExport = true;

          if (item.symbol === symbol) {
            refCount++;
            if (isBindingElement) return [refCount, true];
          }

          // @ts-expect-error Keep it cheap
          const declaration = symbol.declarations?.[0];
          if (declaration) {
            // Pattern: export { identifier }
            if (item.symbol === declaration.name?.flowNode?.node?.symbol) {
              return [++refCount, isSymbolInExport];
            }

            if (ts.isImportSpecifier(declaration) && symbols.has(symbol)) {
              // Consider re-exports referenced
              return [++refCount, isSymbolInExport];
            }
          }

          symbols.add(symbol);
        }
      }
    }
    index += id.length;
  }

  return [refCount, isSymbolInExport];
};
