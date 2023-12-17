import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';
import type { Fix } from '../../../types/exports.js';

export default visit(
  () => true,
  (node, { isFixExports }) => {
    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      const pos = node.getChildAt(1).getStart();
      const fix: Fix = isFixExports ? [node.getStart(), node.getEnd() + 1] : undefined;
      return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos, fix };
    }
  }
);
