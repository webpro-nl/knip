import ts from 'typescript';
import { FIX_FLAGS, SYMBOL_TYPE } from '../../../constants.js';
import type { Fix } from '../../../types/exports.js';
import type { BoundSourceFile } from '../../SourceFile.js';
import { isModule } from '../helpers.js';
import { exportVisitor as visit } from '../index.js';

export default visit(isModule, (node, { isFixExports, isFixTypes }) => {
  if (ts.isExportDeclaration(node)) {
    if (node.exportClause && ts.isNamedExports(node.exportClause)) {
      // Patterns:
      // export { identifier, type identifier2 };
      // export type { Identifier, Identifier2 };
      const nodeType = node.isTypeOnly ? SYMBOL_TYPE.TYPE : SYMBOL_TYPE.UNKNOWN;
      const sourceFile: BoundSourceFile = node.getSourceFile();
      const declarations = sourceFile.getNamedDeclarations?.();
      return node.exportClause.elements.map(element => {
        const identifier = String(element.name.text);
        const propName = element.propertyName?.text;
        // @ts-expect-error TODO Fix (convenience in addExport)
        // const symbol = element.symbol ?? declarations?.get(identifier)?.find((d: ts.Node) => d !== element)?.symbol;
        const symbol = declarations?.get(propName ?? identifier)?.[0]?.symbol;
        const pos = element.name.getStart();
        const type = element.isTypeOnly ? SYMBOL_TYPE.TYPE : nodeType;
        const fix: Fix =
          (isFixExports && type !== SYMBOL_TYPE.TYPE) || (isFixTypes && type === SYMBOL_TYPE.TYPE)
            ? [element.getStart(), element.getEnd(), FIX_FLAGS.OBJECT_BINDING | FIX_FLAGS.EMPTY_DECLARATION]
            : undefined;
        return { node: element, symbol, identifier, type, pos, fix };
      });
    }
  }
});
