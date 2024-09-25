import ts, { preProcessFile } from 'typescript';
import type { Fix } from '../../../types/exports.js';
import { SymbolType } from '../../../types/issues.js';
import type { BoundSourceFile } from '../../SourceFile.js';
import { exportVisitor as visit } from '../index.js';

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
        const allElementStrings = node.exportClause.elements.map(element => element.getFullText());
        return node.exportClause.elements.map((element, index, arr) => {
          const identifier = String(element.name.text);
          const propName = element.propertyName?.text;
          // @ts-expect-error TODO Fix (convenience in addExport)
          // const symbol = element.symbol ?? declarations?.get(identifier)?.find((d: ts.Node) => d !== element)?.symbol;
          const symbol = declarations?.get(propName ?? identifier)?.[0]?.symbol;
          const pos = element.name.pos;

          const exportClause = node.exportClause;
          const fix1: Fix =
            isFixExports || isFixTypes
              ? {
                  element: element.getFullText(),
                  pos: [exportClause!.getStart(), exportClause!.getEnd()], //  TODO wrong, must be coordinates of {}
                  allElements: allElementStrings,
                  allExportPos: [node.getStart(), node.getEnd() + 1], // +1 for ';' or next line symbol
                }
              : undefined;
          // const fix: Fix = isFixExports || isFixTypes ? [element.getStart(), element.getEnd()] : undefined;
          return { node: element, symbol, identifier, type, pos, fix: fix1 };
        });
      }
    }
  }
);
