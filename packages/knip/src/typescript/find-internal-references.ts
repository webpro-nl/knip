import ts from 'typescript';
import { timerify } from '../util/Performance.js';
import { isIdChar } from '../util/regex.js';
import type { ExportWithSymbol, MemberWithSymbol } from './get-imports-and-exports.js';

const findInFlow = (flowNode: any, targetSymbol: ts.Symbol): boolean => {
  if (!flowNode?.node) return false;
  if (flowNode.node.symbol === targetSymbol) return true;
  return findInFlow(flowNode.antecedent, targetSymbol);
};

// Find internal references to export item
// Detect usage of non-types within types (e.g. class or typeof within interface/type) to keep those exported
const hasRefsInFile = (
  item: ExportWithSymbol | MemberWithSymbol,
  sourceFile: ts.SourceFile,
  typeChecker: ts.TypeChecker
) => {
  if (!item.symbol) return false;
  if (item.identifier === '') return true; // not pretty, ideally we'd find ref(s) to empty-string enum key
  if (item.symbol.flags & ts.SymbolFlags.AliasExcludes) return true;

  const text = sourceFile.text;
  const id = item.identifier;
  const symbols = new Set<ts.Symbol>();
  const pos = item.pos;
  let index = 0;

  // biome-ignore lint: suspicious/noAssignInExpressions
  while (index < text.length && (index = text.indexOf(id, index)) !== -1) {
    if (!isIdChar(text.charAt(index - 1)) && !isIdChar(text.charAt(index + id.length))) {
      // Might be off-by-one from `stripQuotes`
      if (index !== pos && index !== pos + 1) {
        // @ts-expect-error ts.getTokenAtPosition is internal fn
        const symbol = typeChecker.getSymbolAtLocation(ts.getTokenAtPosition(sourceFile, index));
        if (symbol && id === symbol.escapedName) {
          if (item.symbol === symbol) return true;

          const declaration = symbol.declarations?.[0];
          if (declaration) {
            // @ts-expect-error Keep it cheap
            if (findInFlow(declaration.name?.flowNode, item.symbol)) return true;
            // Consider re-exports referenced
            if (ts.isImportSpecifier(declaration) && symbols.has(symbol)) return true;
          }

          if (symbol.flags & ts.SymbolFlags.Property) {
            const type = typeChecker.getTypeOfSymbol(symbol);
            if (type?.symbol && item.symbol === type.symbol) return true;
          }

          symbols.add(symbol);
        }
      }
    }
    index += id.length;
  }

  return false;
};

export const _hasRefsInFile = timerify(hasRefsInFile);
