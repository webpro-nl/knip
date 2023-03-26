import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';

export default visit(
  () => true,
  node => {
    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos: node.expression.getStart() };
    }
  }
);
