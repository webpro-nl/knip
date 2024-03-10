import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';
import type { Fix } from '../../../types/exports.js';
import type { BoundSourceFile } from '../../SourceFile.js';

export default visit(
  () => true,
  (node, { isFixExports, isFixTypes }) => {
    if (ts.isExportDeclaration(node)) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        // Patterns:
        // export { identifier, identifier2 };
        // export type { Identifier, Identifier2 };
        const type = node.isTypeOnly ? SymbolType.TYPE : SymbolType.UNKNOWN;
        const sourceFile: BoundSourceFile = node.getSourceFile();
        const declarations = sourceFile.getNamedDeclarations?.();
        return node.exportClause.elements.map(element => {
          const identifier = String(element.name.escapedText);
          const declaration = declarations?.get(identifier)?.find((d: ts.Node) => d !== element);
          const pos = element.name.pos;
          const fix: Fix = isFixExports || isFixTypes ? [element.getStart(), element.getEnd()] : undefined;
          // @ts-expect-error TODO Fix (convenience in addExport)
          return { node: element, symbol: declaration?.symbol, identifier, type, pos, fix };
        });
      }
    }
  }
);
