import ts from 'typescript';
import { SymbolType } from '../../../types/issues.js';
import { exportVisitor as visit } from '../index.js';
import type { ExportPos } from '../../../types/exports.js';

export default visit(
  () => true,
  (node, { isFixExports }) => {
    if (ts.isExportAssignment(node)) {
      // Patterns:
      // export default 1;
      // export = identifier;
      const pos = node.getChildAt(1).getStart();
      const fix: ExportPos = isFixExports ? [node.getStart(), node.getEnd() + 1] : [];
      return { node, identifier: 'default', type: SymbolType.UNKNOWN, pos, fix };
    }
  }
);
